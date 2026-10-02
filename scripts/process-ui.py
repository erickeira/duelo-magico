"""Gera as imagens de interface a partir das artes do Gemini (art/ui.prompts.json).

Entrada:  art/ui-raw/<grupo>/<id>.jpg
Saída (public/assets/):
  spells/<id>.jpg       ícone quadrado da magia (256×256)
  spells/<id>.png       ícone redondo para os botões da batalha (128×128)
  gods/<id>.jpg         retrato do deus (360×480)
  gods/<id>.png         retrato redondo do rosto (160×160)
  chests/<id>.png       baú com fundo transparente (até 256 px)
  castles/<id>.png      castelo com fundo transparente (altura 600 px)
  ground/<id>.jpg       chão da arena (1280×720)
  arena/<id>.jpg        cenário da batalha em 3/4, com as trilhas pintadas (1280 de largura)

Uso: python3 scripts/process-ui.py
"""
from pathlib import Path

from PIL import Image

from art_utils import chroma_key, circle, crop_to_content

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "ui-raw"
OUT = ROOT / "public" / "assets"


def trim(img: Image.Image, frac: float = 0.02) -> Image.Image:
    w, h = img.size
    dx, dy = int(w * frac), int(h * frac)
    return img.crop((dx, dy, w - dx, h - dy))


def fit(img: Image.Image, max_side: int) -> Image.Image:
    scale = max_side / max(img.size)
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS) if scale < 1 else img


def save(img: Image.Image, path: Path, **kw) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True, **kw)


def main() -> None:
    count = 0
    for f in sorted((RAW / "spells").glob("*.jpg")):
        img = trim(Image.open(f).convert("RGB"))
        save(img.resize((256, 256), Image.LANCZOS), OUT / "spells" / f"{f.stem}.jpg", quality=86)
        save(circle(img, 128), OUT / "spells" / f"{f.stem}.png")
        count += 1
    for f in sorted((RAW / "gods").glob("*.jpg")):
        img = trim(Image.open(f).convert("RGB"))
        save(img.resize((360, 480), Image.LANCZOS), OUT / "gods" / f"{f.stem}.jpg", quality=86)
        # Rosto: quadrado na parte de cima do retrato.
        w, h = img.size
        side = int(w * 0.72)
        left = (w - side) // 2
        top = int(h * 0.06)
        save(circle(img.crop((left, top, left + side, top + side)), 160), OUT / "gods" / f"{f.stem}.png")
        count += 1
    for f in sorted((RAW / "chests").glob("*.jpg")):
        save(fit(crop_to_content(chroma_key(Image.open(f))), 256), OUT / "chests" / f"{f.stem}.png")
        count += 1
    for f in sorted((RAW / "castles").glob("*.jpg")):
        img = crop_to_content(chroma_key(Image.open(f)))
        scale = 600 / img.height
        save(img.resize((round(img.width * scale), 600), Image.LANCZOS), OUT / "castles" / f"{f.stem}.png")
        count += 1
    for f in sorted((RAW / "ground").glob("*.jpg")):
        img = Image.open(f).convert("RGB")
        save(img.resize((1280, 720), Image.LANCZOS), OUT / "ground" / f"{f.stem}.jpg", quality=84)
        count += 1
    for f in sorted((RAW / "arena").glob("*.jpg")):
        img = Image.open(f).convert("RGB")
        save(img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS), OUT / "arena" / f"{f.stem}.jpg", quality=86)
        count += 1
    print(f"{count} imagens de interface processadas")


if __name__ == "__main__":
    main()
