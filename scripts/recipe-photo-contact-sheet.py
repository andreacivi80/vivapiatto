"""Make a diagnostic contact sheet from photos referenced by recipe matrix IDs."""

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = (ROOT / "app" / "FoodPlanner.tsx").read_text(encoding="utf-8")
PHOTO_DIR = ROOT / "public" / "food"


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: recipe-photo-contact-sheet.py FAMILY START END")
    family, first, last = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    if family not in {"c", "s", "p", "d"} or first < 1 or last < first:
        raise SystemExit("invalid recipe range")
    cards = []
    for number in range(first, last + 1):
        pattern = rf'id:\s*"matrix-{family}{number:02d}-[^\"]+"[\s\S]{{0,700}}?image:\s*photo\("([^\"]+)"\)'
        match = re.search(pattern, SOURCE)
        if not match:
            raise SystemExit(f"no source photo for {family.upper()}{number:02d}")
        path = PHOTO_DIR / f"{match.group(1)}.png"
        if not path.is_file():
            raise SystemExit(f"missing photo: {path}")
        cards.append((f"{family.upper()}{number:02d}", match.group(1), path))

    columns, width, height = 4, 320, 310
    rows = (len(cards) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * width, rows * height), "#f7f7f4")
    draw = ImageDraw.Draw(sheet)
    for index, (label, asset, path) in enumerate(cards):
        x, y = (index % columns) * width, (index // columns) * height
        with Image.open(path) as original:
            photo = original.convert("RGB")
            photo.thumbnail((290, 250), Image.Resampling.LANCZOS)
            sheet.paste(photo, (x + (width - photo.width) // 2, y + 10))
        draw.text((x + 12, y + 266), f"{label}  {asset[:37]}", fill="black")

    destination = ROOT / "outputs" / f"{family}{first:02d}-{last:02d}-photo-contact.png"
    destination.parent.mkdir(exist_ok=True)
    sheet.save(destination, optimize=True)
    print(destination)


if __name__ == "__main__":
    main()
