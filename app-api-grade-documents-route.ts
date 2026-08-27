import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserOrNull } from '@/lib/currentUser'
import { getAllSectionAccess } from '@/lib/permissions'
import { logAudit } from '@/lib/logger'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * آپلود سند فنی گرید (PDF) — تنها جایی که رکورد GradeDocument ساخته می‌شه.
 *
 * چرا Route Handler، در حالی که همه‌ی نوشتن‌های سایت Server Action هستن؟
 * سقف پیش‌فرض بدنه‌ی Server Action یک مگابایته و next.config.ts خالیه — یه COA
 * اسکن‌شده راحت از این سقف می‌زنه بالا و آپلود بی‌صدا شکست می‌خوره. Route Handler
 * چنین سقفی نداره، پس فرمِ آپلود مستقیم به همین‌جا POST می‌کنه.
 *
 * خطا به‌جای throw، با یه کد کوتاه توی query string برمی‌گرده (docError=...) تا
 * کارشناس پیام فارسی رو روی همون /admin-grades ببینه، نه صفحه‌ی خطای Next.
 */

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'grades')

/** انواع مجاز سند — دقیقاً همون مقادیری که docType روی اسکیما می‌گیره */
const DOC_TYPES = ['tds', 'sds', 'coa', 'certificate', 'other']

/** سقف حجم فایل — بالاتر از این، دیسک سرور بی‌دلیل پر می‌شه */
const MAX_FILE_SIZE = 20 * 1024 * 1024

/**
 * برگشت به صفحه‌ی گریدها. دو نکته که نباید عوض بشن:
 *   ۱. کد ۳۰۳ (نه ۳۰۷): مرورگر باید POST رو به GET تبدیل کنه، وگرنه دوباره
 *      همون بدنه رو می‌فرسته و سند تکراری ساخته می‌شه.
 *   ۲. Location نسبی (نه new URL(..., request.url)): پشت nginx، آدرس مطلقِ
 *      ساخته‌شده از request.url به localhost اشاره می‌کنه.
 */
function backToGrades(gradeId: string, errorCode?: string) {
  const query = new URLSearchParams()
  if (gradeId) query.set('grade', gradeId)
  if (errorCode) query.set('docError', errorCode)
  const qs = query.toString()
  return new NextResponse(null, {
    status: 303,
    headers: { Location: qs ? `/admin-grades?${qs}` : '/admin-grades' },
  })
}

export async function POST(request: Request) {
  // getCurrentUser اینجا به‌کار نمیاد: ریدایرکتش ۳۰۷ه و متد POST رو نگه می‌داره،
  // پس /login با ۴۰۵ جواب می‌ده. نسخه‌ی بی‌ریدایرکت + ۳۰۳ دستی درستشه.
  const user = await getCurrentUserOrNull()
  if (!user) return new NextResponse(null, { status: 303, headers: { Location: '/login' } })

  // همون قاعده‌ی requireGradeEditAccess در admin-grades/actions.ts
  if (user.role !== 'admin') {
    const access = await getAllSectionAccess(user.id)
    if (access.grades !== 'edit' && access.grades !== 'full') {
      return backToGrades('', 'forbidden')
    }
  }

  const formData = await request.formData()
  const gradeId = String(formData.get('gradeId') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const docType = String(formData.get('docType') || 'other').trim()
  const file = formData.get('file')

  if (!gradeId) return backToGrades('', 'no-grade')
  if (!title) return backToGrades(gradeId, 'no-title')
  if (!DOC_TYPES.includes(docType)) return backToGrades(gradeId, 'bad-type')
  if (!(file instanceof File) || file.size === 0) return backToGrades(gradeId, 'no-file')

  // هم content-type و هم پسوند چک می‌شن — بعضی مرورگرها type رو خالی می‌فرستن.
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return backToGrades(gradeId, 'not-pdf')
  if (file.size > MAX_FILE_SIZE) return backToGrades(gradeId, 'too-big')

  const grade = await prisma.grade.findUnique({ where: { id: gradeId }, select: { id: true, code: true } })
  if (!grade) return backToGrades('', 'no-grade')

  // همون الگوی lib/kyc.ts — ذخیره روی دیسک محلی زیر public تا مستقیم سرو بشه.
  // اسم فایل هرگز از نام آپلودی ساخته نمی‌شه (جلوگیری از path traversal و تکرار).
  const gradeDir = path.join(UPLOAD_ROOT, grade.id)
  await fs.mkdir(gradeDir, { recursive: true })
  const fileName = `${docType}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(path.join(gradeDir, fileName), buffer)

  const doc = await prisma.gradeDocument.create({
    data: {
      gradeId: grade.id,
      title,
      docType,
      fileUrl: `/uploads/grades/${grade.id}/${fileName}`,
    },
  })

  await logAudit('grades', `سند فنی «${title}» برای گرید ${grade.code} آپلود شد`, user.id, {
    gradeId: grade.id,
    documentId: doc.id,
    docType,
    fileSize: file.size,
  })

  // هیچ revalidatePath لازم نیست: /admin-grades کوکی می‌خونه و صفحه‌های عمومی
  // گرید صریحاً force-dynamic هستن، پس هر دو در هر درخواست تازه رندر می‌شن.
  return backToGrades(grade.id)
}
