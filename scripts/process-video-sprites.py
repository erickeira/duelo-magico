"""Transforma vídeos do Veo (Gemini) em folhas de sprites animadas.

Entrada:  art/video-raw/<tropa>/<anim>.mp4   (personagem de perfil, olhando para a direita, fundo verde #00FF00)
          art/video-raw/<tropa>/clips.json  {"walk": {"start": 0.5, "end": 2.5, "frames": 12, "fps": 10, "loop": true}, ...}
Saída:    public/assets/sprites/<tropa>/<anim>.png   folha horizontal com todos os quadros
          public/assets/sprites/manifest.json        medidas da folha e âncora dos pés (lido pelo PreloadScene)

Todos os quadros de uma tropa usam o mesmo tamanho e a mesma escala, então o personagem não "pula" entre animações.

Uso: python3 scripts/process-video-sprites.py [tropa ...]
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "video-raw"
OUT = ROOT / "public" / "assets" / "sprites"
MANIFEST = OUT / "manifest.json"

# Altura do corpo (mediana dos quadros) na folha final; o jogo ainda escala conforme o tamanho da tropa.
BODY_HEIGHT = 170
PAD = 4


def extract(video: Path, clip: dict, tmp: Path) -> list[Image.Image]:
    """Tira `frames` quadros espaçados igualmente entre start e end (segundos)."""
    start, end, n = clip["start"], clip["end"], clip["frames"]
    fps = n / (end - start)
    pattern = tmp / f"{video.stem}-%03d.png"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(end - start), "-i", str(video),
         "-vf", f"fps={fps}", "-frames:v", str(n), str(pattern)],
        check=True,
    )
    return [key_green(Image.open(p)) for p in sorted(tmp.glob(f"{video.stem}-*.png"))]


def key_green(img: Image.Image) -> Image.Image:
    """Chroma key adaptado ao vídeo: o Veo não entrega o verde puro (#00FF00), e sim um verde mais escuro.

    Mede o "quanto é verde" (G - max(R, B)) na borda do quadro e usa isso como referência do fundo.
    """
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    greenness = g - np.maximum(r, b)
    border = np.concatenate([greenness[:4].ravel(), greenness[-4:].ravel(), greenness[:, :4].ravel(), greenness[:, -4:].ravel()])
    bg = max(40, int(np.median(border)))
    lo, hi = bg * 0.3, bg * 0.7  # abaixo de lo: personagem; acima de hi: fundo
    alpha = np.clip((hi - greenness) / (hi - lo), 0, 1)
    # Tira o reflexo verde das bordas: limita o verde ao maior dos outros canais.
    g2 = np.where(greenness > 0, np.maximum(r, b), g)
    out = np.dstack([r, g2, b, (alpha * 255).astype(np.int16)]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def solid_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    return img.getchannel("A").point(lambda v: 255 if v >= 200 else 0).getbbox()


def process(unit: str) -> dict:
    folder = RAW / unit
    clips = json.loads((folder / "clips.json").read_text())
    with tempfile.TemporaryDirectory() as t:
        frames = {anim: extract(folder / f"{anim}.mp4", clip, Path(t)) for anim, clip in clips.items()}

    # Cada vídeo vem com o personagem num tamanho e posição diferentes. Por animação, mede:
    # pés (linha de baixo mediana), centro do corpo (mediana dos centros) e altura do corpo (mediana das alturas).
    # Depois escala tudo para a mesma altura de corpo e alinha pés e centro num quadro comum.
    info = {}
    for anim, fs in frames.items():
        boxes = [b for f in fs if (b := solid_bbox(f))]
        med = lambda xs: sorted(xs)[len(xs) // 2]
        feet = med([b[3] for b in boxes])
        cx = med([(b[0] + b[2]) / 2 for b in boxes])
        scale = BODY_HEIGHT / med([b[3] - b[1] for b in boxes])
        ext = (
            (cx - min(b[0] for b in boxes)) * scale,  # esquerda do centro
            (max(b[2] for b in boxes) - cx) * scale,  # direita do centro
            (feet - min(b[1] for b in boxes)) * scale,  # acima dos pés
            (max(b[3] for b in boxes) - feet) * scale,  # abaixo dos pés
        )
        info[anim] = (feet, cx, scale, ext)
    L, R, T, B = (max(i[3][k] for i in info.values()) + PAD for k in range(4))
    fw, fh = round(L + R), round(T + B)

    dest = OUT / unit
    dest.mkdir(parents=True, exist_ok=True)
    anims = {}
    for anim, fs in frames.items():
        feet, cx, scale, _ = info[anim]
        sheet = Image.new("RGBA", (fw * len(fs), fh), (0, 0, 0, 0))
        for i, f in enumerate(fs):
            small = f.resize((round(f.width * scale), round(f.height * scale)), Image.LANCZOS)
            x0, y0 = round(cx * scale - L), round(feet * scale - T)
            sheet.paste(small.crop((x0, y0, x0 + fw, y0 + fh)), (i * fw, 0))
        sheet.save(dest / f"{anim}.png", optimize=True)
        anims[anim] = {"frames": len(fs), "fps": clips[anim]["fps"], "loop": clips[anim]["loop"]}
    # Sem animação parada própria, a tropa parada usa o primeiro quadro da caminhada.
    if "idle" not in anims and "walk" in anims:
        Image.open(dest / "walk.png").crop((0, 0, fw, fh)).save(dest / "idle.png", optimize=True)
        anims["idle"] = {"frames": 1, "fps": 1, "loop": True}
    return {
        "frameWidth": fw,
        "frameHeight": fh,
        "anchorX": round(L / fw, 3),
        "anchorY": round(T / fh, 3),
        "anims": anims,
    }


def main() -> None:
    units = sys.argv[1:] or sorted(p.name for p in RAW.iterdir() if (p / "clips.json").exists())
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    for unit in units:
        manifest[unit] = process(unit)
        print(f"{unit}: {manifest[unit]}")
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
