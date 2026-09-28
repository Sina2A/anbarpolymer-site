# اَبرتسک — رفع کرش admin-deals + زمان‌بند خودکار مهلت‌ها (نسخه‌ی مچ‌شده با آخرین کد)

> این نسخه با آخرین فایل‌های آپلودشده (تا `fix-map-zindex.tar.gz`) تطبیق داده شده. هرجا فرض نسخه‌ی قبلی با کد واقعی نمی‌خوند، اصلاح شده و با «✅ واقعیت کد» علامت خورده.

## ⚠️ دستورالعمل اجرا
۱. کل این پرامپت رو کامل بخون — دو بخش مستقل داره.
۲. با Read، وضعیت فعلی هر بخش رو بررسی کن (واقعیت‌های زیر رو دوباره تایید کن، کورکورانه قبول نکن).
۳. یه پلن کامل بنویس.
۴. منتظر تایید صریح بمون.

---

# بخش ۱ — رفع کرش admin-deals (ستون حذف‌شده)

## شواهد قطعی (از لاگ سرور)
```
The column `Grade.packagingType` does not exist in the current database.
code: 'P2022' (ColumnNotFound)
```

## ✅ واقعیت کد (بررسی‌شده)
- توی آخرین سورس، **هیچ کدی دیگه `Grade.packagingType` رو صریح نمی‌خونه**. تنها ارجاع‌های باقی‌مونده‌ی `packagingType` مال مدل‌های دیگه‌ان و درستن:
  - `WarehouseStock.packagingType` → `admin-warehouses/actions.ts`, `admin-warehouses/page.tsx`, `warehouses/[id]/page.tsx`
  - `MaterialListing.packagingType` (مدل جدا، OFF-LIMITS) → `api/material-listings/route.ts`, `new-listing/page.tsx`, `my-listings/page.tsx`, `ListingDetailModal.tsx`
- `schema.prisma` هم دیگه این فیلد رو روی `Grade` نداره، و Migration `20260926000000_move_packaging_and_producer_gate` ستون رو `DROP` کرده.
- ولی `src/app/admin-deals/page.tsx` (خط ~۶۰-۶۱) این‌طوری Query می‌زنه:
  ```ts
  materialListing: { include: { grade: true, ... } },
  purchaseRequest: { include: { grade: true } },
  ```
  `include: { grade: true }` یعنی «همه‌ی ستون‌هایی که **Prisma Client ساخته‌شده** برای Grade می‌شناسه». اگه کلاینت روی سرور قبل از تغییر Schema تولید شده باشه (یعنی `prisma generate` / `npm run build` بعد از Migration دوباره اجرا نشده، یا Build قدیمی هنوز داره سرو می‌شه)، کلاینت هنوز `packagingType` رو می‌شناسه و SELECTش می‌کنه → P2022. همین الگو (`grade: true`) توی `my-deals/[id]` و جاهای دیگه هم هست.

**فرضیه‌ی اصلی:** علت، کد نیست؛ **Prisma Client / Build کهنه روی سروره** (ناهماهنگی بین DB مایگریت‌شده و کلاینت).

## کاری که باید بکنی
۱. با `grep -rn "packagingType" src/ prisma/schema.prisma` دوباره تایید کن هیچ ارجاع Grade-context‌ای نمونده (نتیجه‌ی مورد انتظار: فقط موارد بالا).
۲. توی پلن، **دستورات تشخیص روی سرور** رو بده تا سینا اجرا کنه (خودت اجرا نکن):
   - `grep -n "packagingType" node_modules/.prisma/client/schema.prisma` → اگه زیر `model Grade` پیداش شد، کلاینت کهنه‌ست.
   - `npx prisma migrate status`
   - `pm2 list` و این‌که کدوم پروسه (`anbarpolymer` / `anbarpolymer-admin` / `anbarpolymer-transport`) خطا رو لاگ کرده.
۳. **رفع اصلی (سمت سرور):** `npx prisma generate && npm run build` و بعد ری‌استارت **هر سه** پروسه‌ی pm2 (چون هر سه از یک Build مشترک اجرا می‌شن).
۴. **سخت‌سازی اختیاری در کد (فقط اگه ساده‌ست، مستقیم اجرا کن):** توی `admin-deals/page.tsx` به‌جای `grade: true` یه `select` صریح بذار که فقط فیلدهای واقعاً مصرف‌شده رو بخواد (طبق کد فعلی: `code`, `producer`, `category`, `imageUrl` — قبلش با Read همه‌ی مصارف `grade.` رو توی فایل چک کن). این‌طوری کرش‌های مشابه آینده از این صفحه نمی‌گیره. بقیه‌ی صفحه‌هایی که `grade: true` دارن رو فقط لیست کن، دست نزن.
۵. نیاز به تغییر Schema/Migration **نیست**. اگه برخلاف انتظار دیدی هست، فقط توی پلن بگو و منتظر تایید جدا بمون.

---

# بخش ۲ — زمان‌بند خودکار مهلت‌ها، از همون صفحه‌ی تنظیمات

## ✅ واقعیت کد (بررسی‌شده)
- توابع مهلت در `src/lib/dealDeadlines.ts`:
  - `enforceDealDeadlines()` → برمی‌گردونه `{ cancelledCount, qualityAutoAcceptedCount, driverSilenceFlaggedCount }`
  - `enforceProformaDeadlines()` → یه عدد (تعداد پیش‌فاکتورهای منقضی/باطل‌شده)
- الان فقط به‌صورت lazy با لود صفحه اجرا می‌شن:
  - `enforceDealDeadlines`: `admin-deals/page.tsx`, `my-deals/page.tsx`, `my-deals/[id]/page.tsx`, `deal-confirm/[dealId]/page.tsx`
  - `enforceProformaDeadlines`: `proformas/page.tsx`, `proformas/[id]/page.tsx`
  - (هم‌الگو: `enforcePendingSmsQueue` در `lib/smsQueue.ts` فقط با لود `admin-logistics` اجرا می‌شه — **جزو این تسک نیست**، فقط توی پلن بپرس سینا می‌خواد اینم به همون زمان‌بند اضافه بشه یا نه.)
- `HANDOFF.md` خودش این رو تایید می‌کنه: «چون cron جدا نداریم، `enforceDealDeadlines()` به‌صورت lazy... اجرا می‌شه».

## خواسته‌ی سینا (نهایی)
همون بخش تنظیمات «⏱ زمان‌بندی و مهلت‌های معامله» در `admin-deals` یه بخش جدید بگیره، با **دو محتوای کاملاً متفاوت**:

### ۱. بخش خودکار — فقط نمایشی، بدون هیچ فیلد ورودی
نمایش **فقط‌خواندنی** از **۳ اجرای خودکار آخر** (هرکدوم: زمان دقیق به وقت تهران/شمسی + خلاصه‌ی نتیجه، مثلاً «۱۴۰۵/۷/۶ - ۱۸:۵۹ — ۳ معامله باطل شد، ۱ پیش‌فاکتور منقضی شد»). اگه هنوز هیچ اجرای خودکاری ثبت نشده، متن صادقانه‌ی «هنوز هیچ اجرای خودکاری ثبت نشده» (بدون داده‌ی جعلی). برای فرمت زمان از helperهای موجود `lib/tehranClock.ts` (مثل `tehranJalaliDisplay` / `tehranClockDisplay`) استفاده کن، تابع جدید نساز.

### ۲. بخش دستی — دکمه‌ی «اجرای همین الان»
برای تست/کنترل دستی، جدا از چرخه‌ی خودکار. اجرای دستی هم لاگ بشه ولی با برچسب «دستی» (`trigger: 'manual'`)، و لیست «۳ اجرای خودکار آخر» فقط `trigger: 'auto'` ها رو نشون بده. نتیجه‌ی اجرای دستی بعد از ریدایرکت به‌صورت همون بنرهای نتیجه‌ی موجود بالای صفحه نشون داده بشه.

> اجراهای lazy با لود صفحه‌ها همون‌طور بمونن (بی‌ضررن) ولی **لاگ نشن** — وگرنه لیست ۳تایی پر از لود صفحه می‌شه و دیگه نشون نمی‌ده «زمان‌بند خودکار زنده‌ست».

## ✅ محیط واقعی اجرا (از HANDOFF و NOTES)
- اپ در `/var/www/anbarpolymer-app`، با **سه پروسه‌ی pm2 هم‌زمان از یک Build**: `anbarpolymer` (public، پورت ۳۰۰۰)، `anbarpolymer-admin`، `anbarpolymer-transport` — با متغیر `SURFACE`.
- پنل دیپلوی جدا روی پورت ۴۰۰۰ (`deploy-panel`).
- **پیش‌نمونه‌ی دقیقاً هم‌جنس در خود پروژه وجود داره:** `scripts/poller.py` با crontab سرور (`*/15 * * * *`) به `POST /api/exchange-rates` با هدر `Authorization: Bearer <EXCHANGE_RATE_SECRET>` می‌زنه.
- `middleware.ts`: روی `SURFACE=admin` هر مسیری که با `/admin-` یا `/my-tasks` شروع نشه → `/404`؛ روی public/transport مسیرهای `/admin-*` → `/404`. پس Endpoint جدید زیر `/api/...` روی پروسه‌ی **public** در دسترسه (Cron باید به `localhost:3000` بزنه، نه به پروسه‌ی admin).

## ⚠️ مقایسه‌ی مکانیزم — توی پلن با استدلال نهایی کن
- **زمان‌بند درون‌فرایندی (`setInterval` در `instrumentation.ts`):** چون **سه پروسه‌ی pm2 از یک Build** بالا هستن، بدون قفل **سه‌بار** اجرا می‌شه؛ با هر Restart/Deploy از نو شروع می‌شه؛ و Next.js تضمینی برای پایداری تایمر طولانی نمی‌ده. اگه این انتخاب شد، باید فقط روی یک SURFACE فعال بشه + قفل DB.
- **Endpoint محافظت‌شده + crontab سرور (پیشنهاد پیش‌فرض):** دقیقاً هم‌الگوی `exchange-rates`/`poller.py` که الان روی همین سرور کار می‌کنه؛ مستقل از Restart؛ فقط یک اجرا در هر نوبت. پیشنهاد:
  - `src/app/api/cron/deadlines/route.ts` — `POST`، `Authorization: Bearer ${process.env.CRON_SECRET}` (الگوی بررسی Secret رو از `api/exchange-rates/route.ts` کپی کن؛ اگه Secret تنظیم نشده → 503 صریح، نه اجرای بی‌محافظ).
  - فاصله‌ی ثابت **هر ۱۵ دقیقه** (هم‌آهنگ با poller، و چون کوچیک‌ترین مهلت‌ها ساعتی/چندساعتی‌ان، تاخیر حداکثر ۱۵ دقیقه‌ای قابل‌قبوله) — استدلال نهایی رو توی پلن بیار.
  - خط crontab آماده برای سینا، مثل: `*/15 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/deadlines >> /var/log/anbar-deadlines.log 2>&1`
- **قفل تک‌اجرا در هر حالت:** اجرای Cron ممکنه با اجرای lazy یه صفحه یا دکمه‌ی دستی هم‌زمان بشه. با Read بررسی کن توابع `enforce*` ایدمپوتنت هستن یا نه (مثلاً `updateMany` با گارد وضعیت). اگه نیستن، برای مسیر Cron/دستی یه `pg_try_advisory_lock` پیشنهاد بده (بدون جدول جدید).
- هسته‌ی مشترک: یه تابع واحد (مثلاً `runScheduledDeadlines(trigger: 'auto' | 'manual')` در `lib/dealDeadlines.ts`) که هر دو `enforce*` رو صدا بزنه، نتیجه رو خلاصه کنه و لاگ کنه؛ هم Endpoint و هم Server Action دکمه‌ی دستی فقط همینو صدا بزنن.

## ذخیره‌ی ۳ اجرای آخر
- ✅ واقعیت کد: تنظیمات مهلت‌ها در مدل singleton `DealRuleSettings` (`id @default("singleton")`) ذخیره می‌شن؛ جای مناسبی برای لاگ اجرا **وجود نداره**.
- پیشنهاد: جدول کوچیک جدید، مثلاً `DeadlineRunLog { id, trigger ('auto'|'manual'), startedAt, finishedAt, ok Boolean, summaryJson/summaryText, error String? }` با Index روی `(trigger, startedAt)`؛ نمایش فقط `take: 3`. (اختیاری: پاک‌کردن ردیف‌های قدیمی‌تر از مثلاً ۲۰۰ تا — توی پلن پیشنهاد بده.)
- گزینه‌ی جایگزین (فایل JSON روی دیسک) رو هم بسنج و رد/قبولش رو استدلال کن — با سه پروسه و Deployهای مکرر، DB امن‌تره.
- ⚠️ این یعنی **تغییر Schema + Migration جدید** → طبق قانون، فقط توی پلن توضیح بده و Migration رو **دستی و Backward-safe** بنویس (مثل `20260926000000_...`)، و منتظر تایید جدا بمون.

## ⚠️ الزام ظاهری — دقیقاً هم‌شکل بخش «⏳ طول مهلت‌ها»
✅ ساختار واقعی بخش موجود (`admin-deals/page.tsx`، حدود خط ۱۸۸-۲۱۶):
- ظرف: `<details open style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', background: '#fff' }}>`
- عنوان: `<summary style={{ cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>`
- توضیح زیر عنوان: `<p style={{ fontSize: 11.5, color: '#6f7680', margin: '10px 0 14px' }}>`
- هر ردیف: کامپوننت داخلی `RuleRow` → `borderBottom: '1px dashed #eceff3'`, `paddingBottom: 10`؛ برچسب `width: 210, fontWeight: 700`؛ Hint زیرش `fontSize: 10.5, color: '#9199a3', marginTop: 4, lineHeight: 1.7`
- دکمه: `ConfirmSubmitButton` با `style={{ ...btnPrimaryStyle, alignSelf: 'flex-start', padding: '8px 22px', marginTop: 4 }}`

الزامات:
- یه `<details>` جدید (مثلاً «🤖 اجرای خودکار مهلت‌ها») با همین ظرف/summary/p، زیر همون `{dealRules && ...}` (فقط برای ادمین).
- بخش خودکار: ردیف‌هایی با همون ظاهر `RuleRow` (برچسب ۷۰۰ + متن کم‌رنگ ۱۰.۵ + خط‌چین) ولی **به‌جای Input فقط متن نتیجه**. اگه لازمه، یه کامپوننت داخلی هم‌شکل کنار `RuleRow` تو همون فایل (مثلاً `InfoRow`) — نه کامپوننت/کتابخونه‌ی UI جدید.
- دکمه‌ی «اجرای همین الان»: همون `ConfirmSubmitButton` با همون استایل دکمه‌ی «ذخیره‌ی تغییرات»، داخل یه `<form action={runDeadlinesNowAction}>` (Server Action جدید در `admin-deals/actions.ts`، با همون چک دسترسی ادمینِ اکشن‌های موجود اون فایل).

## کاری که باید بکنی
۱. با Read، کد فعلی بخش «⏱ زمان‌بندی و مهلت‌های معامله» رو دقیق ببین (`updateDealRulesAction`، `getDealRuleSettings`، `RuleRow`، بنرهای نتیجه‌ی بالای صفحه).
۲. `api/exchange-rates/route.ts` و `scripts/poller.py` رو به‌عنوان الگوی Endpoint + Cron بخون.
۳. مکانیزم اجرا رو با استدلال نهایی کن (پیش‌فرض: Endpoint + crontab، هر ۱۵ دقیقه).
۴. Schema/Migration لاگ اجرا رو پیشنهاد بده (منتظر تایید جدا).
۵. UI جدید رو دقیقاً هم‌شکل موجود طراحی کن.
۶. متغیر محیطی جدید (`CRON_SECRET`) و خط crontab رو برای راهنمای Deploy بنویس.

## قوانین ثابت (کل اَبرتسک)
بدون داده‌ی جعلی. OFF-LIMITS: فایل‌های `MaterialListing.packagingType`. اجرا/build/migrate نکن — فقط پلن، منتظر تایید.

## تحویل (فقط بعد از تایید صریح پلن)
پلن کامل — هر دو بخش: (الف) تشخیص و رفع کرش (عمدتاً سمت سرور + سخت‌سازی اختیاری select)، (ب) مکانیزم اجرا با استدلال، Schema لاگ، UI، و راهنمای Deploy (`CRON_SECRET` + crontab + ری‌استارت هر سه پروسه‌ی pm2).
