"""Funções de imagem compartilhadas pelos scripts de arte (process-*.py)."""
from PIL import Image, ImageDraw

SUPERSAMPLE = 4


def chroma_key(img: Image.Image) -> Image.Image:
    """Transforma o verde puro (#00FF00) em transparência, suavizando as bordas e tirando o reflexo verde."""
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


def crop_to_content(img: Image.Image, solid: int = 200) -> Image.Image:
    """Apara a área transparente em volta do que tem alfa >= `solid`."""
    return img.crop(img.getchannel("A").point(lambda v: 255 if v >= solid else 0).getbbox())


def circle(img: Image.Image, size: int) -> Image.Image:
    """Redimensiona para size×size e aplica máscara redonda com borda suave."""
    square = img.convert("RGB").resize((size, size), Image.LANCZOS)
    big = size * SUPERSAMPLE
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, big - 1, big - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(square, (0, 0), mask.resize((size, size), Image.LANCZOS))
    return out
