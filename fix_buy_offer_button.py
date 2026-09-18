path = "src/components/ListingDetailModal.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- import ----
old_import = "import TrustCardModal from '@/components/TrustCardModal'"
new_import = "import TrustCardModal from '@/components/TrustCardModal'\nimport { createDealFromListingAction } from '@/app/market/actions'"
n0 = content.count(old_import)
content = content.replace(old_import, new_import, 1) if n0 == 1 else content
report.append(f"{'OK' if n0==1 else 'FAIL'} import ({n0})")

# ---- جای اول (دکمه‌ی کوچیک بالای کارت) ----
old1 = '''<span style={btnDisabledStyle} title="صفحه‌ی شروع معامله به‌زودی" onClick={(e) => e.stopPropagation()}>
                پیشنهاد خرید
              </span>'''
new1 = '''listing.validityStatus === 'active' ? (
              <form action={createDealFromListingAction} onClick={(e) => e.stopPropagation()}>
                <input type="hidden" name="materialListingId" value={listing.id} />
                <button type="submit" style={{ background: colors.orange, color: '#fff', border: 'none', borderRadius: radius.md, padding: '8px 16px', fontSize: fontSize.sm, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>پیشنهاد خرید</button>
              </form>
            ) : (
              <span style={btnDisabledStyle} title="این آگهی در حال معامله است" onClick={(e) => e.stopPropagation()}>
                پیشنهاد خرید
              </span>
            )'''
n1 = content.count(old1)
content = content.replace(old1, new1, 1) if n1 == 1 else content
report.append(f"{'OK' if n1==1 else 'FAIL'} دکمه‌ی اول ({n1})")

# ---- جای دوم (دکمه‌ی اصلی پایین مودال) ----
old2 = '''<span
              style={{ ...buyButtonStyle, background: colors.bgPage, color: '#6f7680', border: `1px solid ${colors.borderStrong}`, cursor: 'default' }}
              title="صفحه‌ی شروع معامله به‌زودی"
            >
              پیشنهاد خرید
            </span>'''
new2 = '''listing.validityStatus === 'active' ? (
            <form action={createDealFromListingAction}>
              <input type="hidden" name="materialListingId" value={listing.id} />
              <button type="submit" style={{ ...buyButtonStyle, border: 'none', cursor: 'pointer', width: '100%' }}>پیشنهاد خرید</button>
            </form>
          ) : (
            <span
              style={{ ...buyButtonStyle, background: colors.bgPage, color: '#6f7680', border: `1px solid ${colors.borderStrong}`, cursor: 'default' }}
              title="این آگهی در حال معامله است"
            >
              پیشنهاد خرید
            </span>
          )'''
n2 = content.count(old2)
content = content.replace(old2, new2, 1) if n2 == 1 else content
report.append(f"{'OK' if n2==1 else 'FAIL'} دکمه‌ی دوم ({n2})")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
