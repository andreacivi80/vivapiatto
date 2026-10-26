"""Create ingredient-labelled contact sheets for recipes outside C/S/P/D matrices."""

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
SOURCE = (ROOT / "app" / "FoodPlanner.tsx").read_text(encoding="utf-8")
PHOTOS = ROOT / "public" / "food"
OUTPUT = ROOT / "outputs"


def recipe_rows() -> list[tuple[str, str, list[str], Path]]:
    entries = []
    headers = list(re.finditer(r'\bid:\s*"([^"]+)",\s*name:\s*"([^"]+)"', SOURCE))
    for index, header in enumerate(headers):
        recipe_id, title = header.groups()
        if re.match(r"matrix-[cspd]\d{2}-", recipe_id):
            continue
        end = headers[index + 1].start() if index + 1 < len(headers) else len(SOURCE)
        block = SOURCE[header.end() : min(end, header.end() + 2400)]
        image = re.search(r'\bimage:\s*photo\("(recipe-[^"]+)"\)', block)
        if not image:
            continue
        ingredient_block = re.search(r'\bingredients:\s*\[([^\]]+)\]', block)
        ingredients = re.findall(r'\bfood:\s*"([^"]+)"', ingredient_block.group(1)) if ingredient_block else []
        path = PHOTOS / f"{image.group(1)}.png"
        if not path.is_file():
            raise SystemExit(f"Foto mancante: {path}")
        entries.append((recipe_id, title, ingredients, path))
    return entries


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1].isdigit() or int(sys.argv[1]) < 1:
        raise SystemExit("usage: other-recipe-photo-contact-sheet.py PAGE")
    page = int(sys.argv[1])
    entries = recipe_rows()
    per_page = 16
    selection = entries[(page - 1) * per_page : page * per_page]
    if not selection:
        raise SystemExit(f"Pagina inesistente: {page}; ricette trovate: {len(entries)}")
    width, height = 360, 350
    sheet = Image.new("RGB", (4 * width, 4 * height), "#f7f7f4")
    draw = ImageDraw.Draw(sheet)
    for index, (recipe_id, title, ingredients, path) in enumerate(selection):
        x, y = index % 4 * width, index // 4 * height
        with Image.open(path) as original:
            photo = original.convert("RGB")
            photo.thumbnail((310, 255), Image.Resampling.LANCZOS)
            sheet.paste(photo, (x + (width - photo.width) // 2, y + 4))
        draw.text((x + 10, y + 264), recipe_id[:49], fill="#111111")
        draw.text((x + 10, y + 282), title[:49], fill="#222222")
        summary = ", ".join(ingredients)
        draw.text((x + 10, y + 302), summary[:52], fill="#444444")
        draw.text((x + 10, y + 319), summary[52:104], fill="#444444")
    OUTPUT.mkdir(exist_ok=True)
    path = OUTPUT / f"other-recipe-photo-contact-{page:02d}.png"
    sheet.save(path, optimize=True)
    print(f"{len(entries)} ricette fuori matrice; pagina {page}; {path}")


if __name__ == "__main__":
    main()
