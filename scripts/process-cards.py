"""Gera as imagens usadas pelo jogo a partir das artes originais do Gemini.

Entrada:  art/cards-raw/<id>.jpg   (896x1200, geradas com art/cards.prompts.json)
Saída:    public/assets/cards/<id>.jpg   arte da carta (360x480)
          public/assets/tokens/<id>.png  token redondo para a batalha (128x128, fundo transparente)

Uso: python3 scripts/process-cards.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "cards-raw"
CARDS = ROOT / "public" / "assets" / "cards"
TOKENS = ROOT / "public" / "assets" / "tokens"

# Corte de borda (fração de cada lado). Algumas artes vieram com uma moldura fina.
DEFAULT_TRIM = 0.025
TRIM = {"campea-do-sol": 0.05}

CARD_SIZE = (360, 480)
TOKEN_SIZE = 128
SUPERSAMPLE = 4


def trim(img: Image.Image, frac: float) -> Image.Image:
    w, h = img.size
    dx, dy = int(w * frac), int(h * frac)
    return img.crop((dx, dy, w - dx, h - dy))


def token(img: Image.Image) -> Image.Image:
    """Recorte quadrado da parte de cima/centro (onde fica o personagem) com máscara redonda."""
    w, h = img.size
    side = int(w * 0.92)
    left = (w - side) // 2
    top = int(h * 0.08)
    square = img.crop((left, top, left + side, top + side)).resize((TOKEN_SIZE, TOKEN_SIZE), Image.LANCZOS)
    big = TOKEN_SIZE * SUPERSAMPLE
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big - 1, big - 1), fill=255)
    mask = mask.resize((TOKEN_SIZE, TOKEN_SIZE), Image.LANCZOS)
    out = Image.new("RGBA", (TOKEN_SIZE, TOKEN_SIZE), (0, 0, 0, 0))
    out.paste(square, (0, 0), mask)
    return out


def main() -> None:
    CARDS.mkdir(parents=True, exist_ok=True)
    TOKENS.mkdir(parents=True, exist_ok=True)
    files = sorted(RAW.glob("*.jpg"))
    for f in files:
        uid = f.stem
        img = trim(Image.open(f).convert("RGB"), TRIM.get(uid, DEFAULT_TRIM))
        img.resize(CARD_SIZE, Image.LANCZOS).save(CARDS / f"{uid}.jpg", quality=84, optimize=True, progressive=True)
        token(img).save(TOKENS / f"{uid}.png", optimize=True)
    print(f"{len(files)} cartas processadas")


if __name__ == "__main__":
    main()
