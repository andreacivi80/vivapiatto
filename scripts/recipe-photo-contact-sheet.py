"""Make a diagnostic contact sheet from photos referenced by recipe matrix IDs."""

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = (ROOT / "app" / "FoodPlanner.tsx").read_text(encoding="utf-8")
PHOTO_DIR = ROOT / "public" / "food"


def main() -> None:
    if len(sys.argv) not in (4, 5):
        raise SystemExit("usage: recipe-photo-contact-sheet.py FAMILY START END [--ingredients]")
    family, first, last = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    detailed = len(sys.argv) == 5 and sys.argv[4] == "--ingredients"
    if len(sys.argv) == 5 and not detailed:
        raise SystemExit("unknown option")
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
        block_end = SOURCE.find("steps:", match.end())
        block = SOURCE[match.start() : block_end if block_end != -1 else match.end()]
        title = re.search(r'name:\s*"([^"]+)"', block)
        ingredient_match = re.search(r'ingredients:\s*\[([^\]]+)\]', block)
        ingredients = re.findall(r'food:\s*"([^"]+)"', ingredient_match.group(1)) if ingredient_match else []
        cards.append((f"{family.upper()}{number:02d}", match.group(1), path, title.group(1) if title else "", ingredients))

    columns, width, height = 4, 320, 365 if detailed else 310
    rows = (len(cards) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * width, rows * height), "#f7f7f4")
    draw = ImageDraw.Draw(sheet)
    for index, (label, asset, path, title, ingredients) in enumerate(cards):
        x, y = (index % columns) * width, (index // columns) * height
        with Image.open(path) as original:
            photo = original.convert("RGB")
            photo.thumbnail((290, 250), Image.Resampling.LANCZOS)
            sheet.paste(photo, (x + (width - photo.width) // 2, y + 10))
        draw.text((x + 12, y + 266), f"{label}  {asset[:37]}", fill="black")
        if detailed:
            draw.text((x + 12, y + 285), title[:46], fill="#222222")
            summary = ", ".join(ingredients)
            draw.text((x + 12, y + 305), summary[:48], fill="#444444")
            draw.text((x + 12, y + 323), summary[48:96], fill="#444444")

    suffix = "-detail" if detailed else ""
    destination = ROOT / "outputs" / f"{family}{first:02d}-{last:02d}{suffix}-photo-contact.png"
    destination.parent.mkdir(exist_ok=True)
    sheet.save(destination, optimize=True)
    print(destination)


if __name__ == "__main__":
    main()
