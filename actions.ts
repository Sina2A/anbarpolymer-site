'use server'

// اکشن‌های پنل مدیریت گریدها — نسخه‌ی کامل با ۴ دسته‌ی قابلیت جدید:
//
//  ۱. مشخصات فنی ۷۲تایی: specsJson از FormData خونده و به‌صورت JSON ذخیره می‌شه.
//  ۲. MFI و چگالی اجباری در ساخت (و ویرایش) — نه فقط UI، بلکه سمت سرور.
//  ۳. آپلود عکس محصول و دیتاشیت PDF روی دیسک محلی (الگوی kyc)، + پاک‌کردن.
//  ۴. ایمپورت انبوه CSV (ساخت و ویرایش بر اساس کد)، با گزارش خطاها.
//
// CSV به‌جای xlsx باینری انتخاب شده چون سرور سابقه‌ی ETIMEDOUT روی
// npm install داره و نخواستیم پکیج جدید اضافه بشه. اکسل CSV با UTF-8
// رو به‌راحتی باز/ذخیره می‌کنه.

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { getAllSectionAccess } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  readSpecsFromFormData,
  serializeSpecs,
  CSV_ALL_COLUMNS,
  CSV_BASE_COLUMNS,
} from '@/lib/gradeSpecs'

/** چک دسترسی نوشتن — مدیر همیشه مجاز، کارشناس فقط اگه canEdit روی بخش «grades» داشته باشه. */
async function requireGradeEditAccess() {
  const user = await getCurrentUser()
  if (user.role === 'admin') return user
  const access = await getAllSectionAccess(user.id)
  if (access.grades !== 'edit' && access.grades !== 'full') {
    throw new Error('دسترسی ویرایش گریدها رو نداری — از مدیر بخواه بهت بده.')
  }
  return user
}

// ---------------------------------------------------------------- کار با عدد

/** «230,5» یا «230.5» رو عدد کن. خالی → null. اکسل ممکنه با ممیز فارسی بشینه. */
function toFloatOrNull(s: string | undefined | null): number | null {
  const t = (s ?? '').trim().replace(/٬/g, '').replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------- آپلود فایل

const GRADE_UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'grades')

const ALLOWED_EXT: Record<'image' | 'datasheet', string[]> = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  datasheet: ['pdf'],
}

/**
 * ذخیره‌ی فایل روی دیسک و برگردوندن آدرس عمومی.
 * adad های قبلی جدا هستن: public/uploads/grades/typ و gradeId.
 * همون الگوی saveDocumentToLocalDisk توی src/lib/kyc.ts.
 */
async function saveGradeFile(gradeId: string, file: File, kind: 'image' | 'datasheet'): Promise<string> {
  if (!file || file.size === 0) throw new Error('فایلی انتخاب نشده.')
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXT[kind].includes(ext)) {
    throw new Error(kind === 'image' ? 'فقط تصویر (jpg/png/webp) مجازه.' : 'فقط فایل PDF مجازه.')
  }
  const dir = path.join(GRADE_UPLOAD_ROOT, kind, gradeId)
  await fs.mkdir(dir, { recursive: true })
  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
  const filePath = path.join(dir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)
  return `/uploads/grades/${kind}/${gradeId}/${fileName}`
}

/** فایل قدیمی رو از دیسک پاک کن — اگه وجود داشت. خطاش مهم نیست. */
async function removeStoredFile(url: string | null | undefined) {
  if (!url) return
  const full = path.join(process.cwd(), 'public', url.replace(/^\/+/, ''))
  try {
    await fs.unlink(full)
  } catch {
    /* فایل از قبل بوده یا پاک شده — مهم نیست */
  }
}

// ---------------------------------------------------------------- ساخت گرید

export async function createGradeAction(formData: FormData) {
  const user = await requireGradeEditAccess()

  const code = String(formData.get('code') || '').trim()
  const producer = String(formData.get('producer') || '').trim()
  const category = String(formData.get('category') || '').trim()
  const mfiNum = toFloatOrNull(String(formData.get('mfi') || ''))
  const densityNum = toFloatOrNull(String(formData.get('density') || ''))

  // MFI و چگالی اجباری‌ان — هم اینجا (سرور) هم توی UI.
  if (!code || !producer || !category) {
    throw new Error('کد گرید، تولیدکننده، و نوع ماده اجباری‌ان.')
  }
  if (mfiNum === null || densityNum === null) {
    throw new Error('MFI و چگالی (دانسیته) اجباری‌ان — مقدار عددی معتبر وارد کن.')
  }

  await prisma.grade.create({
    data: {
      code,
      producer,
      category,
      polymerFamily: String(formData.get('polymerFamily') || '').trim() || null,
      applicationType: String(formData.get('applicationType') || '').trim() || null,
      mfi: mfiNum,
      mfiTestCondition: String(formData.get('mfiTestCondition') || '').trim() || null,
      density: densityNum,
      originCountry: String(formData.get('originCountry') || 'IR').trim() || 'IR',
      packagingType: String(formData.get('packagingType') || '').trim() || null,
      description: String(formData.get('description') || '').trim() || null,
      // مشخصات فنی ۷۲تایی — فقط فیلدهای تیک‌خورده و پر شده
      specsJson: serializeSpecs(readSpecsFromFormData(formData)),
      createdById: user.id,
    },
  })

  revalidatePath('/admin-grades')
  revalidatePath('/grades')
}

// ---------------------------------------------------------------- ویرایش گرید

export async function updateGradeAction(formData: FormData) {
  await requireGradeEditAccess()

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('گرید مشخص نیست.')

  const mfiNum = toFloatOrNull(String(formData.get('mfi') || ''))
  const densityNum = toFloatOrNull(String(formData.get('density') || ''))
  if (mfiNum === null || densityNum === null) {
    throw new Error('MFI و چگالی (دانسیته) اجباری‌ان — مقدار عددی معتبر وارد کن.')
  }

  await prisma.grade.update({
    where: { id },
    data: {
      code: String(formData.get('code') || '').trim(),
      producer: String(formData.get('producer') || '').trim(),
      category: String(formData.get('category') || '').trim(),
      polymerFamily: String(formData.get('polymerFamily') || '').trim() || null,
      applicationType: String(formData.get('applicationType') || '').trim() || null,
      mfi: mfiNum,
      mfiTestCondition: String(formData.get('mfiTestCondition') || '').trim() || null,
      density: densityNum,
      originCountry: String(formData.get('originCountry') || 'IR').trim() || 'IR',
      packagingType: String(formData.get('packagingType') || '').trim() || null,
      description: String(formData.get('description') || '').trim() || null,
      // اگه همه‌ی فیلدها خالی شد → null (پاک‌سازی کامل). اگه فقط بعضی → اون‌ها ذخیره می‌شن.
      specsJson: serializeSpecs(readSpecsFromFormData(formData)),
    },
  })

  revalidatePath('/admin-grades')
  revalidatePath('/grades')
  revalidatePath(`/grades/${String(formData.get('code') || '').trim()}`)
}

/** غیرفعال/فعال‌سازی — نه حذف، چون سفارش/آگهی‌های قدیمی ممکنه بهش ارجاع داشته باشن. */
export async function toggleGradeActiveAction(formData: FormData) {
  await requireGradeEditAccess()

  const id = String(formData.get('id') || '')
  const value = formData.get('value') === 'true'
  await prisma.grade.update({ where: { id }, data: { isActive: value } })
  revalidatePath('/admin-grades')
  revalidatePath('/grades')
}

// ---------------------------------------------------------------- آپلود/پاک‌کردن رسانه

export async function uploadGradeImageAction(formData: FormData) {
  await requireGradeEditAccess()

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('گرید مشخص نیست.')

  const file = formData.get('imageFile') as File | null
  if (!file || file.size === 0) throw new Error('تصویری انتخاب نشده.')

  const old = await prisma.grade.findUnique({ where: { id }, select: { imageUrl: true } })
  const url = await saveGradeFile(id, file, 'image')
  await prisma.grade.update({ where: { id }, data: { imageUrl: url } })
  await removeStoredFile(old?.imageUrl)

  revalidatePath('/admin-grades')
  revalidatePath('/grades')
  revalidatePath(`/grades/${String(formData.get('code') || '').trim()}`)
  redirect('/admin-grades?media=image')
}

export async function uploadGradeDatasheetAction(formData: FormData) {
  await requireGradeEditAccess()

  const id = String(formData.get('id') || '')
  if (!id) throw new Error('گرید مشخص نیست.')

  const file = formData.get('datasheetFile') as File | null
  if (!file || file.size === 0) throw new Error('فایلی انتخاب نشده.')

  const old = await prisma.grade.findUnique({ where: { id }, select: { datasheetUrl: true } })
  const url = await saveGradeFile(id, file, 'datasheet')
  await prisma.grade.update({ where: { id }, data: { datasheetUrl: url } })
  await removeStoredFile(old?.datasheetUrl)

  revalidatePath('/admin-grades')
  revalidatePath('/grades')
  revalidatePath(`/grades/${String(formData.get('code') || '').trim()}`)
  redirect('/admin-grades?media=datasheet')
}

/** پاک‌کردن عکس یا دیتاشیت — «kind» مشخص می‌کنه کدوم. فایل از دیسک هم حذف می‌شه. */
export async function clearGradeMediaAction(formData: FormData) {
  await requireGradeEditAccess()

  const id = String(formData.get('id') || '')
  const kind = formData.get('kind') === 'image' ? 'image' : 'datasheet'
  if (!id) throw new Error('گرید مشخص نیست.')

  const found = await prisma.grade.findUnique({ where: { id }, select: { imageUrl: true, datasheetUrl: true } })
  if (!found) throw new Error('گرید پیدا نشد.')

  await prisma.grade.update({ where: { id }, data: kind === 'image' ? { imageUrl: null } : { datasheetUrl: null } })
  await removeStoredFile(kind === 'image' ? found.imageUrl : found.datasheetUrl)

  revalidatePath('/admin-grades')
  revalidatePath('/grades')
  redirect('/admin-grades?media=cleared')
}

// ---------------------------------------------------------------- ایمپورت CSV

/** پارسر CSV ساده ولی سالم: هدر در خط اول، کوتیشن، کامای داخل کوتیشن، BOM فارسی. */
function parseCsvText(text: string): string[][] {
  let t = text.replace(/^﻿/, '')
  t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const rows: string[][] = []
  let cur: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      cur.push(cell)
      cell = ''
    } else if (ch === '\n') {
      cur.push(cell)
      cell = ''
      rows.push(cur)
      cur = []
    } else {
      cell += ch
    }
  }
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell)
    rows.push(cur)
  }

  // خط‌های کاملاً خالی رو نادیده بگیر
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function getCell(row: Record<string, string>, col: string): string {
  return (row[col] ?? '').trim()
}

export async function importGradesCsvAction(formData: FormData) {
  const user = await requireGradeEditAccess()

  const file = formData.get('csvFile') as File | null
  if (!file || file.size === 0) throw new Error('فایل CSV انتخاب نشده.')

  const lines = parseCsvText(await file.text())
  if (lines.length === 0) throw new Error('فایل خالیه.')

  const header = lines[0]
  const fieldIndex = new Map<string, number>()
  header.forEach((h, i) => {
    const key = h.trim()
    if (key) fieldIndex.set(key, i)
  })
  if (!fieldIndex.has('code')) {
    throw new Error('ستون «code» در هدر فایل پیدا نشد — از فایل قالب استفاده کن.')
  }

  const dataRows = lines.slice(1).map((cells) => {
    const row: Record<string, string> = {}
    for (const [col, i] of fieldIndex) {
      row[col] = (cells[i] ?? '').trim()
    }
    return row
  })

  let added = 0
  let updated = 0
  const skipped: string[] = []

  for (let lineIdx = 0; lineIdx < dataRows.length; lineIdx++) {
    const row = dataRows[lineIdx]
    const lineNo = lineIdx + 2 // +2 چون هدر خط ۱
    const code = getCell(row, 'code')
    if (!code) {
      skipped.push(`خط ${lineNo}: بدون کد`)
      continue
    }

    const existing = await prisma.grade.findUnique({
      where: { code },
      select: { id: true, specsJson: true, mfi: true, density: true, producer: true, category: true },
    })

    // --- مشخصات فنی: برای ساخت از صفر، برای ویرایش فقط ستون‌های خالی‌نشده merge می‌شن.
    const specsIn: Record<string, string> = {}
    for (const col of CSV_ALL_COLUMNS) {
      if (CSV_BASE_COLUMNS.includes(col as (typeof CSV_BASE_COLUMNS)[number])) continue
      const v = getCell(row, col)
      if (v) specsIn[col] = v
    }
    const prevSpecs = existing ? safeParseSpecs(existing.specsJson) : {}
    const mergedSpecs = { ...prevSpecs, ...specsIn } // در ویرایش، کلید بی‌مقدار = دست‌نخورده
    const specsJson = serializeSpecs(mergedSpecs)

    const mfiNum = toFloatOrNull(getCell(row, 'mfi'))
    const densityNum = toFloatOrNull(getCell(row, 'density'))

    if (!existing) {
      // --- ساخت جدید
      const producer = getCell(row, 'producer')
      const category = getCell(row, 'category')
      if (!producer || !category) {
        skipped.push(`خط ${lineNo} (${code}): تولیدکننده یا نوع ماده نداره`)
        continue
      }
      if (mfiNum === null || densityNum === null) {
        skipped.push(`خط ${lineNo} (${code}): MFI یا چگالی نداره`)
        continue
      }
      await prisma.grade.create({
        data: {
          code,
          producer,
          category,
          polymerFamily: getCell(row, 'polymerFamily') || null,
          applicationType: getCell(row, 'applicationType') || null,
          mfi: mfiNum,
          mfiTestCondition: getCell(row, 'mfiTestCondition') || null,
          density: densityNum,
          originCountry: getCell(row, 'originCountry') || 'IR',
          packagingType: getCell(row, 'packagingType') || null,
          description: getCell(row, 'description') || null,
          specsJson,
          createdById: user.id,
        },
      })
      added++
    } else {
      // --- ویرایش: سلول خالی یعنی «همون قبلی» — نمی‌تونیم چند چیز رو با خالی پاک کنیم
      await prisma.grade.update({
        where: { code },
        data: {
          producer: getCell(row, 'producer') || existing.producer || '',
          category: getCell(row, 'category') || existing.category || '',
          polymerFamily: getCell(row, 'polymerFamily') || null,
          applicationType: getCell(row, 'applicationType') || null,
          mfi: mfiNum ?? existing.mfi,           // خالی → نگه‌داشتن مقدار فعلی
          mfiTestCondition: getCell(row, 'mfiTestCondition') || null,
          density: densityNum ?? existing.density,
          originCountry: getCell(row, 'originCountry') || 'IR',
          packagingType: getCell(row, 'packagingType') || null,
          description: getCell(row, 'description') || null,
          specsJson,
        },
      })
      updated++
    }
  }

  revalidatePath('/admin-grades')
  revalidatePath('/grades')

  const reasonParam = skipped.slice(0, 8).join(' | ')
  const q = new URLSearchParams()
  q.set('imported', String(added))
  q.set('updated', String(updated))
  q.set('skipped', String(skipped.length))
  if (reasonParam) q.set('reasons', reasonParam)
  redirect(`/admin-grades?${q.toString()}`)
}

/** parsring امن specsJson بدون throw — هرگز نباید به‌خاطر دیتای قدیمی خطا بده. */
function safeParseSpecs(specsJson: string | null | undefined): Record<string, string> {
  if (!specsJson) return {}
  try {
    const raw = JSON.parse(specsJson)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v !== null && v !== undefined) out[k] = String(v)
    }
    return out
  } catch {
    return {}
  }
}