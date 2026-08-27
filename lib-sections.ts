// این فایل عمداً هیچ وابستگی به prisma یا هر چیز سرور-فقط نداره —
// چون توسط کامپوننت‌های کلاینتی (مثل AdminNav) هم import می‌شه.
// اگه چیزی اینجا رو به prisma وصل کنی، دوباره همون خطای بیلد قبلی برمی‌گرده
// (bundle شدن پکیج pg برای مرورگر که ممکن نیست).

// isReal: true فقط برای بخش‌هایی که واقعاً یه صفحه‌ی Next.js دارن —
// بقیه هنوز استاتیک/ساخته‌نشده‌ن، و توی AdminNav به‌جای لینک شکسته،
// به‌صورت غیرفعال با نشان «به‌زودی» نمایش داده می‌شن.

// ⚠️ نکته‌ی نام‌گذاری: بخش logistics پایین، بخشِ *داخلیِ* هماهنگی حمل‌ونقلِ خودِ انبار پلیمره
// (`/admin-logistics`). پنل مدیر شرکت حمل‌ونقل («یوزر لجیستیک») چیز دیگه‌ایه و مسیرش
// `/transport-panel` است — هیچ ربطی به این بخش نداره و توی این منو نمیاد.
// ردیابی محموله‌ی خریدار/فروشنده هم چیز سومیه (`/transport` توی UserNav).
export const SECTION_KEYS = [
  { key: 'orders', label: 'سفارش‌ها', href: '/admin-orders', isReal: true },
  { key: 'deals', label: 'معاملات تجاری', href: '/admin-deals', isReal: true },
  { key: 'disputes', label: 'رسیدگی به اختلاف', href: '/admin-disputes', isReal: true },
  { key: 'pricing', label: 'مرکز قیمت‌گذاری (بنچمارک)', href: '/admin-pricing', isReal: false },
  { key: 'warehouses', label: 'انبارها و موجودی', href: '/admin-warehouses', isReal: false },
  { key: 'grades', label: 'مدیریت گریدها و مشخصات فنی', href: '/admin-grades', isReal: true },
  { key: 'material-listings', label: 'شبکه عرضه مواد اولیه', href: '/admin-material-listings', isReal: false },
  { key: 'payments', label: 'تایید فیش‌های پرداخت', href: '/admin-payments', isReal: true },
  { key: 'logistics', label: 'حمل و نقل — هماهنگی داخلی', href: '/admin-logistics', isReal: false },
  { key: 'articles', label: 'مقالات و اخبار', href: '/admin-articles', isReal: false },
  { key: 'documents', label: 'اسناد (TDS/MSDS)', href: '/admin-documents', isReal: false },
  { key: 'support', label: 'پشتیبانی و تیکت‌ها', href: '/admin-support', isReal: false },
  { key: 'buyers', label: 'خریداران', href: '/admin-buyers', isReal: false },
  { key: 'users', label: 'مدیریت کاربران و دسترسی‌ها', href: '/admin-users', isReal: true },
  { key: 'kyc', label: 'احراز هویت کاربران', href: '/admin-kyc', isReal: true },
  { key: 'logs', label: 'لاگ سیستم و فعالیت', href: '/admin-logs', isReal: true },
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]['key']
export type AccessLevel = 'none' | 'view' | 'edit' | 'full'
