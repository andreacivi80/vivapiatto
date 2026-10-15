"""Resize a generated recipe photo to a compact square PNG for mobile cards."""

import sys
from PIL import Image


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: optimize-photo.py INPUT OUTPUT")
    source, destination = sys.argv[1:]
    with Image.open(source) as image:
        image = image.convert("RGB")
        image = image.resize((512, 512), Image.Resampling.LANCZOS)
        image.save(destination, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
