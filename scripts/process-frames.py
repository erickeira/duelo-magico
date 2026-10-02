"""Converte as molduras geradas pelo Gemini (fundo verde #00FF00) em PNG transparente para nine-slice.

Entrada:  art/frames-raw/<raridade>.jpg
Saída:    public/assets/frames/<raridade>.png   moldura com miolo e lado de fora transparentes
          public/assets/frames/frames.json      espessura da borda e recorte do nine-slice de cada moldura

Uso: python3 scripts/process-frames.py
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "frames-raw"
OUT = ROOT / "public" / "assets" / "frames"
WIDTH = 300  # largura final; a altura segue a proporção
SOLID = 200  # alfa a partir do qual o pixel conta como parte da moldura
SLICE_FACTOR = 1.5


def chroma_key(img: Image.Image) -> Image.Image:
    """Transforma o verde puro em transparência, suavizando as bordas e tirando o reflexo verde."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            greenness = g - max(r, b)
            if greenness <= 30:
                continue
            alpha = max(0, min(255, int(255 * (1 - (greenness - 30) / 90))))
            # Reflexo verde nas bordas: limita o verde ao maior dos outros canais.
            px[x, y] = (r, min(g, max(r, b)), b, alpha)
    return img


def border(img: Image.Image) -> dict:
    """Mede a espessura opaca da moldura no meio de cada lado."""
    a = img.getchannel("A").load()
    w, h = img.size

    def run(points):
        # Pula a franja semitransparente da borda externa e conta os pixels opacos seguintes.
        n = skipped = 0
        for x, y in points:
            if a[x, y] < SOLID:
                if n:
                    break
                skipped += 1
                continue
            n += 1
        return n + skipped

    return {
        "left": run((x, h // 2) for x in range(w)),
        "right": run((x, h // 2) for x in range(w - 1, -1, -1)),
        "top": run((w // 2, y) for y in range(h)),
        "bottom": run((w // 2, y) for y in range(h - 1, -1, -1)),
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for f in sorted(RAW.glob("*.jpg")):
        img = chroma_key(Image.open(f))
        img = img.crop(img.getchannel("A").point(lambda v: 255 if v >= SOLID else 0).getbbox())
        img = img.resize((WIDTH, round(img.height * WIDTH / img.width)), Image.LANCZOS)
        img.save(OUT / f"{f.stem}.png", optimize=True)
        b = border(img)
        # Recorte do nine-slice: os cantos ornamentados são maiores que a borda lateral.
        slice_ = min(round(max(b.values()) * SLICE_FACTOR), img.width // 2 - 2, img.height // 2 - 2)
        meta[f.stem] = {"width": img.width, "height": img.height, "border": round(sum(b.values()) / 4), "slice": slice_}
    (OUT / "frames.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
