# Genera las páginas legales (aviso legal, privacidad, cookies) con el diseño de la web.
#   python tools/build_legal.py
# El texto vive aquí; la cabecera, la barra y el pie se toman de pages/nosotros.html.
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UPDATED = '27 de octubre de 2026'
SITE = 'https://www.chilieia.com'

DOCS = [
    ('aviso-legal', 'Aviso legal'),
    ('politica-privacidad', 'Política de privacidad'),
    ('politica-cookies', 'Política de cookies'),
]

TITULAR = '''<div class="legal-card"><dl>
<dt>Titular</dt><dd>Carlos Jiménez</dd>
<dt>Nombre comercial</dt><dd>Chilie (Chilie IA)</dd>
<dt>NIF</dt><dd>12458185M</dd>
<dt>Domicilio</dt><dd>Calle del Rodio 4, 28045 Madrid</dd>
<dt>Correo</dt><dd><a href="mailto:chilieagencia@gmail.com">chilieagencia@gmail.com</a></dd>
<dt>Sitio web</dt><dd>chilieia.com</dd>
</dl></div>'''

CONTENT = {
    'aviso-legal': ('Quién está detrás de esta web y las condiciones para usarla.', [
        ('titular', 'Identificación del titular', f'''
<p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), estos son los datos del titular de este sitio web:</p>
{TITULAR}'''),
        ('objeto', 'Objeto', '''
<p>Este aviso legal regula el uso del sitio web chilieia.com (en adelante, «el sitio web»). Navegar por él implica aceptar estas condiciones; si no estás de acuerdo, te pedimos que no lo utilices.</p>'''),
        ('actividad', 'Actividad', '''
<p>Chilie diseña, desarrolla y mantiene software a medida e inteligencia artificial para empresas: agentes de voz, chatbots, automatizaciones de procesos y software a medida. El sitio web informa sobre estos servicios, permite solicitar una propuesta y probar asistentes de demostración.</p>
<p>El titular puede modificar en cualquier momento la información y los servicios presentados en el sitio web, sin necesidad de aviso previo.</p>'''),
        ('demos', 'Asistentes de demostración y contenidos informativos', '''
<p>El chat de la web y los asistentes de la página de <a href="/demos">demos</a> funcionan con inteligencia artificial y se presentan como tales. Sus respuestas son orientativas: no constituyen una oferta vinculante y pueden contener errores. Los precios, plazos y condiciones definitivos son los que figuran en la propuesta por escrito que enviamos a cada cliente.</p>
<p>Los artículos del <a href="/blog">blog</a> tienen carácter informativo y no sustituyen el asesoramiento profesional (legal, fiscal o de otro tipo) en cada caso concreto.</p>
<p>Algunas imágenes, vídeos y personajes ilustrativos del sitio web se han generado con herramientas de inteligencia artificial. Los ejemplos de negocios, nombres y conversaciones que aparecen en ellos son ficticios.</p>'''),
        ('propiedad', 'Propiedad intelectual e industrial', '''
<p>Los contenidos del sitio web (textos, diseño, código, imágenes, vídeos, logotipos y marcas) son titularidad de Chilie o se usan con la debida autorización. No se permite reproducirlos, distribuirlos ni transformarlos sin autorización previa por escrito, salvo para uso personal y privado.</p>
<p>Las marcas y nombres de terceros que se mencionan (por ejemplo, herramientas o plataformas con las que trabajamos) pertenecen a sus respectivos titulares y se citan solo con fines informativos.</p>'''),
        ('responsabilidad', 'Responsabilidad', '''
<p>Trabajamos para que el sitio web funcione correctamente y su información sea exacta, pero no podemos garantizar que esté siempre disponible ni libre de errores. El titular no se hace responsable de los daños derivados de interrupciones, fallos técnicos o del uso que se haga de la información publicada.</p>
<p>El sitio web puede incluir enlaces a sitios de terceros (por ejemplo, la herramienta de reservas Calendly). No controlamos esos sitios ni respondemos de sus contenidos o de sus políticas.</p>'''),
        ('ley', 'Legislación aplicable y jurisdicción', '''
<p>Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Madrid, salvo que la normativa de consumidores establezca otro fuero.</p>'''),
    ]),
    'politica-privacidad': ('Qué datos tratamos cuando nos escribes, para qué y con quién.', [
        ('responsable', 'Responsable del tratamiento', TITULAR),
        ('datos', 'Qué datos tratamos', '''
<p>Solo tratamos los datos que tú nos facilitas:</p>
<ul>
<li><strong>Formulario de contacto</strong>: nombre, correo, empresa y sector (opcional), servicios que te interesan, mensaje y, si los indicas, plazo, presupuesto aproximado y cómo nos conociste.</li>
<li><strong>Formulario rápido</strong> («Te llamamos nosotros»): tu correo.</li>
<li><strong>Chat de la web y asistentes de demostración</strong>: los mensajes que escribas. Te pedimos que no incluyas datos sensibles (salud, datos bancarios, etc.).</li>
<li><strong>Correo electrónico</strong>: los datos que nos envíes al escribirnos.</li>
<li><strong>Reserva de una llamada</strong>: si el chat te ofrece un enlace a Calendly y reservas, los datos que introduzcas allí los trata Calendly según su propia política.</li>
</ul>'''),
        ('fines', 'Para qué los usamos', '''
<ul>
<li>Responder a tus consultas y mantener la conversación que inicies.</li>
<li>Preparar y enviarte la propuesta que solicites.</li>
<li>Gestionar la relación con los clientes y prestar los servicios contratados.</li>
<li>Generar las respuestas del chat y de los asistentes de demostración.</li>
</ul>
<p>No usamos tus datos para enviarte publicidad si no lo has pedido, ni para tomar decisiones automatizadas que te afecten.</p>'''),
        ('base', 'Base legal', '''
<ul>
<li><strong>Medidas precontractuales y contrato</strong> (art. 6.1.b RGPD): cuando nos pides una propuesta o contratas un servicio.</li>
<li><strong>Consentimiento</strong> (art. 6.1.a RGPD): al enviar un formulario o usar el chat. Puedes retirarlo cuando quieras escribiéndonos.</li>
<li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): para atender comunicaciones con clientes y mantener la seguridad del sitio web.</li>
</ul>'''),
        ('plazos', 'Cuánto tiempo los guardamos', '''
<ul>
<li><strong>Consultas que no llegan a ser clientes</strong>: un máximo de 12 meses desde la última comunicación.</li>
<li><strong>Clientes</strong>: mientras dure la relación y, después, durante los plazos legales para atender posibles responsabilidades.</li>
<li><strong>Chat</strong>: no guardamos las conversaciones del chat en nuestros sistemas. El proveedor de inteligencia artificial puede conservarlas de forma temporal según sus condiciones, para prestar el servicio y por motivos de seguridad.</li>
</ul>'''),
        ('encargados', 'Proveedores que nos ayudan (encargados del tratamiento)', '''
<p>No vendemos ni cedemos tus datos a terceros, salvo obligación legal. Para que el sitio web funcione, algunos proveedores tratan datos por nuestra cuenta, solo para prestarnos su servicio:</p>
<div class="legal-table-wrap"><table>
<thead><tr><th>Proveedor</th><th>Para qué</th><th>Ubicación</th></tr></thead>
<tbody>
<tr><td>Render Services, Inc.</td><td>Alojamiento del sitio web y del servidor del chat y los formularios</td><td>Estados Unidos</td></tr>
<tr><td>Anthropic, PBC</td><td>Modelo de inteligencia artificial que genera las respuestas del chat y de las demos</td><td>Estados Unidos</td></tr>
<tr><td>Google LLC</td><td>Correo electrónico (Gmail), por el que nos llegan los formularios, y tipografías (Google Fonts)</td><td>Estados Unidos</td></tr>
</tbody></table></div>
<p>Cuando un proveedor trata datos fuera del Espacio Económico Europeo, lo hace con las garantías que exige el RGPD, como las cláusulas contractuales tipo aprobadas por la Comisión Europea o el Marco de Privacidad de Datos UE-EE. UU. cuando el proveedor está adherido a él.</p>'''),
        ('derechos', 'Tus derechos', '''
<p>Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad</strong>, así como retirar tu consentimiento, escribiendo a <a href="mailto:chilieagencia@gmail.com">chilieagencia@gmail.com</a>. Te responderemos en el plazo de un mes. Si es necesario para verificar tu identidad, podremos pedirte información adicional.</p>
<p>Si consideras que no hemos tratado bien tus datos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).</p>'''),
        ('menores', 'Menores de edad', '''
<p>Nuestros servicios están dirigidos a empresas y profesionales. No recogemos de forma consciente datos de menores de 14 años.</p>'''),
        ('seguridad', 'Seguridad', '''
<p>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos frente a pérdidas, accesos no autorizados o alteraciones: conexiones cifradas (HTTPS), acceso restringido a las cuentas y proveedores con garantías de seguridad.</p>'''),
        ('cambios', 'Cambios en esta política', '''
<p>Si cambiamos la forma de tratar los datos, actualizaremos esta política e indicaremos la fecha arriba.</p>'''),
    ]),
    'politica-cookies': ('Qué guarda esta web en tu navegador y a qué servicios externos se conecta.', [
        ('resumen', 'En resumen', '''
<p>Esta web <strong>no usa cookies de análisis ni de publicidad</strong>. Solo guarda en tu navegador tu elección sobre el aviso de cookies, y carga sus tipografías desde Google Fonts.</p>'''),
        ('que-son', 'Qué son las cookies', '''
<p>Las cookies y tecnologías similares (como el almacenamiento local del navegador) son pequeños datos que un sitio web guarda en tu dispositivo para recordar información entre visitas.</p>'''),
        ('usamos', 'Qué usamos', '''
<h3>Almacenamiento técnico propio</h3>
<div class="legal-table-wrap"><table>
<thead><tr><th>Nombre</th><th>Tipo</th><th>Para qué</th><th>Duración</th></tr></thead>
<tbody>
<tr><td>cookie_consent</td><td>Almacenamiento local (localStorage), propio</td><td>Recordar si aceptaste o rechazaste el aviso de cookies, para no mostrártelo en cada visita</td><td>Hasta que lo borres desde tu navegador</td></tr>
</tbody></table></div>
<p>Es necesario para el funcionamiento del sitio web y no requiere consentimiento (art. 22.2 LSSI-CE).</p>
<h3>Servicios de terceros</h3>
<div class="legal-table-wrap"><table>
<thead><tr><th>Servicio</th><th>Titular</th><th>Para qué</th><th>Más información</th></tr></thead>
<tbody>
<tr><td>Google Fonts</td><td>Google LLC</td><td>Cargar la tipografía Jost. Al descargarla, tu navegador se conecta a los servidores de Google, que reciben tu dirección IP. Según Google, este servicio no instala cookies.</td><td><a href="https://policies.google.com/privacy">Privacidad de Google</a></td></tr>
</tbody></table></div>
<p>El chat de la web se comunica con nuestro servidor para generar las respuestas, pero no guarda cookies en tu navegador. Si reservas una llamada desde un enlace de Calendly, saldrás a su web, que aplica su propia política de cookies.</p>'''),
        ('gestionar', 'Cómo gestionarlas', '''
<p>Puedes borrar o bloquear las cookies y el almacenamiento local desde la configuración de tu navegador:</p>
<ul>
<li><strong>Chrome</strong>: Configuración › Privacidad y seguridad › Cookies y otros datos de sitios.</li>
<li><strong>Safari</strong>: Ajustes › Privacidad › Gestionar datos de sitios web.</li>
<li><strong>Firefox</strong>: Ajustes › Privacidad y seguridad › Cookies y datos del sitio.</li>
<li><strong>Edge</strong>: Configuración › Cookies y permisos del sitio.</li>
</ul>
<p>Si borras el almacenamiento, volverás a ver el aviso de cookies en tu próxima visita.</p>'''),
        ('cambios', 'Cambios en esta política', '''
<p>Si incorporamos nuevas herramientas que usen cookies (por ejemplo, de análisis), actualizaremos esta política y te pediremos el consentimiento antes de activarlas.</p>'''),
    ]),
}


def build(slug, title):
    lead, sections = CONTENT[slug]
    tpl = (ROOT / 'pages' / 'nosotros.html').read_text(encoding='utf-8')
    head, rest = tpl.split('</head>', 1)
    url = f'{SITE}/{slug}'
    desc = f'{title} de Chilie, estudio de software e inteligencia artificial en Madrid. {lead}'
    head = re.sub(r'<title>.*?</title>', f'<title>{title} — Chilie IA</title>', head)
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{html.escape(desc)}">', head)
    head = re.sub(r'https://www\.chilieia\.com/nosotros', url, head)
    head = re.sub(r'(og:title" content=")[^"]*', rf'\g<1>{title} — Chilie IA', head)
    head = re.sub(r'(twitter:title" content=")[^"]*', rf'\g<1>{title} — Chilie IA', head)
    head = re.sub(r'(og:description" content=")[^"]*', rf'\g<1>{html.escape(lead)}', head)
    head = re.sub(r'(twitter:description" content=")[^"]*', rf'\g<1>{html.escape(lead)}', head)
    head = head.replace('/styles/nosotros.css', '/styles/legal.css')
    head = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', head, flags=re.S)
    rest = rest.replace('<a href="/nosotros" aria-current="page">Nosotros</a>', '<a href="/nosotros">Nosotros</a>')

    current = ' aria-current="page"'
    docs = '\n'.join(f'        <a href="/{s}"{current if s == slug else ""}>{t}</a>' for s, t in DOCS)
    toc = '\n'.join(f'        <a href="#{sid}">{st}</a>' for sid, st, _ in sections)
    body = '\n'.join(f'      <h2 id="{sid}">{st}</h2>{content}' for sid, st, content in sections)
    main = f'''  <main id="contenido">

    <section class="page-hero" data-field="white" aria-labelledby="pageTitle">
      <p class="legal-kicker">Legal</p>
      <h1 class="page-title" id="pageTitle">{title}</h1>
      <p class="page-sub">{lead}</p>
      <p class="legal-updated">Última actualización: {UPDATED}</p>
    </section>

    <section class="legal" data-field="white" aria-label="{title}">
      <nav class="legal-nav" aria-label="Documentos legales">
        <div>
          <p>Documentos</p>
          <div class="legal-docs">
{docs}
          </div>
        </div>
        <div>
          <p>En esta página</p>
          <div class="legal-toc">
{toc}
          </div>
        </div>
      </nav>
      <article class="legal-body">
{body}
      </article>
    </section>

  </main>
'''
    a = rest.index('  <main id="contenido">')
    b = rest.index('  </main>') + len('  </main>\n')
    rest = rest[:a] + main + rest[b:]
    (ROOT / 'pages' / f'{slug}.html').write_text(head + '</head>' + rest, encoding='utf-8')
    print('ok', slug)


if __name__ == '__main__':
    for slug, title in DOCS:
        build(slug, title)
