path = "src/components/PublicHeader.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- ۱: import useRef, useLayoutEffect ----
old1 = "import { useEffect, useState } from 'react'"
new1 = "import { useEffect, useLayoutEffect, useRef, useState } from 'react'"
n1 = content.count(old1)
content = content.replace(old1, new1, 1) if n1 == 1 else content
report.append(f"{'OK' if n1==1 else 'FAIL'} import hooks ({n1})")

# ---- ۲: اضافه‌کردن ref و state برای موقعیت نشانگر، داخل کامپوننت ----
old2 = """  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])"""
new2 = """  const [menuOpen, setMenuOpen] = useState(false)
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  const updateIndicator = () => {
    const activeEl = activePage ? navRefs.current[activePage] : null
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth })
    } else {
      setIndicator(null)
    }
  }

  useLayoutEffect(() => {
    updateIndicator()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) setMenuOpen(false)
      updateIndicator()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])"""
n2 = content.count(old2)
content = content.replace(old2, new2, 1) if n2 == 1 else content
report.append(f"{'OK' if n2==1 else 'FAIL'} منطق اندازه‌گیری indicator ({n2})")

# ---- ۳: اضافه‌کردن ref به هر لینک نویگیشن + پوزیشن relative روی nav ----
old3 = """          <nav style={navStyle} data-public-nav="true">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  ...navLinkStyle,
                  color: activePage === item.href ? '#ffffff' : 'rgba(255,255,255,0.78)',
                  fontWeight: activePage === item.href ? 700 : 600,
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>"""
new3 = """          <nav style={navStyle} data-public-nav="true">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                ref={(el) => { navRefs.current[item.href] = el }}
                style={{
                  ...navLinkStyle,
                  color: activePage === item.href ? '#ffffff' : 'rgba(255,255,255,0.78)',
                  fontWeight: activePage === item.href ? 700 : 600,
                }}
              >
                {item.label}
              </a>
            ))}
            {indicator && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: indicator.left,
                  width: indicator.width,
                  height: 2,
                  background: colors.orange,
                  borderRadius: 2,
                  transition: 'left 0.3s ease, width 0.3s ease',
                }}
              />
            )}
          </nav>"""
n3 = content.count(old3)
content = content.replace(old3, new3, 1) if n3 == 1 else content
report.append(f"{'OK' if n3==1 else 'FAIL'} افزودن ref + نشانگر به JSX ({n3})")

# ---- ۴: navStyle باید position: relative بگیره تا نشانگر absolute درست جا بگیره ----
old4 = """const navStyle: CSSProperties = {
  display: 'flex',
  gap: 26,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'var(--font-label)',
}"""
new4 = """const navStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  gap: 26,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'var(--font-label)',
  paddingBottom: 4,
}"""
n4 = content.count(old4)
content = content.replace(old4, new4, 1) if n4 == 1 else content
report.append(f"{'OK' if n4==1 else 'FAIL'} navStyle → position:relative ({n4})")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
