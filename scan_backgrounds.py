import os
import re

ROOT = "src/app"
results = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    if "page.tsx" not in filenames:
        continue
    path = os.path.join(dirpath, "page.tsx")
    with open(path, encoding="utf-8") as f:
        content = f.read()

    is_panel = "PanelHeader" in content
    is_public = "PublicHeader" in content or "site-footer" in content or "Footer" in content

    bg_matches = re.findall(r"background:\s*(colors\.\w+|['\"]#[0-9a-fA-F]{3,8}['\"]|var\(--bg\))", content)

    kind = "PANEL" if is_panel else ("PUBLIC" if is_public else "UNKNOWN")
    results.append((path, kind, bg_matches))

print(f"{'مسیر':50} {'نوع':10} {'مقادیر background پیداشده'}")
print("-" * 120)
for path, kind, bg_matches in sorted(results, key=lambda x: (x[1], x[0])):
    print(f"{path:50} {kind:10} {bg_matches}")

print(f"\nمجموع صفحات بررسی‌شده: {len(results)}")
print(f"PANEL: {sum(1 for _,k,_ in results if k=='PANEL')}")
print(f"PUBLIC: {sum(1 for _,k,_ in results if k=='PUBLIC')}")
print(f"UNKNOWN: {sum(1 for _,k,_ in results if k=='UNKNOWN')}")
