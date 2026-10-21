"""Downsize the versioned whey-shake recipe photographs for mobile delivery."""

from pathlib import Path

from PIL import Image


food_dir = Path(__file__).resolve().parents[1] / "public" / "food"
for flavor in ("chocolate", "strawberry", "cookie"):
    path = food_dir / f"recipe-whey-{flavor}-milk-v12039.png"
    before = path.stat().st_size
    with Image.open(path) as source:
        image = source.convert("RGB").resize((640, 640), Image.Resampling.LANCZOS)
        image.save(path, format="PNG", optimize=True, compress_level=9)
    print(f"{path.name}: {before} -> {path.stat().st_size} bytes")
