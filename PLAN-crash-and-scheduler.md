# پلن — رفع کرش admin-deals + زمان‌بند خودکار مهلت‌ها

> مبنا: آخرین کد سایت که از روی هم گذاشتن همه‌ی آرشیوهای آپلودشده به ترتیب ساخته شد (آخرینش `fix-map-zindex.tar.gz`).
> هیچ چیزی اجرا، build یا migrate نشده. این فقط پلنه و منتظر تایید تو می‌مونه.

---

## خلاصه‌ی تصمیم‌ها

| موضوع | پیشنهاد |
|---|---|
| علت کرش | Prisma Client یا Build کهنه روی سرور (کد مشکلی نداره). رفع اصلیش سمت سروره. توی کد هم یه `select` صریح اضافه می‌شه که دیگه این صفحه به این خطا نخوره |
| مکانیزم زمان‌بند | یه Endpoint محافظت‌شده به اسم `/api/cron/deadlines` که crontab سرور **هر ۱۵ دقیقه** صداش می‌زنه، به همون روش `poller.py` |
| ذخیره‌ی ۳ اجرای آخر | جدول موجود `SystemLog`. **نیازی به تغییر Schema یا Migration نیست** |
| اجرای هم‌زمان دوتا اجرا | هر آیتم فقط وقتی تغییر می‌کنه که وضعیتش هنوز همونی باشه که انتظار داریم (این کنترل رو بهش می‌گم «گارد وضعیت»). قفل پایگاه‌داده‌ای (advisory lock) لازم نیست |
| اجرای دستی | ثبت می‌شه با برچسب «دستی». لیست نمایشی فقط اجراهای خودکار رو نشون می‌ده (تاییدشده) |
| صف‌ها و اجراهای تنبل دیگه | فهرست کامل در بخش ۳. تصمیمش با تو |

---

# بخش ۱ — کرش admin-deals

## تشخیص
- `grep -rn packagingType src/ prisma/schema.prisma` نشون می‌ده **هیچ کدی دیگه `Grade.packagingType` رو نمی‌خونه**. تنها ارجاع‌های باقی‌مونده مال این دو مدل‌ان:
  - `WarehouseStock` (در `admin-warehouses/actions.ts` و `admin-warehouses/page.tsx` و `warehouses/[id]/page.tsx`)
  - `MaterialListing` (در ۴ فایلی که نباید بهشون دست زد)
- `admin-deals/page.tsx:56-66` **همه‌ی** معامله‌ها رو یه‌جا این‌طوری می‌خونه:
  `materialListing: { include: { grade: true, ... } }` و `purchaseRequest: { include: { grade: true } }`.
  `grade: true` یعنی «همه‌ی ستون‌هایی که Client ساخته‌شده برای Grade می‌شناسه». اگه Client قبل از Migration `20260926000000_move_packaging_and_producer_gate` ساخته شده باشه، هنوز `packagingType` رو SELECT می‌کنه و خطای P2022 می‌گیره. این‌که فقط با باز شدن «یه معامله‌ی خاص» خطا دیده شده هم با این جور درمیاد: فقط معامله‌ای که آگهی یا درخواست خرید با گرید داره این `include` رو پر می‌کنه، و چون کل صفحه یه‌جا روی سرور رندر می‌شه، کل صفحه ۵۰۰ می‌ده.
- همین الگوی `grade: true` یا `grade: {` در **۵۴ جای** دیگه‌ی `src/` هم هست (بازار، RFQ، سفارش‌ها و ...). اگه Client کهنه باشه، اون صفحه‌ها هم به محض رسیدن به یه ردیف با گرید می‌شکنن. برای همین رفع اصلی باید سمت سرور باشه، نه با دست زدن به تک‌تک Queryها.

## دستورهای تشخیص روی سرور (سینا اجرا کنه)
```bash
cd /var/www/anbarpolymer-app
grep -n "packagingType" node_modules/.prisma/client/schema.prisma   # اگه زیر model Grade بود → Client کهنه‌ست
npx prisma migrate status
pm2 list
pm2 logs anbarpolymer-admin --lines 200 | grep -n P2022             # کدوم پروسه خطا داده
```

## رفع
1. **سمت سرور (اصلی):**
   ```bash
   npx prisma generate && npm run build
   pm2 restart anbarpolymer anbarpolymer-admin anbarpolymer-transport
   ```
   هر سه پروسه از یک Build مشترک اجرا می‌شن، پس باید هر سه ری‌استارت بشن.
2. **سخت‌سازی کد (مستقیم، بدون تغییر Schema):** در `admin-deals/page.tsx` تنها فیلدهای گریدی که مصرف می‌شن `code`، `producer`، `category` و `imageUrl` هستن (خط‌های ۳۳۱ تا ۳۸۲). دو `include` این‌طوری عوض می‌شن:
   ```ts
   materialListing: { include: { grade: { select: { code: true, producer: true, category: true, imageUrl: true } }, user: {…همون قبلی} } },
   purchaseRequest: { include: { grade: { select: { code: true, producer: true, category: true, imageUrl: true } } } },
   ```
   کد پایین‌تر از `(deal as any)...grade` استفاده می‌کنه، پس تایپ‌ها نمی‌شکنن. ۵۴ جای دیگه رو فقط گزارش می‌کنم و بهشون دست نمی‌زنم.
3. به Schema یا Migration نیازی نیست.

---

# بخش ۲ — زمان‌بند خودکار مهلت‌ها

## ۲.۱ یافته‌ی مهم: دوتا اجرای هم‌زمان کار رو دوبار انجام می‌دن (همین الانم هست)
همه‌ی توابع `enforce*` در `lib/dealDeadlines.ts` این الگو رو دارن: اول با `findMany` ردیف‌های سررسیده رو می‌خونن، بعد هر ردیف رو **بدون چک دوباره‌ی وضعیت** با `update({ where: { id } })` تغییر می‌دن. اگه دوتا اجرا هم‌زمان پیش بیان (دو نفر هم‌زمان `my-deals` رو باز کنن، یا بعد از این تسک، crontab هم‌زمان با لود یه صفحه)، هر دو همون ردیف‌ها رو می‌بینن و:

| تابع | نتیجه‌ی اجرای دوبار |
|---|---|
| `enforceProformaDeadlines` | 🔴 **موجودی انبار دوبار `increment` می‌شه** (تناژ واقعی‌تر از چیزی که هست نشون داده می‌شه) |
| `enforceDiscrepancyWindowClose` | 🔴 دوتا `DealConfirmation` از نوع `auto_no_discrepancy` برای یه معامله ساخته می‌شه |
| `enforceDriverSilenceEscalation` | 🟠 پیامک هشدار دوبار به شرکت حمل فرستاده می‌شه |
| `enforceDealSellerFeeDeadlines` / `enforceBuyerPaymentDeadlines` / `enforceSellerFeeDeadlines` | 🟡 لغو و جریمه دوبار نوشته می‌شه. نتیجه یکیه، ولی عددهای گزارش اشتباه درمیاد |

زمان‌بند جدید تعداد اجراها رو زیاد می‌کنه و این مشکل رو جدی‌تر می‌کنه. **پیشنهاد: گارد وضعیت برای هر آیتم** (این کار مسیرهای تنبل موجود رو هم ایمن می‌کنه):
- `enforceDealSellerFeeDeadlines`: `updateMany({ where: { id, status: 'confirmed' }, data: { status: 'cancelled' } })`. اگه `count === 0` بود، یعنی یه اجرای دیگه زودتر انجامش داده و از بقیه‌ی کارهای این آیتم (آزاد کردن آگهی و جریمه) رد می‌شیم.
- `enforceSellerFeeDeadlines`: گارد `{ id, validityStatus: 'reserved', feeStatus: 'unpaid' }`
- `enforceBuyerPaymentDeadlines`: گارد `{ id, status: 'confirmed', escrowStatus: 'pending' }`
- `enforceDiscrepancyWindowClose`: داخل یه `$transaction(async tx => …)`، اول `qualityAutoAccepted: false → true` با گارد انجام می‌شه و فقط اگه موفق بود `DealConfirmation` ساخته می‌شه
- `enforceDriverSilenceEscalation`: گارد `{ id, driverSilenceFlaggedAt: null }`، و پیامک فقط اگه موفق بود
- `enforceProformaDeadlines`: `$transaction` فعلی از حالت دسته‌ای به تعاملی عوض می‌شه. اول `order.updateMany({ id, status: 'priced' → 'rejected' })` و فقط اگه `count === 1` بود موجودی برگردونده می‌شه
- عددهایی که برگردونده می‌شن هم از `overdue.length` به «تعداد آیتم‌هایی که واقعاً تغییر کردن» عوض می‌شن تا لاگ و بنرها درست باشن.

**چرا قفل پایگاه‌داده‌ای (`pg_try_advisory_lock`) نه:** Prisma از یه مجموعه اتصال (connection pool) استفاده می‌کنه. قفلی که روی یه اتصال گرفته شده ممکنه از یه اتصال دیگه آزاد بشه و عملاً کار نکنه. تازه اون قفل فقط مسیر crontab و دکمه‌ی دستی رو پوشش می‌داد، نه لود صفحه‌ها رو. گارد وضعیت هر دو مشکل رو بدون جدول یا قفل اضافه حل می‌کنه.

> ⚠️ بیشتر کامنت‌ها و **سه متن فارسی قابل‌مشاهده** در `lib/dealDeadlines.ts` خراب‌شده‌ان (دوبار کدگذاری UTF-8، مثلاً `'Ã˜Â±Ã˜Â²...'`). این خرابی از آرشیو `seller-identity-fix` به بعد وجود داره و نسخه‌ی `proforma-section-c` سالمه. این سه متن اینان:
> - `restrictionReason` کاربر (در دو تابع)، که پیام محدودیت به خود کاربر بدون نشون داده می‌شه
> - `note` رویداد باطل شدن پیش‌فاکتور
> - متن خطای «معامله پیدا نشد»
>
> موقع ویرایش، بایت‌های فایل عیناً حفظ می‌شن و فقط خط‌های لازم عوض می‌شن. **درست کردن این متن‌ها جزو این تسک نیست؛ اگه بخوای، جدا انجامش می‌دم** (متن درست رو از `proforma-section-c` برمی‌دارم).

## ۲.۲ مکانیزم اجرا: Endpoint + crontab، هر ۱۵ دقیقه
**چرا `setInterval` داخل اپ نه:**
- سه پروسه‌ی pm2 از یک Build اجرا می‌شن، پس تایمر سه‌بار اجرا می‌شه.
- با هر Deploy یا ری‌استارت، تایمر از نو شروع می‌شه.
- `instrumentation.ts` فعلاً فقط Sentry رو راه می‌ندازه، و تایمر طولانی داخل Next.js تضمین پایداری نداره.

**چرا crontab:**
- دقیقاً همون روشیه که `scripts/poller.py` الان روی همین سرور با `/api/exchange-rates` اجرا می‌شه.
- مستقل از ری‌استارت‌هاست و در هر نوبت فقط یه‌بار اجرا می‌شه.

**چرا ۱۵ دقیقه:** کمترین مهلت قابل‌تنظیم ۱ ساعت کاریه (`clampInt` حداقل ۱ رو می‌پذیره) و مهلت‌های پیش‌فرض ۴ تا ۷۲ ساعته. با فاصله‌ی ۱۵ دقیقه، هر مهلت حداکثر ۱۵ دقیقه دیرتر اعمال می‌شه. هر اجرا حدود ۶ Query سبکه، پس ۵ دقیقه هم ممکنه، ولی لاگ‌ها ۳ برابر می‌شن و سود واقعی نداره.

**فایل جدید `src/app/api/cron/deadlines/route.ts`:**
- فقط `POST` و `export const dynamic = 'force-dynamic'`
- بررسی رمز دقیقاً مثل `api/exchange-rates/route.ts`: اگه `process.env.CRON_SECRET` تنظیم نشده باشه **503** (بسته می‌مونه)، اگه `Bearer` اشتباه باشه **401**
- فقط `runScheduledDeadlines('auto')` رو صدا می‌زنه و خلاصه‌ی نتیجه رو JSON برمی‌گردونه
- این مسیر با `/admin-` شروع نمی‌شه، پس روی پروسه‌ی **public** (پورت ۳۰۰۰) در دسترسه. crontab باید به `localhost:3000` بزنه (روی پروسه‌ی admin، middleware این مسیر رو به `/404` می‌فرسته)
- (اختیاری) در nginx مسیر `/api/cron/` از بیرون `deny` بشه. رمز به‌تنهایی کافیه، این فقط لایه‌ی دوم امنیته

## ۲.۳ هسته‌ی مشترک: فایل جدید `src/lib/deadlineRuns.ts`
```ts
export async function runScheduledDeadlines(trigger: 'auto' | 'manual', userId?: string)
//  → enforceDealDeadlines() + enforceProformaDeadlines()
//  → خلاصه: { cancelled, qualityAutoAccepted, driverSilenceFlagged, proformasExpired, durationMs, ok, error? }
//  → ثبت با logEvent() در SystemLog؛ اگه خطا بده خطا هم ثبت می‌شه و بعد دوباره throw
export async function getRecentAutoRuns(take = 3)
//  → systemLog.findMany({ where: { category: 'deadline-scheduler' }, orderBy: { createdAt: 'desc' }, take })
```
Endpoint و دکمه‌ی دستی فقط این تابع رو صدا می‌زنن. صفحه‌هایی که الان به‌صورت تنبل `enforce*` رو صدا می‌زنن (admin-deals و my-deals و deal-confirm و proformas) **بدون تغییر** می‌مونن و **لاگ نمی‌شن**.

## ۲.۴ ذخیره‌ی ۳ اجرای آخر: `SystemLog`، بدون Migration
مدل موجود `SystemLog` (`level, category, message, userId, metaJson, createdAt`) از قبل ایندکس `@@index([category, createdAt])` داره و `logEvent()` در `lib/logger.ts` همین الان روش می‌نویسه.
- اجرای خودکار: `category: 'deadline-scheduler'`
- اجرای دستی: `category: 'deadline-scheduler-manual'` همراه با `userId` ادمین. دسته‌ها جدان، پس فیلتر «فقط خودکارها» فقط با ایندکس انجام می‌شه و لازم نیست JSON باز بشه
- `message`: خلاصه‌ی فارسی نتیجه، مثلاً «۳ معامله لغو، ۱ تایید خودکار کیفیت، ۲ پیش‌فاکتور باطل» یا «هیچ مهلت سررسیده‌ای نبود». عددهای خام هم در `metaJson` ذخیره می‌شن
- حجم: ۹۶ ردیف در روز. دکمه‌ی موجود «پاکسازی لاگ‌های قدیمی» در `/admin-logs` ردیف‌های قدیمی‌تر از ۹۰ روز رو پاک می‌کنه (حدود ۸.۶ هزار ردیف)
- گزینه‌های ردشده:
  - جدول جدید `DeadlineRunLog`: Migration لازم داره و مزیت اضافه‌ای نداره
  - فایل JSON روی دیسک: سه پروسه هم‌زمان روش می‌نویسن، با Deploy ممکنه پاک بشه، و با مسیر فعلی لاگ‌ها هم‌خوان نیست

## ۲.۵ UI: هم‌شکل بخش «⏳ طول مهلت‌ها»
در `admin-deals/page.tsx`، داخل همون بلوک `{dealRules && …}` که فقط ادمین می‌بینه، یه `<details open>` دوم **درست بعد از** «طول مهلت‌ها» با همون ظرف (`border 1px #e5e7eb، radius 10، padding 10px 16px، #fff`) و `marginTop: 12`:
- **`<summary>`** (12.5px، وزن 700): «🤖 اجرای خودکار مهلت‌ها — هر ۱۵ دقیقه»
- **`<p>`** (11.5px، `#6f7680`، `margin 10px 0 14px`): «سرور هر ۱۵ دقیقه خودش همه‌ی مهلت‌های معامله و پیش‌فاکتور رو چک و اعمال می‌کنه، حتی اگه هیچ‌کس سایت رو باز نکنه. این‌جا ۳ اجرای خودکار آخر رو می‌بینی تا مطمئن شی سیستم زنده‌ست.»
- **سه ردیف `InfoRow`**: کامپوننت داخلی جدید کنار `RuleRow` در همون فایل، با **همون ظاهر** (`borderBottom 1px dashed #eceff3`، برچسب `width 210، fontWeight 700`، متن زیرش `10.5px #9199a3 lineHeight 1.7`) ولی **بدون Input**:
  - برچسب: `tehranJalaliDisplay(at) - tehranClockDisplay(at)` (از `lib/tehranClock.ts`)
  - متن زیرش: `message`. اجرای ناموفق با «⚠️ خطا: …»
- **اگه هیچ اجرای خودکاری ثبت نشده:** یه ردیف با متن «هنوز هیچ اجرای خودکاری ثبت نشده — یعنی crontab سرور هنوز تنظیم نشده یا `CRON_SECRET` ست نیست.» (داده‌ی جعلی نمایش داده نمی‌شه)
- **پیشنهاد اضافه:** اگه آخرین اجرای خودکار بیشتر از ۴۵ دقیقه پیش بوده، زیر لیست یه خط `#92400e` با متن «⚠️ زمان‌بند خودکار بیش از ۴۵ دقیقه‌ست اجرا نشده — crontab سرور رو چک کن.» (اگه نمی‌خوای حذفش می‌کنم)
- **دکمه‌ی دستی:** `<form action={runDeadlinesNowAction}>` با `ConfirmSubmitButton`، با همون `style={{ ...btnPrimaryStyle, alignSelf: 'flex-start', padding: '8px 22px', marginTop: 4 }}` دکمه‌ی «ذخیره‌ی تغییرات» و متن «اجرای همین الان». پیام تایید: «همه‌ی مهلت‌های سررسیده همین الان اعمال می‌شن (لغو معامله، جریمه، باطل شدن پیش‌فاکتور). مطمئنی؟»

**`runDeadlinesNowAction` در `admin-deals/actions.ts`:**
- همون چک دسترسی `updateDealRulesAction` رو داره (`role !== 'admin'` → `AccessDeniedError('A-ROLE-DEALS', …)`)
- `runScheduledDeadlines('manual', currentUser.id)` رو صدا می‌زنه
- بعد `redirect('/admin-deals?manualRun=1&c=…&q=…&d=…&p=…')`

**نمایش نتیجه‌ی اجرای دستی:** صفحه هنگام لود دوباره `enforceDealDeadlines` رو اجرا می‌کنه که دیگه چیزی پیدا نمی‌کنه، پس بنرهای موجود صفر نشون می‌دن. برای همین عددها از طریق `searchParams` منتقل می‌شن و با **همون استایل بنرهای بالای صفحه** نشون داده می‌شن: «▶ اجرای دستی انجام شد: …». این همون الگوی `imported/skipped` موجوده.

## ۲.۶ راهنمای Deploy (در `NOTES-DEADLINE-SCHEDULER.md`)
```bash
# ۱) رمز
echo "CRON_SECRET=$(openssl rand -hex 32)" >> /var/www/anbarpolymer-app/.env
# ۲) build + ری‌استارت هر سه پروسه (همراه با رفع بخش ۱)
npx prisma generate && npm run build && pm2 restart anbarpolymer anbarpolymer-admin anbarpolymer-transport
# ۳) crontab -e — رمز از .env خونده می‌شه و جای دیگه تکرار نمی‌شه
*/15 * * * * curl -fsS --max-time 120 -X POST -H "Authorization: Bearer $(grep '^CRON_SECRET=' /var/www/anbarpolymer-app/.env | cut -d= -f2-)" http://localhost:3000/api/cron/deadlines >> /var/log/anbar-deadlines.log 2>&1
# ۴) تست فوری
curl -i -X POST -H "Authorization: Bearer <secret>" http://localhost:3000/api/cron/deadlines
```

## ۲.۷ فایل‌هایی که عوض می‌شن
| فایل | تغییر |
|---|---|
| `src/app/admin-deals/page.tsx` | `select` گرید (بخش ۱)، `<details>` جدید، `InfoRow`، بنر اجرای دستی |
| `src/app/admin-deals/actions.ts` | `runDeadlinesNowAction` |
| `src/lib/dealDeadlines.ts` | گارد وضعیت برای هر آیتم و شمارش واقعی (بدون تغییر در امضای خروجی توابع) |
| `src/lib/deadlineRuns.ts` | **جدید**: هسته و خواندن ۳ اجرای آخر |
| `src/app/api/cron/deadlines/route.ts` | **جدید**: Endpoint |
| `NOTES-DEADLINE-SCHEDULER.md` | **جدید**: راهنمای Deploy |

بدون تغییر Schema، بدون Migration، بدون کتابخونه‌ی جدید. اعتبارسنجی بعد از پیاده‌سازی با `npx tsc --noEmit`.

---

# بخش ۳ — فهرست همه‌ی صف‌ها و «اجراهای تنبل» پروژه (برای تصمیم تو)

منظور: هر کاری که «برای بعد» ثبت می‌شه یا سررسید داره، ولی فقط با باز شدن یه صفحه اجرا می‌شه یا اصلاً اجرا نمی‌شه.

### الف) اجراهای تنبل واقعی

| # | سازوکار | چی می‌سازه یا می‌فرسته | شرط اجرا | صفحه‌ای که باید باز بشه | وضعیت و پیشنهاد |
|---|---|---|---|---|---|
| 1 | `enforceDealDeadlines` (`lib/dealDeadlines.ts`) | ۱) لغو معامله در `confirmed` وقتی `sellerFeeDeadline` یا `buyerConfirmDeadline` گذشته، به‌همراه آزاد شدن آگهی (`active`) و محدودیت ۲۴ساعته‌ی کاربر ۲) آگهی رزروشده‌ای که کارمزدش پرداخت نشده میره به `needs_reverification`، محدودیت فروشنده و لغو معامله‌های draft یا confirmed اون ۳) معامله‌ی `delivered` که مهلت گزارش مغایرتش گذشته، تایید خودکار «بدون مغایرت» می‌گیره (`DealConfirmation`) ۴) معامله‌ی `in_transit` که راننده N روز رویدادی ثبت نکرده، پرچم سکوت می‌خوره و **پیامک** به شرکت حمل میره | سررسیدهای بالا گذشته باشن | `/admin-deals`، `/my-deals`، `/my-deals/[id]`، `/deal-confirm/[dealId]` | ✅ **از قبل جزو این تسک** |
| 2 | `enforceProformaDeadlines` (`lib/dealDeadlines.ts`) | سفارش `priced` که `proformaDeadline` گذشته میره به `rejected`، موجودی هر قلم به انبار برمی‌گرده (`increment`) و یه `StatusEvent` ثبت می‌شه | `proformaDeadline < now` | `/proformas`، `/proformas/[id]` | ✅ **از قبل جزو این تسک** |
| 3 | `enforcePendingSmsQueue` (`lib/smsQueue.ts`) | قراره پیامک‌های صف `PendingSmsMessage` که ۶۰ دقیقه‌شون گذشته رو خودکار بفرسته | `status = pending` و `autoSendAt <= now` | `/admin-logistics` | ⚪ **فعلاً کاری نمی‌کنه (`return 0`)**. جدول `PendingSmsMessage` هنوز در Schema **نیست** و `queueSms` همین الان پیامک رو **مستقیم** می‌فرسته، بدون صف و بدون ۶۰ دقیقه تاخیر. اضافه کردنش به زمان‌بند فعلاً هیچ اثری نداره. **پیشنهاد:** وقتی جدول صف ساخته شد، یه خط به `runScheduledDeadlines` اضافه بشه |

### ب) ثبت شده برای بعد، ولی **هیچ‌جا اجرا نمی‌شه**

| # | سازوکار | چی می‌سازه | شرط | صفحه | وضعیت و پیشنهاد |
|---|---|---|---|---|---|
| 4 | `checkPriceAlerts` (`app/price-alerts/actions.ts`) | هشدار قیمت `active` وقتی کمترین قیمت موجودی انبار به سقف کاربر برسه میره به `triggered` (فقط اعلان داخل سایت، بدون پیامک) | کامنت خودش می‌گه «بعد از هر بروزرسانی قیمت یا موجودی، یا از یه job دوره‌ای صداش بزن» | **هیچ صفحه‌ای. در کل پروژه صفر فراخوان داره** | 🔴 **هشدارهای قیمت الان هیچ‌وقت فعال نمی‌شن.** تابع بی‌خطره و تکرارش ضرری نداره (فقط هشدارهای `active` رو تغییر می‌ده). **کاندید قوی** برای اضافه شدن به زمان‌بند |

### ج) انقضا یا سررسیدی که فقط موقع خوندن چک می‌شه (کاری ثبت نشده، فقط برای کامل بودن)

| # | مورد | رفتار فعلی | اثر نبودِ زمان‌بند |
|---|---|---|---|
| 5 | `PurchaseRequest.expiresAt` | وضعیت `open` می‌مونه. `/market` و `/purchase-requests` موقع خوندن فیلترش می‌کنن و `api/material-listings` موقع ثبت آگهی رد می‌کنه | عملاً هیچ. فقط `status` در DB «باز» می‌مونه |
| 6 | `Deal.fundReleaseDeadline` | فقط برای پرچم «آماده‌ی آزادسازی» در `/admin-deals` حساب می‌شه. آزادسازی **عمداً دستیه** | هیچ |
| 7 | `OrderItem.priceValidUntil` | `isPriceStillValid()` موقع نمایش در `/my-orders` و `/admin-orders` | هیچ |
| 8 | `Session`، `OtpCode`، `DriverAccessLink` (`expiresAt`) | موقع استفاده رد می‌شن | ردیف‌های منقضی هیچ‌وقت پاک نمی‌شن و آروم انباشته می‌شن. **اختیاری:** پاکسازی روزانه |
| 9 | `cleanupOldLogsAction` (`/admin-logs`) | لاگ‌های قدیمی‌تر از ۹۰ روز فقط با **کلیک دستی** پاک می‌شن | با زمان‌بند جدید، روزی ۹۶ ردیف به `SystemLog` اضافه می‌شه. **اختیاری:** روزی یه‌بار خودکار |
| 10 | `Deal.deliveryConfirmDeadline` | فیلدش در Schema هست ولی **هیچ کدی نه مقدارش رو می‌نویسه نه می‌خونه** | هیچ. فیلد بی‌استفاده‌ست |

### د) از قبل با زمان‌بند بیرونی
| 11 | `scripts/poller.py` → `POST /api/exchange-rates` | نرخ ارز نوار بالای سایت | crontab هر ۱۵ دقیقه | همین الگو برای زمان‌بند جدید استفاده می‌شه |

**برای تصمیم تو:** پیشنهاد من اینه که **مورد ۴ (هشدار قیمت)** همین الان به زمان‌بند اضافه بشه. مورد ۳ بعد از ساخته شدن جدول صف. موارد ۸ و ۹ اختیاری‌ان و مثلاً روزی یه‌بار ساعت ۳ بامداد اجرا بشن (با Endpoint جدا یا شرط ساعت داخل همون Endpoint). هرکدوم رو اضافه کنی، عددش توی خلاصه‌ی اجرا و لیست ۳تایی هم نشون داده می‌شه.

---

## منتظر تایید
1. کل پلن، مخصوصاً **گارد وضعیت** در `dealDeadlines.ts` (بخش ۲.۱). این مسیرهای تنبل فعلی رو هم تغییر می‌ده، هرچند فقط ایمن‌ترشون می‌کنه
2. استفاده از `SystemLog` به‌جای جدول جدید
3. هشدار «بیش از ۴۵ دقیقه اجرا نشده»، نگه داشته بشه یا نه
4. کدوم موارد بخش ۳ اضافه بشن
5. (جدا) درست کردن متن‌های خراب `dealDeadlines.ts`، الان یا بعداً
