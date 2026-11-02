# Pone el mismo menú y el mismo pie en todas las páginas estáticas:
#   python tools/update_nav.py
# Sustituye el <nav class="bar-links"> y el <nav class="foot-nav"> de index.html, pages/*.html
# (menos el blog, que genera tools/build_blog.py con las mismas piezas), los .html de la raíz
# y sectores/*.html. Marca con aria-current="page" el enlace de la página actual.
# Las páginas legales se regeneran después con tools/build_legal.py (copian la barra de nosotros).

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SERVICES = [
    ('/agentes-de-voz-ia', 'Agentes de voz con IA'),
    ('/chatbots-ia', 'Chatbots con IA'),
    ('/automatizacion-ia', 'Automatización de procesos'),
    ('/software-a-medida', 'Software a medida'),
]
SECTORS = [
    ('/sectores/clinicas', 'Clínicas'),
    ('/sectores/inmobiliarias', 'Inmobiliarias'),
    ('/sectores/restaurantes', 'Restaurantes'),
    ('/sectores/alquiler-vacacional', 'Alquiler vacacional'),
]


def cur(route, here):
    return ' aria-current="page"' if route == here else ''


def nav(here):
    """Barra principal. En las páginas de servicio se marca Servicios; en las de sector, Sectores."""
    top_here = here
    if here in dict(SERVICES):
        top_here = '/servicios'
    elif here.startswith('/sectores'):
        top_here = '/sectores'
    links = ''.join(f'          <a href="{u}">{n}</a>\n' for u, n in SERVICES)
    sects = ''.join(f'          <a href="{u}">{n}</a>\n' for u, n in SECTORS)
    return (
        '<nav class="bar-links" id="barLinks" aria-label="Principal">\n'
        f'      <a href="/"{cur("/", top_here)}>Inicio</a>\n'
        '      <div class="bar-group">\n'
        f'        <a href="/servicios"{cur("/servicios", top_here)}>Servicios</a>\n'
        f'        <div class="bar-panel">\n{links}        </div>\n'
        '      </div>\n'
        '      <div class="bar-group">\n'
        f'        <a href="/sectores"{cur("/sectores", top_here)}>Sectores</a>\n'
        f'        <div class="bar-panel">\n{sects}        </div>\n'
        '      </div>\n'
        f'      <a href="/demos"{cur("/demos", top_here)}>Demos</a>\n'
        f'      <a href="/nosotros"{cur("/nosotros", top_here)}>Nosotros</a>\n'
        f'      <a href="/blog"{cur("/blog", top_here)}>Blog</a>\n'
        '    </nav>'
    )


FOOT_NAV = '''<nav class="foot-tile foot-nav" aria-label="Pie">
      <a href="/agentes-de-voz-ia">Agentes de voz</a>
      <a href="/chatbots-ia">Chatbots</a>
      <a href="/automatizacion-ia">Automatización</a>
      <a href="/software-a-medida">Software a medida</a>
      <a href="/sectores">Sectores</a>
      <a href="/demos">Demos</a>
      <a href="/nosotros">Nosotros</a>
      <a href="/blog">Blog</a>
      <a href="/contacto">Contacto</a>
    </nav>'''

NAV_RE = re.compile(r'<nav class="bar-links" id="barLinks" aria-label="Principal">.*?</nav>', re.S)
FOOT_RE = re.compile(r'<nav class="foot-tile foot-nav" aria-label="Pie">.*?</nav>', re.S)


def targets():
    yield '/', ROOT / 'index.html'
    for f in (ROOT / 'pages').glob('*.html'):
        if f.stem not in ('blog', 'aviso-legal', 'politica-privacidad', 'politica-cookies'):
            yield '/' + f.stem, f
    for f in ROOT.glob('*.html'):
        if f.name != 'index.html':
            yield '/' + f.stem, f
    for f in (ROOT / 'sectores').glob('*.html'):
        yield '/sectores/' + f.stem, f


def main():
    for route, path in targets():
        text = path.read_text(encoding='utf-8')
        new = NAV_RE.sub(lambda m: nav(route), text, count=1)
        new = FOOT_RE.sub(lambda m: FOOT_NAV, new, count=1)
        if new != text:
            path.write_text(new, encoding='utf-8')
            print('actualizado', path.relative_to(ROOT))
        elif not NAV_RE.search(text):
            print('SIN BARRA', path.relative_to(ROOT))


if __name__ == '__main__':
    main()
