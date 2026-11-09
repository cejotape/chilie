# Genera una imagen Open Graph (1200×630) por artículo del blog en img/og/<slug>.png.
#   python tools/og_images.py            # todas las que falten o hayan cambiado de título
#   python tools/og_images.py --force    # todas
# build_blog.py lo llama solo; si Pillow no está instalado (pip install pillow) no pasa nada:
# el artículo usa la portada genérica img/og-cover.jpg.
# Fuente: tools/assets/jost-variable.ttf (Jost, licencia OFL en tools/assets/OFL-jost.txt).

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'img' / 'og'
FONT = ROOT / 'tools' / 'assets' / 'jost-variable.ttf'
STAMP = OUT / '.titles.json'   # título usado por slug, para regenerar solo lo que cambia

W, H = 1200, 630
PAPER, INK, INK_SOFT, BLUE, SPARK = '#F7F7F5', '#0E0E12', '#4A4A55', '#3B3FC4', '#FF5A36'
CATS = {'voz': 'Agentes de voz', 'chat': 'Chatbots', 'auto': 'Automatización',
        'soft': 'Software a medida', 'ia': 'IA para empresas'}


def _font(size, weight):
    from PIL import ImageFont
    f = ImageFont.truetype(str(FONT), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def _wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= max_w:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def render(title, cat, out_path):
    from PIL import Image, ImageDraw
    im = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(im)
    m = 72
    # marca: cuadrado azul + "Chilie IA"
    d.rounded_rectangle([m, m, m + 34, m + 34], radius=8, fill=BLUE)
    d.text((m + 50, m - 4), 'Chilie IA', font=_font(34, 600), fill=INK)
    # categoría
    d.text((m, m + 92), CATS.get(cat, 'Blog').upper(), font=_font(22, 500), fill=BLUE)
    # título: baja el tamaño hasta que quepa en 4 líneas
    for size in (64, 58, 52, 46, 40):
        font = _font(size, 600)
        lines = _wrap(d, title, font, W - 2 * m)
        if len(lines) <= 4:
            break
    y = m + 140
    lh = int(size * 1.18)
    for ln in lines[:4]:
        d.text((m, y), ln, font=font, fill=INK)
        y += lh
    # pie
    d.ellipse([m, H - m - 14, m + 14, H - m], fill=SPARK)
    d.text((m + 28, H - m - 22), 'chilieia.com/blog', font=_font(24, 500), fill=INK_SOFT)
    im = im.convert('P', palette=Image.ADAPTIVE, colors=96)
    im.save(out_path, 'PNG', optimize=True)


def generate_all(posts, force=False):
    """posts: lista de dicts con slug, title y cat (los de build_blog.load()). Devuelve nº generadas."""
    try:
        import PIL  # noqa: F401
    except ImportError:
        print('og_images: Pillow no instalado; se usa la portada genérica')
        return 0
    if not FONT.exists():
        print(f'og_images: falta {FONT}; se usa la portada genérica')
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    stamp = json.loads(STAMP.read_text(encoding='utf-8')) if STAMP.exists() else {}
    n = 0
    for p in posts:
        out = OUT / f'{p["slug"]}.png'
        if not force and out.exists() and stamp.get(p['slug']) == p['title']:
            continue
        render(p['title'], p['cat'], out)
        stamp[p['slug']] = p['title']
        n += 1
    STAMP.write_text(json.dumps(stamp, ensure_ascii=False, indent=0, sort_keys=True), encoding='utf-8')
    # limpia imágenes de artículos que ya no existen
    slugs = {p['slug'] for p in posts}
    for f in OUT.glob('*.png'):
        if f.stem not in slugs:
            f.unlink()
            stamp.pop(f.stem, None)
    return n


if __name__ == '__main__':
    sys.path.insert(0, str(ROOT / 'tools'))
    from build_blog import load
    print(f'{generate_all(load(), force="--force" in sys.argv)} imágenes generadas en {OUT}')
