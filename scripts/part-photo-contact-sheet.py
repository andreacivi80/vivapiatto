"""Diagnostic contact sheet for the visible single-food alternatives."""

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = (ROOT / "app" / "FoodPlanner.tsx").read_text(encoding="utf-8")
PHOTO_DIR = ROOT / "public" / "food"


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1].isdigit():
        raise SystemExit("usage: part-photo-contact-sheet.py PAGE_NUMBER")
    page = int(sys.argv[1])
    if page < 1:
        raise SystemExit("page must be positive")
    start = SOURCE.index("const mealPartOptions:")
    end = SOURCE.index("const ingredientPartCatalog:", start)
    catalog = SOURCE[start:end]
    pattern = re.compile(
        r'\{[^{}]*\bfood:\s*"([^"]+)"[^{}]*\bimage:\s*photo\("([^"]+)"\)[^{}]*\}'
    )
    choices = sorted(set(pattern.findall(catalog)), key=lambda pair: pair[0].casefold())
    if not choices:
        raise SystemExit("no ingredient photos found")
    per_page = 32
    selected = choices[(page - 1) * per_page : page * per_page]
    if not selected:
        raise SystemExit(f"page {page} is past the last of {len(choices)} choices")

    columns, width, height = 4, 300, 270
    rows = (len(selected) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * width, rows * height), "#f7f7f4")
    draw = ImageDraw.Draw(sheet)
    for index, (food, asset) in enumerate(selected):
        path = PHOTO_DIR / f"{asset}.png"
        if not path.is_file():
            raise SystemExit(f"missing photo: {path}")
        x, y = (index % columns) * width, (index // columns) * height
        try:
            with Image.open(path) as original:
                photo = original.convert("RGB")
                photo.thumbnail((275, 215), Image.Resampling.LANCZOS)
                sheet.paste(photo, (x + (width - photo.width) // 2, y + 4))
        except OSError as error:
            raise SystemExit(f"invalid photo for {food}: {path} ({error})") from error
        draw.text((x + 8, y + 225), food[:39], fill="black")
        draw.text((x + 8, y + 242), asset[:38], fill="#444444")

    destination = ROOT / "outputs" / f"part-photo-contact-{page:02d}.png"
    destination.parent.mkdir(exist_ok=True)
    sheet.save(destination, optimize=True)
    print(f"{destination} ({len(selected)}/{len(choices)} choices)")


if __name__ == "__main__":
    main()
