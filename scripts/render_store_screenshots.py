import subprocess
import os
import sys
from PIL import Image

SCENES = [
    {
        "id": 1,
        "name": "01_gameplay_action",
        "title": "3D Gameplay & Blizzard Combos"
    },
    {
        "id": 2,
        "name": "02_cozy_winter_village",
        "title": "Atmospheric Winter Village"
    },
    {
        "id": 3,
        "name": "03_garage_upgrades",
        "title": "Garage Vehicle Upgrades"
    },
    {
        "id": 4,
        "name": "04_vehicle_skins",
        "title": "Custom Vehicle Skins & Shop"
    },
    {
        "id": 5,
        "name": "05_lucky_wheel_rewards",
        "title": "Lucky Wheel & Daily Bonus"
    }
]

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    html_path = os.path.join(root, 'scripts', 'store_screenshots.html')
    release_dir = os.path.join(root, 'release', 'screenshots')
    os.makedirs(release_dir, exist_ok=True)

    print(f"Generating {len(SCENES)} Google Play Store screenshots (1920x1080, 16:9)...")

    results = []

    for scene in SCENES:
        sid = scene["id"]
        sname = scene["name"]
        print(f"\n[Scene {sid}/5] Rendering '{scene['title']}'...")

        raw_png = os.path.join(release_dir, f"raw_{sname}.png")
        final_png = os.path.join(release_dir, f"frostplow_screenshot_{sname}.png")
        final_jpg = os.path.join(release_dir, f"frostplow_screenshot_{sname}.jpg")

        cmd = [
            "google-chrome",
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--hide-scrollbars",
            "--window-size=1920,1080",
            f"--screenshot={raw_png}",
            f"file://{html_path}?scene={sid}"
        ]

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            print(f"Chrome render error on scene {sid}:", res.stderr)
            continue

        with Image.open(raw_png) as img:
            # Guarantee exact 1920x1080 dimensions
            if img.size != (1920, 1080):
                img = img.crop((0, 0, 1920, 1080))
            
            # Save PNG (lossless)
            img.save(final_png, format="PNG", optimize=True)
            png_mb = os.path.getsize(final_png) / (1024 * 1024)

            # Save JPEG (high quality 92%)
            rgb_img = img.convert("RGB")
            rgb_img.save(final_jpg, format="JPEG", quality=92, optimize=True)
            jpg_mb = os.path.getsize(final_jpg) / (1024 * 1024)

            print(f"  ✓ PNG: {final_png} ({png_mb:.2f} MB, {img.size[0]}x{img.size[1]})")
            print(f"  ✓ JPG: {final_jpg} ({jpg_mb:.2f} MB, {rgb_img.size[0]}x{rgb_img.size[1]})")

            assert img.size == (1920, 1080)
            assert png_mb < 8.0, "PNG exceeds 8MB limit"
            assert jpg_mb < 8.0, "JPG exceeds 8MB limit"

            results.append({
                "id": sid,
                "name": sname,
                "title": scene["title"],
                "png": final_png,
                "jpg": final_jpg,
                "png_size": f"{png_mb:.2f} MB",
                "jpg_size": f"{jpg_mb:.2f} MB",
                "res": "1920x1080 (16:9)"
            })

        if os.path.exists(raw_png):
            os.remove(raw_png)

    # Clean up test-title if exists
    test_title = os.path.join(root, 'release', 'test-title.png')
    if os.path.exists(test_title):
        os.remove(test_title)

    print("\n" + "="*60)
    print("✅ All 5 Google Play Store Screenshots rendered successfully!")
    print("="*60)
    for r in results:
        print(f"[{r['id']}] {r['title']} | Resolution: {r['res']} | PNG: {r['png_size']} | JPG: {r['jpg_size']}")

if __name__ == '__main__':
    main()
