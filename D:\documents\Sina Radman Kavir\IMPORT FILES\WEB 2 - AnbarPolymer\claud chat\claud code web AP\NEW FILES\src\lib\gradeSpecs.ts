// کاتالوگ مشخصات فنی گریدهای پلیمری — ۷۲ فیلد استاندارد
//
// این فایل عمداً هیچ وابستگی به prisma یا هر چیز سرور-فقط نداره —
// چون ویجت انتخاب مشخصات ('use client') هم ازش import می‌کنه.
// دقیقاً همون قانون sections.ts. اگه اینجا رو به prisma وصل کنی،
// بیلد برای مرورگر می‌شکنه.
//
// این فیلدها ستون دیتابیس نیستن. کارشناس هر تعداد از این ۷۲ تا رو که
// برای یه گرید واقعاً اندازه‌گیری شده انتخاب و پر می‌کنه، و نتیجه به‌صورت
// یه رشته‌ی JSON توی Grade.specsJson ذخیره می‌شه:
//   {"tensileStrengthYield":"32","izodImpactNotched":"4.5"}
// (همون الگوی checklistJson و metaJson توی بقیه‌ی مدل‌ها)
//
// چرا JSON و نه ۷۲ ستون؟ چون هیچ گریدی هر ۷۲ تا رو نداره — یه گرید تزریقی
// شاید ۸ تا داشته باشه و یه گرید فیلم ۱۵ تا. ۷۲ ستون یعنی جدولی که ۹۰٪ش
// NULL ــه. ضمناً سه تا کلیدِ واقعیِ مقایسه (mfi، density، applicationType)
// از قبل ستون مستقل هستن، پس موتور تطبیق گرید به specsJson وابسته نیست.

export type SpecGroupKey = 'physical' | 'mechanical' | 'thermal' | 'optical' | 'electrical'

export type SpecField = {
  /** کلید انگلیسی — همین کلید توی JSON و توی هدر ستون CSV استفاده می‌شه. هرگز عوضش نکن. */
  key: string
  /** برچسب فارسی برای نمایش توی فرم */
  label: string
  /** واحد اندازه‌گیری — خالی یعنی بدون واحد (نسبت/شاخص) */
  unit: string
  /** استاندارد آزمون مرجع */
  standard: string
  group: SpecGroupKey
}

export const SPEC_GROUPS: { key: SpecGroupKey; label: string }[] = [
  { key: 'physical', label: 'مشخصات فیزیکی' },
  { key: 'mechanical', label: 'مشخصات مکانیکی' },
  { key: 'thermal', label: 'مشخصات گرمایی' },
  { key: 'optical', label: 'مشخصات نوری و ظاهری' },
  { key: 'electrical', label: 'مشخصات الکتریکی' },
]

export const SPEC_FIELDS: SpecField[] = [
  // ---------- فیزیکی (۱۸) ----------
  { key: 'density', label: 'چگالی (Density)', unit: 'g/cm³', standard: 'ASTM D792', group: 'physical' },
  { key: 'bulkDensity', label: 'چگالی توده‌ای (Bulk Density)', unit: 'g/cm³', standard: 'ASTM D1895', group: 'physical' },
  { key: 'mfi', label: 'شاخص جریان مذاب (MFI)', unit: 'g/10min', standard: 'ASTM D1238', group: 'physical' },
  { key: 'mvr', label: 'نرخ حجمی جریان مذاب (MVR)', unit: 'cm³/10min', standard: 'ISO 1133', group: 'physical' },
  { key: 'meltDensity', label: 'چگالی مذاب (Melt Density)', unit: 'g/cm³', standard: 'ISO 1133', group: 'physical' },
  { key: 'moistureContent', label: 'میزان رطوبت (Moisture)', unit: '%', standard: 'ASTM D6980', group: 'physical' },
  { key: 'waterAbsorption', label: 'جذب آب (Water Absorption)', unit: '%', standard: 'ASTM D570', group: 'physical' },
  { key: 'ashContent', label: 'میزان خاکستر (Ash Content)', unit: '%', standard: 'ASTM D5630', group: 'physical' },
  { key: 'volatileContent', label: 'مواد فرار (Volatiles)', unit: '%', standard: 'ASTM D4526', group: 'physical' },
  { key: 'pelletSize', label: 'اندازه گرانول (Pellet Size)', unit: 'mm', standard: 'ISO 17855', group: 'physical' },
  { key: 'fishEyeCount', label: 'تعداد فیش‌آی (Fish Eye)', unit: 'count/m²', standard: 'ASTM D3351', group: 'physical' },
  { key: 'gelCount', label: 'تعداد ژل (Gel Count)', unit: 'count/m²', standard: 'ASTM D3351', group: 'physical' },
  { key: 'intrinsicViscosity', label: 'ویسکوزیته ذاتی (IV)', unit: 'dl/g', standard: 'ASTM D4603', group: 'physical' },
  { key: 'molecularWeight', label: 'وزن مولکولی متوسط (Mw)', unit: 'g/mol', standard: 'ASTM D6474 (GPC)', group: 'physical' },
  { key: 'polydispersityIndex', label: 'شاخص پراکندگی مولکولی (PDI)', unit: '', standard: 'ASTM D6474', group: 'physical' },
  { key: 'xyleneSolubles', label: 'محلول در زایلن (XS)', unit: '%', standard: 'ASTM D5492', group: 'physical' },
  { key: 'isotacticIndex', label: 'شاخص ایزوتاکتیک (II)', unit: '%', standard: 'ASTM D5492', group: 'physical' },
  { key: 'apparentBulkFactor', label: 'فاکتور حجمی ظاهری (Bulk Factor)', unit: '', standard: 'ASTM D1895', group: 'physical' },

  // ---------- مکانیکی (۲۰) ----------
  { key: 'tensileStrengthYield', label: 'استحکام کششی در نقطه تسلیم (Tensile @ Yield)', unit: 'MPa', standard: 'ASTM D638', group: 'mechanical' },
  { key: 'tensileStrengthBreak', label: 'استحکام کششی در نقطه پارگی (Tensile @ Break)', unit: 'MPa', standard: 'ASTM D638', group: 'mechanical' },
  { key: 'elongationYield', label: 'ازدیاد طول در نقطه تسلیم (Elong. @ Yield)', unit: '%', standard: 'ASTM D638', group: 'mechanical' },
  { key: 'elongationBreak', label: 'ازدیاد طول تا پارگی (Elong. @ Break)', unit: '%', standard: 'ASTM D638', group: 'mechanical' },
  { key: 'tensileModulus', label: 'مدول کششی (Tensile Modulus)', unit: 'MPa', standard: 'ASTM D638', group: 'mechanical' },
  { key: 'flexuralStrength', label: 'استحکام خمشی (Flexural Strength)', unit: 'MPa', standard: 'ASTM D790', group: 'mechanical' },
  { key: 'flexuralModulus', label: 'مدول خمشی (Flexural Modulus)', unit: 'MPa', standard: 'ASTM D790', group: 'mechanical' },
  { key: 'izodImpactNotched', label: 'مقاومت ضربه ایزود شیاردار (Izod Notched)', unit: 'J/m', standard: 'ASTM D256', group: 'mechanical' },
  { key: 'izodImpactUnnotched', label: 'مقاومت ضربه ایزود بدون شیار (Izod Unnotched)', unit: 'J/m', standard: 'ASTM D256', group: 'mechanical' },
  { key: 'charpyImpactNotched', label: 'مقاومت ضربه شارپی شیاردار (Charpy Notched)', unit: 'kJ/m²', standard: 'ISO 179', group: 'mechanical' },
  { key: 'charpyImpactUnnotched', label: 'مقاومت ضربه شارپی بدون شیار (Charpy Unnotched)', unit: 'kJ/m²', standard: 'ISO 179', group: 'mechanical' },
  { key: 'fallingDartImpact', label: 'مقاومت ضربه سقوط وزنه (Dart Impact)', unit: 'g', standard: 'ASTM D1709', group: 'mechanical' },
  { key: 'hardnessShoreD', label: 'سختی شور D (Shore D)', unit: '', standard: 'ASTM D2240', group: 'mechanical' },
  { key: 'hardnessRockwellR', label: 'سختی راکول R (Rockwell R)', unit: '', standard: 'ASTM D785', group: 'mechanical' },
  { key: 'compressiveStrength', label: 'استحکام فشاری (Compressive Strength)', unit: 'MPa', standard: 'ASTM D695', group: 'mechanical' },
  { key: 'tearStrengthMD', label: 'مقاومت پارگی جهت طولی (Tear MD)', unit: 'N/mm', standard: 'ASTM D1922', group: 'mechanical' },
  { key: 'tearStrengthTD', label: 'مقاومت پارگی جهت عرضی (Tear TD)', unit: 'N/mm', standard: 'ASTM D1922', group: 'mechanical' },
  { key: 'punctureResistance', label: 'مقاومت سوراخ‌شدن (Puncture)', unit: 'N', standard: 'ASTM D5748', group: 'mechanical' },
  { key: 'escr', label: 'مقاومت ترک‌خوردگی محیطی (ESCR)', unit: 'h', standard: 'ASTM D1693', group: 'mechanical' },
  { key: 'abrasionResistance', label: 'مقاومت سایشی (Abrasion)', unit: 'mg/1000cyc', standard: 'ASTM D4060', group: 'mechanical' },

  // ---------- گرمایی (۱۶) ----------
  { key: 'meltingPoint', label: 'نقطه ذوب (Tm)', unit: '°C', standard: 'ASTM D3418', group: 'thermal' },
  { key: 'glassTransitionTemp', label: 'دمای انتقال شیشه‌ای (Tg)', unit: '°C', standard: 'ASTM D3418', group: 'thermal' },
  { key: 'crystallizationTemp', label: 'دمای تبلور (Tc)', unit: '°C', standard: 'ASTM D3418', group: 'thermal' },
  { key: 'hdt066', label: 'دمای تغییر شکل حرارتی ۰.۴۵ (HDT-B)', unit: '°C', standard: 'ASTM D648', group: 'thermal' },
  { key: 'hdt182', label: 'دمای تغییر شکل حرارتی ۱.۸۲ (HDT-A)', unit: '°C', standard: 'ASTM D648', group: 'thermal' },
  { key: 'vicatSofteningPoint', label: 'نقطه نرمی ویکات (VST)', unit: '°C', standard: 'ASTM D1525', group: 'thermal' },
  { key: 'brittlenessTemp', label: 'دمای تردی (Brittleness Temp)', unit: '°C', standard: 'ASTM D746', group: 'thermal' },
  { key: 'thermalExpansion', label: 'ضریب انبساط حرارتی خطی (CLTE)', unit: '1/°C', standard: 'ASTM D696', group: 'thermal' },
  { key: 'thermalConductivity', label: 'رسانایی گرمایی (Thermal Cond.)', unit: 'W/m·K', standard: 'ASTM C177', group: 'thermal' },
  { key: 'specificHeat', label: 'ظرفیت گرمایی ویژه (Cp)', unit: 'J/g·K', standard: 'ASTM E1269', group: 'thermal' },
  { key: 'oit', label: 'زمان القای اکسیداسیون (OIT)', unit: 'min', standard: 'ASTM D3895', group: 'thermal' },
  { key: 'continuousUseTemp', label: 'حداکثر دمای کارکرد پیوسته (CUT)', unit: '°C', standard: 'UL 746B', group: 'thermal' },
  { key: 'flammabilityUL94', label: 'کلاس اشتعال‌پذیری (UL94)', unit: '', standard: 'UL 94', group: 'thermal' },
  { key: 'loi', label: 'شاخص اکسیژن محدود (LOI)', unit: '%', standard: 'ASTM D2863', group: 'thermal' },
  { key: 'shrinkageMD', label: 'جمع‌شدگی قالب جهت طولی (Shrinkage MD)', unit: '%', standard: 'ASTM D955', group: 'thermal' },
  { key: 'shrinkageTD', label: 'جمع‌شدگی قالب جهت عرضی (Shrinkage TD)', unit: '%', standard: 'ASTM D955', group: 'thermal' },

  // ---------- نوری و ظاهری (۱۰) ----------
  { key: 'hazeValue', label: 'کدری (Haze)', unit: '%', standard: 'ASTM D1003', group: 'optical' },
  { key: 'clarity', label: 'شفافیت (Clarity)', unit: '%', standard: 'ASTM D1746', group: 'optical' },
  { key: 'gloss45', label: 'براقیت در زاویه ۴۵ درجه (Gloss 45°)', unit: '', standard: 'ASTM D2457', group: 'optical' },
  { key: 'gloss60', label: 'براقیت در زاویه ۶۰ درجه (Gloss 60°)', unit: '', standard: 'ASTM D2457', group: 'optical' },
  { key: 'lightTransmittance', label: 'عبور نور (Light Transmittance)', unit: '%', standard: 'ASTM D1003', group: 'optical' },
  { key: 'refractiveIndex', label: 'ضریب شکست (Refractive Index)', unit: '', standard: 'ASTM D542', group: 'optical' },
  { key: 'yellownessIndex', label: 'شاخص زردی (YI)', unit: '', standard: 'ASTM E313', group: 'optical' },
  { key: 'whitenessIndex', label: 'شاخص سفیدی (WI)', unit: '', standard: 'ASTM E313', group: 'optical' },
  { key: 'colorLValue', label: 'روشنایی رنگ (L* Value)', unit: '', standard: 'ASTM D2244', group: 'optical' },
  { key: 'uvResistance', label: 'مقاومت در برابر فرابنفش (UV Resistance)', unit: 'h', standard: 'ASTM G154', group: 'optical' },

  // ---------- الکتریکی (۸) ----------
  { key: 'dielectricStrength', label: 'استحکام دی‌الکتریک (Dielectric Strength)', unit: 'kV/mm', standard: 'ASTM D149', group: 'electrical' },
  { key: 'dielectricConstant', label: 'ثابت دی‌الکتریک (Dk)', unit: '', standard: 'ASTM D150', group: 'electrical' },
  { key: 'dissipationFactor', label: 'ضریب اتلاف (Df)', unit: '', standard: 'ASTM D150', group: 'electrical' },
  { key: 'volumeResistivity', label: 'مقاومت حجمی (Volume Resistivity)', unit: 'Ω·cm', standard: 'ASTM D257', group: 'electrical' },
  { key: 'surfaceResistivity', label: 'مقاومت سطحی (Surface Resistivity)', unit: 'Ω', standard: 'ASTM D257', group: 'electrical' },
  { key: 'arcResistance', label: 'مقاومت قوس الکتریکی (Arc Resistance)', unit: 's', standard: 'ASTM D495', group: 'electrical' },
  { key: 'cti', label: 'شاخص ردیابی مقایسه‌ای (CTI)', unit: 'V', standard: 'IEC 60112', group: 'electrical' },
  { key: 'antistaticDecayTime', label: 'زمان تخلیه الکتریسیته ساکن (Static Decay)', unit: 's', standard: 'ASTM D257', group: 'electrical' },
]

/** نگهبان توسعه: اگه کسی فیلد اضافه/کم کرد، اینجا خطا می‌ده تا یادش بمونه CSV template رو هم آپدیت کنه. */
export const SPEC_FIELD_COUNT = SPEC_FIELDS.length // = 72

/** جست‌وجوی سریع فیلد با کلید — برای رندر مقادیر ذخیره‌شده */
export const SPEC_FIELD_BY_KEY: Record<string, SpecField> = Object.fromEntries(
  SPEC_FIELDS.map((f) => [f.key, f]),
)

export function specFieldsByGroup(group: SpecGroupKey): SpecField[] {
  return SPEC_FIELDS.filter((f) => f.group === group)
}

/**
 * خوندن Grade.specsJson به‌صورت امن.
 * دیتای قدیمی یا دستکاری‌شده نباید صفحه رو بترکونه — پس هر خطایی
 * به آبجکت خالی برمی‌گرده، نه throw.
 * فقط کلیدهایی که واقعاً توی کاتالوگ هستن برگردونده می‌شن، تا کلید ناشناخته
 * از دیتای قدیمی وارد UI نشه.
 */
export function parseSpecs(specsJson: string | null | undefined): Record<string, string> {
  if (!specsJson) return {}
  try {
    const raw = JSON.parse(specsJson)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!SPEC_FIELD_BY_KEY[k]) continue
      if (v === null || v === undefined) continue
      const s = String(v).trim()
      if (s !== '') out[k] = s
    }
    return out
  } catch {
    return {}
  }
}

/**
 * ساخت رشته‌ی JSON برای ذخیره.
 * مقدار خالی حذف می‌شه — یعنی «فیلد انتخاب شده ولی پر نشده» اصلاً ذخیره نمی‌شه،
 * تا specsJson با کلیدهای بی‌مقدار پر نشه.
 * اگه هیچ فیلدی نمونه، null برمی‌گرده تا ستون دیتابیس NULL بمونه نه "{}".
 */
export function serializeSpecs(values: Record<string, string>): string | null {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(values)) {
    if (!SPEC_FIELD_BY_KEY[k]) continue
    const s = (v ?? '').trim()
    if (s !== '') out[k] = s
  }
  if (Object.keys(out).length === 0) return null
  return JSON.stringify(out)
}

/**
 * استخراج مقادیر مشخصات از FormData فرم گرید.
 * قرارداد نام‌گذاری input ها: spec__<key>  (دو تا آندرلاین)
 * این تابع روی سرور (اکشن) و بدون وابستگی به prisma کار می‌کنه.
 */
export const SPEC_INPUT_PREFIX = 'spec__'

export function readSpecsFromFormData(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of SPEC_FIELDS) {
    const raw = formData.get(SPEC_INPUT_PREFIX + field.key)
    if (typeof raw !== 'string') continue
    const s = raw.trim()
    if (s !== '') values[field.key] = s
  }
  return values
}

/** هدر ستون‌های فایل CSV ایمپورت — ستون‌های پایه + همه‌ی ۷۲ فیلد فنی */
export const CSV_BASE_COLUMNS = [
  'code',
  'producer',
  'category',
  'polymerFamily',
  'applicationType',
  'mfi',
  'mfiTestCondition',
  'density',
  'originCountry',
  'packagingType',
  'description',
] as const

export const CSV_ALL_COLUMNS: string[] = [
  ...CSV_BASE_COLUMNS,
  ...SPEC_FIELDS.map((f) => f.key),
]

/** یک ردیف نمونه برای فایل قالب، تا کاربر بفهمه چی باید بنویسه */
export function buildCsvTemplate(): string {
  const header = CSV_ALL_COLUMNS.join(',')
  const sample = CSV_ALL_COLUMNS.map((col) => {
    if (col === 'code') return 'PP-C30S'
    if (col === 'producer') return 'پتروشیمی مارون'
    if (col === 'category') return 'پلی‌پروپیلن'
    if (col === 'polymerFamily') return 'PP'
    if (col === 'applicationType') return 'Injection'
    if (col === 'mfi') return '25'
    if (col === 'mfiTestCondition') return '230C/2.16kg'
    if (col === 'density') return '0.905'
    if (col === 'originCountry') return 'IR'
    if (col === 'packagingType') return 'کیسه ۲۵ کیلویی'
    if (col === 'description') return 'گرید تزریقی عمومی'
    return ''
  }).join(',')
  return `${header}\n${sample}\n`
}
