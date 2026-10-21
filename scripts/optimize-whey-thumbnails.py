"""Downsize the four v1.20.38 powder photographs for mobile catalog cards."""

from pathlib import Path

from PIL import Image


food_dir = Path(__file__).resolve().parents[1] / "public" / "food"
for flavor in ("vanilla", "chocolate", "strawberry", "cookie"):
    path = food_dir / f"part-whey-{flavor}-v12038.png"
    before = path.stat().st_size
    with Image.open(path) as source:
        image = source.convert("RGB").resize((320, 320), Image.Resampling.LANCZOS)
        image.save(path, format="PNG", optimize=True, compress_level=9)
    print(f"{path.name}: {before} -> {path.stat().st_size} bytes")
