/**
 * اسکریپت ساخت حساب خریدار تستی — یه‌بار اجرا می‌شه.
 * phoneVerified از ابتدا true ست می‌شه تا نیازی به OTP واقعی نباشه.
 *
 *   node scripts/seed-test-buyer.js
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf-8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) return
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  })
}
loadEnvFile()

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const COMPANY_NAME = 'کاربر تست خریدار'
const USERNAME = 'testbuyer'
const PHONE = '09120000001'
const PASSWORD = 'Test@1234'

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL پیدا نشد. مطمئن شو فایل .env توی همین پوشه هست.')
    process.exit(1)
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const byUsername = await prisma.user.findUnique({ where: { username: USERNAME } })
  if (byUsername) {
    console.error(`❌ کاربری با username «${USERNAME}» از قبل وجود داره — چیزی ساخته نشد.`)
    console.error('اگه می‌خوای دوباره بسازیش، اون رکورد رو از دیتابیس پاک کن.')
    await prisma.$disconnect()
    process.exit(1)
  }

  const byPhone = await prisma.user.findUnique({ where: { phone: PHONE } })
  if (byPhone) {
    console.error(`❌ کاربری با شماره «${PHONE}» از قبل وجود داره — چیزی ساخته نشد.`)
    await prisma.$disconnect()
    process.exit(1)
  }

  await prisma.user.create({
    data: {
      companyName: COMPANY_NAME,
      username: USERNAME,
      phone: PHONE,
      passwordHash: hashPassword(PASSWORD),
      role: 'buyer',
      isActive: true,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      passwordChangedAt: new Date(),
    },
  })

  console.log('✓ حساب تستی ساخته شد:')
  console.log('  یوزرنیم:', USERNAME)
  console.log('  یا شماره:', PHONE)
  console.log('  رمز عبور:', PASSWORD)
  console.log('')
  console.log('از /login با هرکدام از یوزرنیم یا شماره وارد شو.')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('خطا در ساخت حساب:', e)
  process.exit(1)
})
