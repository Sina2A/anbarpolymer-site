report = []

# ---- رفع ۱: QuickActionCard.tsx — پذیرفتن آیکون واقعی به‌جای رشته ----
path1 = "src/components/QuickActionCard.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1a = "import { colors, spacing, radius, fontSize } from '@/lib/styles/tokens'\nimport type { CSSProperties } from 'react'"
new1a = "import { colors, spacing, radius, fontSize } from '@/lib/styles/tokens'\nimport type { CSSProperties, ReactNode } from 'react'"
n1a = c1.count(old1a)
c1 = c1.replace(old1a, new1a, 1) if n1a == 1 else c1

old1b = "  icon: string"
new1b = "  icon: ReactNode"
n1b = c1.count(old1b)
c1 = c1.replace(old1b, new1b, 1) if n1b == 1 else c1

old1c = """const iconStyle: CSSProperties = {
  fontSize: 28,
  marginBottom: spacing.xs,
  lineHeight: 1,
}"""
new1c = """const iconStyle: CSSProperties = {
  marginBottom: spacing.xs,
  lineHeight: 1,
  display: 'flex',
}"""
n1c = c1.count(old1c)
c1 = c1.replace(old1c, new1c, 1) if n1c == 1 else c1

with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)
report.append(f"{'OK' if n1a==1 else 'FAIL'} {path1}: import ReactNode ({n1a})")
report.append(f"{'OK' if n1b==1 else 'FAIL'} {path1}: type icon ({n1b})")
report.append(f"{'OK' if n1c==1 else 'FAIL'} {path1}: iconStyle ({n1c})")

# ---- رفع ۲: dashboard/page.tsx — جایگزینی emoji با آیکون واقعی ----
path2 = "src/app/dashboard/page.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

old2_import = "import QuickActionCard from '@/components/QuickActionCard'"
new2_import = "import QuickActionCard from '@/components/QuickActionCard'\nimport { Package, ShoppingCart, ClipboardList, Megaphone, Handshake, MessageCircle } from 'lucide-react'"
n2_import = c2.count(old2_import)
c2 = c2.replace(old2_import, new2_import, 1) if n2_import == 1 else c2

icon_map = [
    ('icon="📦"', 'icon={<Package size={28} color={colors.navy} />}'),
    ('icon="🛒"', 'icon={<ShoppingCart size={28} color={colors.navy} />}'),
    ('icon="📋"', 'icon={<ClipboardList size={28} color={colors.navy} />}'),
    ('icon="📢"', 'icon={<Megaphone size={28} color={colors.navy} />}'),
    ('icon="🤝"', 'icon={<Handshake size={28} color={colors.navy} />}'),
    ('icon="💬"', 'icon={<MessageCircle size={28} color={colors.navy} />}'),
]
icon_report = []
for old, new in icon_map:
    n = c2.count(old)
    c2 = c2.replace(old, new, 1) if n == 1 else c2
    icon_report.append(f"{'OK' if n==1 else 'FAIL'} {old} -> ({n})")

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)
report.append(f"{'OK' if n2_import==1 else 'FAIL'} {path2}: import آیکون‌ها ({n2_import})")
report.extend(icon_report)

print("\n".join(report))
