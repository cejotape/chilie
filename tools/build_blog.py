# Genera el blog a partir de blog-src/posts/*.md
#   python tools/build_blog.py
# Escribe pages/blog.html, pages/blog/<slug>.html y actualiza las rutas del blog
# en render.yaml y sitemap.xml (entre las marcas blog:start / blog:end).
#
# Formato de cada artículo (NN-slug.md, NN = orden de publicación):
#   title: ...
#   cat: voz | chat | auto | soft | ia
#   author: Iñigo | Carlos
#   excerpt: ...
#   ---
#   Markdown sencillo: párrafos, ## y ###, listas con "- " o "1. ", "> " para un destacado,
#   **negrita**, *cursiva* y [enlaces](/ruta).
# La fecha sale del orden: un artículo cada martes desde el 28 de octubre de 2025.
# Una línea opcional "date: AAAA-MM-DD" en la cabecera la fija a mano.

import html
import json
import math
import re
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'blog-src' / 'posts'
OUT = ROOT / 'pages' / 'blog'
SITE = 'https://chilieia.com'
FIRST = date(2025, 10, 28)

CATS = {
    'voz': 'Agentes de voz',
    'chat': 'Chatbots',
    'auto': 'Automatización',
    'soft': 'Software a medida',
    'ia': 'IA para empresas',
}
MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
          'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def long_date(d): return f'{d.day} de {MONTHS[d.month - 1]} de {d.year}'
def short_date(d): return f'{d.day} {MONTHS[d.month - 1][:3]}'
def esc(s): return html.escape(s, quote=True)


def inline(text):
    text = esc(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<!\*)\*(?!\s)(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', text)
    return text


def markdown(src):
    out, para, items, kind = [], [], [], None

    def flush():
        nonlocal para, items, kind
        if para:
            out.append(f'<p>{inline(" ".join(para))}</p>')
            para = []
        if items:
            out.append(f'<{kind}>' + ''.join(f'<li>{inline(i)}</li>' for i in items) + f'</{kind}>')
            items, kind = [], None

    for raw in src.splitlines():
        line = raw.strip()
        if not line:
            flush()
        elif line.startswith('### '):
            flush(); out.append(f'<h3>{inline(line[4:])}</h3>')
        elif line.startswith('## '):
            flush(); out.append(f'<h2>{inline(line[3:])}</h2>')
        elif line.startswith('> '):
            flush(); out.append(f'<p class="post-note">{inline(line[2:])}</p>')
        elif line.startswith('- ') or re.match(r'\d+\. ', line):
            if para: flush()
            k = 'ul' if line.startswith('- ') else 'ol'
            if kind and kind != k: flush()
            kind = k
            items.append(line[2:] if k == 'ul' else line.split('. ', 1)[1])
        else:
            if items: flush()
            para.append(line)
    flush()
    return '\n'.join(out)


def load():
    posts = []
    for f in sorted(SRC.glob('*.md')):
        n, slug = f.stem.split('-', 1)
        head, body = f.read_text(encoding='utf-8').split('\n---\n', 1)
        meta = dict(l.split(': ', 1) for l in head.strip().splitlines())
        words = len(re.findall(r'\w+', body))
        posts.append({
            'n': int(n), 'slug': slug, 'body': body, **meta,
            'date': date.fromisoformat(meta['date']) if 'date' in meta else FIRST + timedelta(weeks=int(n) - 1),
            'minutes': max(2, math.ceil(words / 200)),
        })
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts


# ── Piezas comunes (las mismas que el resto de páginas) ──────────────
BAR = '''  <a class="skip" href="#contenido">Saltar al contenido</a>

  <header class="bar" id="bar" data-field="white">
    <a href="/" class="wordmark" aria-label="Chilie IA, inicio">
      <img src="/img/logo-mark.svg" alt="" width="24" height="32">
      <span>Chilie IA</span>
    </a>
    <nav class="bar-links" id="barLinks" aria-label="Principal">
      <a href="/">Inicio</a>
      <a href="/servicios">Servicios</a>
      <a href="/demos">Demos</a>
      <a href="/nosotros">Nosotros</a>
      <a href="/blog"{cur}>Blog</a>
    </nav>
    <button class="bar-menu" id="barMenu" aria-expanded="false" aria-controls="barLinks">Menú</button>
    <a href="/contacto" class="btn btn-bar"><span class="long">Pedir propuesta</span><span class="short">Hablemos</span></a>
  </header>
'''

CLOSE = '''    <section class="close" data-field="night" aria-labelledby="closeTitle">
      <div class="close-copy">
        <h2 id="closeTitle" class="close-title">¿Lo vemos para tu negocio?</h2>
        <p class="close-lead">Déjanos tu correo y te escribimos en menos de 24 horas para buscar un hueco de 45 minutos.</p>
      </div>
      <form class="close-form" id="closeForm" novalidate>
        <label for="closeEmail" class="close-label">Tu correo de trabajo</label>
        <div class="close-row">
          <input id="closeEmail" name="email" type="email" placeholder="nombre@tuempresa.es" autocomplete="email" required aria-describedby="closeHelp">
          <button type="submit" class="btn btn-lg close-send">Enviar <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <p class="close-help" id="closeHelp">Sin compromiso. Si prefieres contarnos más, usa el <a href="/contacto">formulario completo</a>.</p>
      </form>
    </section>
'''

FOOT = '''  <footer class="foot" data-field="white">
    <div class="foot-tile foot-statement">
      <p>Software a medida e IA para que tu negocio conteste siempre.</p>
      <p class="foot-legal">&copy; 2026 Chilie IA · <a href="/aviso-legal">Aviso legal</a> · <a href="/politica-privacidad">Privacidad</a> · <a href="/politica-cookies">Cookies</a></p>
    </div>
    <nav class="foot-tile foot-nav" aria-label="Pie">
      <a href="/servicios">Servicios</a>
      <a href="/demos">Demos</a>
      <a href="/nosotros">Nosotros</a>
      <a href="/blog">Blog</a>
      <a href="/contacto">Contacto</a>
    </nav>
    <div class="foot-tile foot-time">
      <p>Madrid</p>
      <p class="foot-clock"><span id="clock">—</span></p>
    </div>
    <div class="foot-tile foot-mail">
      <a href="mailto:chilieagencia@gmail.com">chilieagencia@gmail.com</a>
    </div>
    <div class="foot-tile foot-name" aria-hidden="true">Chilie IA</div>
    <a class="foot-tile foot-go" href="/contacto">
      <span>Empezar un proyecto</span>
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true"><path d="M8 40 40 8M16 8h24v24" fill="none" stroke="currentColor" stroke-width="4"/></svg>
    </a>
  </footer>

  <div class="cookie" id="cookieBanner" hidden>
    <p>Usamos cookies propias y de terceros para mejorar tu navegación. Más información en la <a href="/politica-cookies">política de cookies</a>.</p>
    <div class="cookie-actions">
      <button class="btn btn-ink" id="cookieAccept">Aceptar</button>
      <button class="btn btn-quiet" id="cookieReject">Rechazar</button>
    </div>
  </div>
'''


def page(*, title, desc, url, og_type, jsonld, main, cur, scripts):
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="#F7F7F5">

  <meta property="og:type" content="{og_type}">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:image" content="{SITE}/img/og-cover.jpg">
  <meta property="og:site_name" content="Chilie IA">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles/home.css">
  <link rel="stylesheet" href="/styles/blog.css">

  <script type="application/ld+json">
{jsonld}
  </script>
</head>
<body>

{BAR.replace('{cur}', ' aria-current="page"' if cur else '')}
  <main id="contenido">
{main}
  </main>

{FOOT}
{scripts}
</body>
</html>
'''


def post_row(p, tag='li'):
    return (f'        <{tag} class="post-row" data-cat="{p["cat"]}">\n'
            f'          <a href="/blog/{p["slug"]}">\n'
            f'            <time datetime="{p["date"].isoformat()}">{short_date(p["date"])}</time>\n'
            f'            <span class="post-cat">{CATS[p["cat"]]}</span>\n'
            f'            <span class="post-main"><b>{esc(p["title"])}</b><small>{esc(p["excerpt"])}</small></span>\n'
            f'            <span class="post-min">{p["minutes"]} min</span>\n'
            f'          </a>\n'
            f'        </{tag}>')


def build_index(posts):
    top = posts[0]
    chips = ''.join(f'\n        <button type="button" data-cat="{k}" aria-pressed="false">{v}</button>' for k, v in CATS.items())
    groups, current = [], None
    for p in posts[1:]:
        key = (p['date'].year, p['date'].month)
        if key != current:
            if current: groups.append('      </ol>\n      </section>')
            current = key
            label = f'{MONTHS[key[1] - 1].capitalize()} {key[0]}'
            groups.append(f'      <section class="month">\n      <h2 class="month-title">{label}</h2>\n      <ol class="post-list">')
        groups.append(post_row(p))
    groups.append('      </ol>\n      </section>')

    main = f'''
    <section class="page-hero" data-field="white" aria-labelledby="pageTitle">
      <h1 class="page-title" id="pageTitle">Lo que aprendemos construyendo.</h1>
      <p class="page-sub">Un artículo cada semana sobre agentes de voz, chatbots, automatización y software a medida. Escrito por Iñigo y Carlos, sin relleno.</p>
    </section>

    <section class="feat" data-field="white" aria-label="Último artículo">
      <a class="feat-link" href="/blog/{top["slug"]}">
        <p class="feat-meta"><span>Último artículo</span><span>{CATS[top["cat"]]}</span><time datetime="{top["date"].isoformat()}">{long_date(top["date"])}</time></p>
        <h2 class="feat-title">{esc(top["title"])}</h2>
        <p class="feat-excerpt">{esc(top["excerpt"])}</p>
        <span class="feat-go">Leer artículo · {top["minutes"]} min <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </a>
    </section>

    <section class="archive" data-field="white" aria-labelledby="archiveTitle">
      <div class="archive-head">
        <h2 class="archive-title" id="archiveTitle">Todos los artículos</h2>
        <div class="chips" role="group" aria-label="Filtrar por tema">
        <button type="button" data-cat="all" aria-pressed="true">Todos</button>{chips}
        </div>
      </div>
{chr(10).join(groups)}
      <p class="archive-empty" hidden>No hay artículos de este tema todavía.</p>
    </section>

{CLOSE}'''
    jsonld = ('  {\n    "@context": "https://schema.org",\n    "@type": "Blog",\n'
              f'    "url": "{SITE}/blog",\n    "name": "Blog de Chilie IA",\n'
              '    "publisher": { "@type": "Organization", "name": "Chilie IA", "url": "' + SITE + '" }\n  }')
    return page(title='Blog — Chilie IA | Voz, chatbots, automatización y software',
                desc='Un artículo cada semana sobre agentes de voz, chatbots, automatización y software a medida para empresas. Escrito por el equipo de Chilie IA en Madrid.',
                url=f'{SITE}/blog', og_type='website', jsonld=jsonld, main=main, cur=True,
                scripts='  <script src="/home.js" defer></script>\n  <script src="/blog.js" defer></script>')


def build_post(p, posts):
    same = [q for q in posts if q['cat'] == p['cat'] and q is not p]
    same.sort(key=lambda q: abs((q['date'] - p['date']).days))
    related = same[:3]
    rel = '\n'.join(post_row(q) for q in related)
    main = f'''
    <article class="post" data-field="white">
      <header class="post-head">
        <a class="post-back" href="/blog">← Blog</a>
        <p class="post-tag">{CATS[p["cat"]]}</p>
        <h1 class="post-title">{esc(p["title"])}</h1>
        <p class="post-lead">{esc(p["excerpt"])}</p>
        <p class="post-meta"><span>Por {p["author"]}</span><time datetime="{p["date"].isoformat()}">{long_date(p["date"])}</time><span>{p["minutes"]} min de lectura</span></p>
      </header>
      <div class="post-body">
{markdown(p["body"])}
      </div>
    </article>

    <section class="archive archive--related" data-field="white" aria-labelledby="relTitle">
      <div class="archive-head">
        <h2 class="archive-title" id="relTitle">Sigue leyendo</h2>
        <a class="archive-all" href="/blog">Ver todos los artículos</a>
      </div>
      <ol class="post-list">
{rel}
      </ol>
    </section>

{CLOSE}'''
    url = f'{SITE}/blog/{p["slug"]}'
    jsonld = json.dumps({
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        'headline': p['title'], 'description': p['excerpt'],
        'datePublished': p['date'].isoformat(),
        'author': {'@type': 'Person', 'name': p['author']},
        'publisher': {'@type': 'Organization', 'name': 'Chilie IA', 'url': SITE},
        'mainEntityOfPage': url, 'inLanguage': 'es-ES',
    }, ensure_ascii=False, indent=2)
    return page(title=f'{p["title"]} — Blog de Chilie IA', desc=p['excerpt'], url=url,
                og_type='article', jsonld=jsonld, main=main, cur=True,
                scripts='  <script src="/home.js" defer></script>')


def replace_block(path, start, end, body):
    text = path.read_text(encoding='utf-8')
    a = text.index('\n', text.index(start)) + 1
    b = text.index(end)
    path.write_text(text[:a] + body + text[b:], encoding='utf-8')


def main():
    posts = load()
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob('*.html'):
        old.unlink()
    for p in posts:
        (OUT / f'{p["slug"]}.html').write_text(build_post(p, posts), encoding='utf-8')
    (ROOT / 'pages' / 'blog.html').write_text(build_index(posts), encoding='utf-8')

    routes = ''.join(f'      - type: rewrite\n        source: /blog/{p["slug"]}\n        destination: /pages/blog/{p["slug"]}.html\n'
                     for p in posts)
    replace_block(ROOT / 'render.yaml', '      # ── blog:start', '      # ── blog:end', routes)
    urls = ''.join(f'  <url>\n    <loc>{SITE}/blog/{p["slug"]}</loc>\n    <lastmod>{p["date"].isoformat()}</lastmod>\n'
                   f'    <changefreq>yearly</changefreq>\n    <priority>0.6</priority>\n  </url>\n' for p in posts)
    replace_block(ROOT / 'sitemap.xml', '  <!-- blog:start -->', '  <!-- blog:end -->', urls)
    print(f'{len(posts)} artículos · del {posts[-1]["date"]} al {posts[0]["date"]}')


if __name__ == '__main__':
    main()
