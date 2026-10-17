import subprocess
import os
import sys
from PIL import Image

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    html_path = os.path.join(root, 'scripts', 'feature_graphic.html')
    release_dir = os.path.join(root, 'release')
    public_dir = os.path.join(root, 'public')
    os.makedirs(release_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)

    raw_output = os.path.join(release_dir, 'raw_feature_graphic.png')
    final_png = os.path.join(release_dir, 'frostplow-feature-graphic-1024x500.png')
    final_jpg = os.path.join(release_dir, 'frostplow-feature-graphic-1024x500.jpg')

    public_png = os.path.join(public_dir, 'frostplow-feature-graphic-1024x500.png')
    public_jpg = os.path.join(public_dir, 'frostplow-feature-graphic-1024x500.jpg')

    print("[1/3] Rendering 1024x500 Feature Graphic via headless Chrome...")
    cmd = [
        "google-chrome",
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--window-size=1024,500",
        "--virtual-time-budget=2500",
        f"--screenshot={raw_output}",
        f"file://{html_path}"
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("Chrome render error:", res.stderr)
        sys.exit(1)

    print("[2/3] Processing image with PIL to guarantee exact 1024x500 dimensions...")
    with Image.open(raw_output) as img:
        print(f"Captured dimensions: {img.size}")
        # Crop or resize exactly to 1024x500 if Chrome took window margins
        if img.size != (1024, 500):
            # Take top-left 1024x500
            img = img.crop((0, 0, 1024, 500))
        
        # Save PNG (lossless, optimized)
        img.save(final_png, format="PNG", optimize=True)
        img.save(public_png, format="PNG", optimize=True)
        png_size_kb = os.path.getsize(final_png) / 1024
        print(f"✓ Saved PNG: {final_png} ({png_size_kb:.1f} KB, size: {img.size})")

        # Save JPEG (high quality 95%, RGB)
        rgb_img = img.convert("RGB")
        rgb_img.save(final_jpg, format="JPEG", quality=95, optimize=True)
        rgb_img.save(public_jpg, format="JPEG", quality=95, optimize=True)
        jpg_size_kb = os.path.getsize(final_jpg) / 1024
        print(f"✓ Saved JPEG: {final_jpg} ({jpg_size_kb:.1f} KB, size: {rgb_img.size})")

    # Clean up temp raw file
    if os.path.exists(raw_output):
        os.remove(raw_output)

    print("[3/3] Verification:")
    with Image.open(final_png) as p_img, Image.open(final_jpg) as j_img:
        assert p_img.size == (1024, 500), f"PNG size mismatch: {p_img.size}"
        assert j_img.size == (1024, 500), f"JPG size mismatch: {j_img.size}"
        assert os.path.getsize(final_png) < 15 * 1024 * 1024, "PNG exceeds 15MB"
        assert os.path.getsize(final_jpg) < 15 * 1024 * 1024, "JPG exceeds 15MB"
        print("✅ SUCCESS! Both PNG and JPEG feature graphics meet 100% of Google Play requirements (1024px X 500px, < 15MB)!")

if __name__ == '__main__':
    main()
