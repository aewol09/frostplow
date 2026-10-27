import os
import subprocess
import sys
from PIL import Image, ImageDraw

def render_svg_to_png(svg_content, output_png_path, size=512, transparent=False):
    temp_svg = output_png_path + ".temp.svg"
    with open(temp_svg, "w", encoding="utf-8") as f:
        f.write(svg_content)
    
    cmd = [
        "google-chrome",
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        f"--window-size={size},{size}",
        f"--screenshot={output_png_path}",
    ]
    if transparent:
        cmd.append("--default-background-color=00000000")
    cmd.append(f"file://{temp_svg}")

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Chrome render error: {res.stderr}")
        if os.path.exists(temp_svg):
            os.remove(temp_svg)
        sys.exit(1)

    if os.path.exists(temp_svg):
        os.remove(temp_svg)

    # Guarantee exact dimensions and RGBA mode
    with Image.open(output_png_path) as img:
        if img.size != (size, size):
            img = img.crop((0, 0, size, size))
        if transparent and img.mode != "RGBA":
            img = img.convert("RGBA")
        img.save(output_png_path, format="PNG", optimize=True)

def create_circular_mask(size):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    return mask

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    android_res = os.path.join(root, "android", "app", "src", "main", "res")
    public_dir = os.path.join(root, "public")
    release_dir = os.path.join(root, "release")
    os.makedirs(release_dir, exist_ok=True)

    # 1. SVGs definition
    # Base defs
    defs = """
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    <linearGradient id="snowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#bae6fd" />
    </linearGradient>
  </defs>"""

    bg_elements = """
  <rect width="512" height="512" fill="url(#bg)" />
  <polygon points="120,380 256,160 392,380" fill="#334155" opacity="0.6" />
  <polygon points="256,160 216,224 256,210 296,224" fill="#ffffff" />
  <polygon points="260,380 370,190 480,380" fill="#1e293b" opacity="0.8" />
  <polygon points="370,190 338,245 370,230 402,245" fill="#ffffff" />
  <path d="M 0,380 Q 140,340 256,370 Q 372,400 512,360 L 512,512 L 0,512 Z" fill="url(#snowGrad)" />"""

    fg_elements = """
  <!-- Shift slightly left and scale down so it fits perfectly in Adaptive Icon 66dp safe-zone -->
  <g transform="translate(-20, -10)">
    <rect x="150" y="220" width="160" height="130" rx="20" fill="url(#gold)" />
    <rect x="210" y="235" width="85" height="55" rx="10" fill="#38bdf8" opacity="0.85" />
    <path d="M 310,270 L 375,285 L 375,350 L 310,350 Z" fill="url(#gold)" />
    <circle cx="200" cy="205" r="16" fill="#fbbf24" filter="drop-shadow(0 0 10px #f59e0b)" />
    <path d="M 360,250 C 430,270 450,330 460,375 L 390,375 C 385,340 370,300 345,280 Z" fill="url(#bladeGrad)" stroke="#475569" stroke-width="4" />
    <circle cx="180" cy="370" r="46" fill="#0f172a" stroke="#64748b" stroke-width="8" />
    <circle cx="180" cy="370" r="18" fill="#94a3b8" />
    <circle cx="330" cy="370" r="46" fill="#0f172a" stroke="#64748b" stroke-width="8" />
    <circle cx="330" cy="370" r="18" fill="#94a3b8" />
    <circle cx="430" cy="240" r="9" fill="#ffffff" />
    <circle cx="460" cy="220" r="6" fill="#ffffff" />
    <circle cx="475" cy="260" r="7" fill="#ffffff" />
    <circle cx="415" cy="200" r="5" fill="#ffffff" />
  </g>"""

    # Combined full square SVG (Store 512x512 standard)
    svg_store = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{defs}{bg_elements}{fg_elements}</svg>'

    # Combined squircle SVG for legacy ic_launcher
    svg_legacy = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
{defs}
  <clipPath id="squircle">
    <rect width="512" height="512" rx="100" />
  </clipPath>
  <g clip-path="url(#squircle)">
{bg_elements}
{fg_elements}
  </g>
</svg>"""

    # Background SVG for adaptive icon
    svg_bg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{defs}{bg_elements}</svg>'

    # Foreground SVG for adaptive icon (transparent background)
    svg_fg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{defs}{fg_elements}</svg>'

    temp_store_png = "/tmp/frostplow_store_512.png"
    temp_legacy_png = "/tmp/frostplow_legacy_512.png"
    temp_bg_png = "/tmp/frostplow_bg_512.png"
    temp_fg_png = "/tmp/frostplow_fg_512.png"

    print("[1/5] Rendering base SVGs to high-res PNGs...")
    render_svg_to_png(svg_store, temp_store_png, 512, transparent=False)
    render_svg_to_png(svg_legacy, temp_legacy_png, 512, transparent=True)
    render_svg_to_png(svg_bg, temp_bg_png, 512, transparent=False)
    render_svg_to_png(svg_fg, temp_fg_png, 512, transparent=True)

    img_store = Image.open(temp_store_png).convert("RGBA")
    img_legacy = Image.open(temp_legacy_png).convert("RGBA")
    img_bg = Image.open(temp_bg_png).convert("RGBA")
    img_fg = Image.open(temp_fg_png).convert("RGBA")

    # Save Store official 512x512 icon
    store_icon_path = os.path.join(release_dir, "frostplow-icon-512x512.png")
    img_store.save(store_icon_path, format="PNG", optimize=True)
    print(f"✓ Play Store 512x512 icon: {store_icon_path}")

    # Save PWA icons in public/
    print("[2/5] Updating public/ PWA icons...")
    img_legacy.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "pwa-192x192.png"), format="PNG", optimize=True)
    img_legacy.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "pwa-512x512.png"), format="PNG", optimize=True)
    img_legacy.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "pwa-maskable-512x512.png"), format="PNG", optimize=True)
    img_legacy.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "apple-touch-icon.png"), format="PNG", optimize=True)

    # 3. Android mipmap resolutions
    # Densitites: (folder, launcher_size, adaptive_size)
    densities = [
        ("mipmap-mdpi", 48, 108),
        ("mipmap-hdpi", 72, 162),
        ("mipmap-xhdpi", 96, 216),
        ("mipmap-xxhdpi", 144, 324),
        ("mipmap-xxxhdpi", 192, 432),
    ]

    print("[3/5] Generating Android mipmap resources...")
    for folder, l_size, a_size in densities:
        folder_path = os.path.join(android_res, folder)
        os.makedirs(folder_path, exist_ok=True)

        # 3.1 ic_launcher.png (Legacy squircle)
        l_img = img_legacy.resize((l_size, l_size), Image.Resampling.LANCZOS)
        l_img.save(os.path.join(folder_path, "ic_launcher.png"), format="PNG", optimize=True)

        # 3.2 ic_launcher_round.png (Legacy circular)
        round_canvas = Image.new("RGBA", (l_size, l_size), (0, 0, 0, 0))
        # resize store full square to l_size
        sq_img = img_store.resize((l_size, l_size), Image.Resampling.LANCZOS)
        mask = create_circular_mask((l_size, l_size))
        round_canvas.paste(sq_img, (0, 0), mask)
        round_canvas.save(os.path.join(folder_path, "ic_launcher_round.png"), format="PNG", optimize=True)

        # 3.3 ic_launcher_background.png (Adaptive background)
        bg_resized = img_bg.resize((a_size, a_size), Image.Resampling.LANCZOS)
        bg_resized.save(os.path.join(folder_path, "ic_launcher_background.png"), format="PNG", optimize=True)

        # 3.4 ic_launcher_foreground.png (Adaptive foreground, centered in 66dp safe zone)
        # Scale fg to ~80% of adaptive canvas to ensure it fits safely inside all mask shapes
        fg_scaled_size = int(a_size * 0.82)
        fg_scaled = img_fg.resize((fg_scaled_size, fg_scaled_size), Image.Resampling.LANCZOS)
        fg_canvas = Image.new("RGBA", (a_size, a_size), (0, 0, 0, 0))
        offset = ((a_size - fg_scaled_size) // 2, (a_size - fg_scaled_size) // 2)
        fg_canvas.paste(fg_scaled, offset, fg_scaled)
        fg_canvas.save(os.path.join(folder_path, "ic_launcher_foreground.png"), format="PNG", optimize=True)

        print(f"  ✓ {folder}: launcher({l_size}x{l_size}), round({l_size}x{l_size}), adaptive({a_size}x{a_size})")

    # 4. Update XML configurations
    print("[4/5] Updating Android XML configurations...")
    anydpi_dir = os.path.join(android_res, "mipmap-anydpi-v26")
    os.makedirs(anydpi_dir, exist_ok=True)

    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"""
    with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)
    with open(os.path.join(anydpi_dir, "ic_launcher_round.xml"), "w", encoding="utf-8") as f:
        f.write(adaptive_xml)

    values_bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0f172a</color>
</resources>
"""
    with open(os.path.join(android_res, "values", "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write(values_bg_xml)

    # 5. Clean up old conflicting default vector files if they exist
    print("[5/5] Cleaning up legacy template vectors...")
    unwanted_files = [
        os.path.join(android_res, "drawable-v24", "ic_launcher_foreground.xml"),
        os.path.join(android_res, "drawable", "ic_launcher_background.xml"),
    ]
    for path in unwanted_files:
        if os.path.exists(path):
            os.remove(path)
            print(f"  ✓ Removed template vector: {os.path.relpath(path, root)}")

    print("\n🎉 All Android & Web icons successfully generated and configured!")

if __name__ == "__main__":
    main()
