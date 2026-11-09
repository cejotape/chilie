# Comprueba el SEO básico de todas las páginas públicas:
#   python tools/check_seo.py            # todas
#   python tools/check_seo.py /agentes-de-voz-ia /   # solo esas rutas
# Mira: title ≤ 60, description 140–160, un solo h1, canonical correcto, JSON-LD que se lee,
# enlaces internos que existen, URL en el sitemap y nº de palabras del <main>.

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://www.chilieia.com'
ASSET_DIRS = ('styles', 'img', 'blog', 'pages', 'sectores')


def pages():
    """Ruta limpia -> archivo. Las rutas replican render.yaml y los .html de la raíz."""
    m = {'/': ROOT / 'index.html'}
    for f in (ROOT / 'pages').glob('*.html'):
        m['/' + f.stem] = f
    for f in (ROOT / 'pages' / 'blog').glob('*.html'):
        m['/blog/' + f.stem] = f
    for f in ROOT.glob('*.html'):
        if f.name not in ('index.html', '404.html'):  # 404.html lleva noindex y no va en el sitemap
            m['/' + f.stem] = f
    sect = ROOT / 'sectores'
    if sect.exists():
        for f in sect.glob('*.html'):
            m['/sectores/' + f.stem] = f
    return m


class Doc(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.desc = None
        self.canonical = None
        self.h1 = []
        self.links = []
        self.jsonld = []
        self.main_words = 0
        self._in = None
        self._main = 0
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title':
            self._in = 'title'
        elif tag == 'meta' and a.get('name') == 'description':
            self.desc = a.get('content', '')
        elif tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        elif tag == 'h1':
            self._in = 'h1'
            self.h1.append('')
        elif tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        elif tag == 'script' and a.get('type') == 'application/ld+json':
            self._in = 'ld'
            self.jsonld.append('')
        elif tag == 'main':
            self._main += 1
        elif tag in ('script', 'style') and self._in is None:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag in ('title', 'h1', 'script'):
            self._in = None
        if tag == 'main':
            self._main -= 1
        if tag in ('script', 'style') and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._in == 'title':
            self.title += data
        elif self._in == 'h1':
            self.h1[-1] += data
        elif self._in == 'ld':
            self.jsonld[-1] += data
        elif self._main and not self._skip:
            self.main_words += len(re.findall(r'\w+', data))


def check(route, path, allpages, sitemap):
    doc = Doc()
    doc.feed(path.read_text(encoding='utf-8'))
    out = []
    t = doc.title.strip()
    if not t:
        out.append('FAIL sin <title>')
    elif len(t) > 60:
        out.append(f'FAIL title {len(t)} > 60: {t}')
    d = (doc.desc or '').strip()
    if not d:
        out.append('FAIL sin description')
    elif not 140 <= len(d) <= 160:
        out.append(f'WARN description {len(d)} (140–160)')
    if len(doc.h1) != 1:
        out.append(f'FAIL {len(doc.h1)} h1')
    want = SITE + ('/' if route == '/' else route)
    if doc.canonical != want:
        out.append(f'FAIL canonical {doc.canonical} (esperado {want})')
    for i, block in enumerate(doc.jsonld):
        try:
            json.loads(block)
        except json.JSONDecodeError as e:
            out.append(f'FAIL JSON-LD {i + 1} no se lee: {e}')
    if not doc.jsonld:
        out.append('WARN sin JSON-LD')
    for href in doc.links:
        if not href.startswith('/'):
            continue
        clean = href.split('#')[0].split('?')[0]
        if not clean:
            continue
        if clean in allpages:
            continue
        if clean.split('/')[1] in ASSET_DIRS and (ROOT / clean.lstrip('/')).exists():
            continue
        if clean in ('/sitemap.xml', '/robots.txt', '/llms.txt') and (ROOT / clean.lstrip('/')).exists():
            continue
        out.append(f'FAIL enlace roto {href}')
    if want not in sitemap and not route.startswith(('/aviso', '/politica')):
        out.append('FAIL no está en sitemap.xml')
    return out, doc


def main():
    allpages = pages()
    sitemap = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    wanted = [r if r.startswith('/') else '/' + r for r in sys.argv[1:]] or sorted(allpages)
    problems = 0
    for route in wanted:
        path = allpages.get(route)
        if not path:
            print(f'{route}: FAIL no existe')
            problems += 1
            continue
        out, doc = check(route, path, allpages, sitemap)
        problems += sum(1 for o in out if o.startswith('FAIL'))
        state = 'OK' if not out else ('FALLOS' if any(o.startswith('FAIL') for o in out) else 'avisos')
        print(f'{route}  [{state}]  title {len(doc.title.strip())}  desc {len((doc.desc or "").strip())}  palabras {doc.main_words}')
        for o in out:
            print('   ', o)
    print(f'\n{len(wanted)} páginas · {problems} fallos')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
