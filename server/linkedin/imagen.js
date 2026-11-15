// Imagen de marca del post: plantilla fija (logo, etiqueta, titular, web) donde solo cambia
// el texto. 1200×1200, mismos colores y tipografía que la web y que las portadas del blog.

const path = require('path');
const { createCanvas, GlobalFonts, Path2D } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath(path.join(__dirname, '..', '..', 'tools', 'assets', 'jost-variable.ttf'), 'Jost');

// El logo de img/logo-mark.svg (viewBox 150×198)
const LOGO = 'M79 9 128 7Q138 6.5 134.5 13.500L68 82C62 90 60 104 60.5 117Q61 126 56 118.500C49 108 46 95 49 82 53 66 68 47 86 33.500Q91 29.500 85 29.500L78 29.500C60 32 44 52 37 76 32 96 34 118 44 131 50 139 58 141.500 66 141.500L93 141.500Q98 141.500 98 136.500L98 70C98 62 106 54 113 50.500Q120 47 120 55L120 152C121 160 134 172 142 182.500Q146.500 189 139 189L83 189Q75.500 189 80.500 184C86 178 96 172 96 167Q96 162 91 162L60 161.500C40 160 22 144 16 121 11 100 14 72 28 44 38 24 58 11 79 9Z';

const VARIANTES = [
  { fondo: '#F7F7F5', texto: '#0E0E12', suave: '#4A4A55', acento: '#3B3FC4', logo: '#3B3FC4' },  // papel
  { fondo: '#3B3FC4', texto: '#FFFFFF', suave: '#D9DAF5', acento: '#D9DAF5', logo: '#FFFFFF' },  // azul
  { fondo: '#0E0E12', texto: '#F7F7F5', suave: '#9A9AA6', acento: '#7376DC', logo: '#7376DC' },  // noche
];
const CHISPA = '#FF5A36';
const W = 1200, H = 1200, M = 96;

function partir(ctx, texto, ancho) {
  const lineas = [];
  let actual = '';
  for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width <= ancho || !actual) actual = prueba;
    else { lineas.push(actual); actual = palabra; }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// titular: la frase grande. etiqueta: la línea pequeña de arriba ("Agentes de voz").
// variante: número cualquiera; se alterna entre los tres fondos.
function generar({ titular, etiqueta, variante = 0 }) {
  const c = VARIANTES[((variante % VARIANTES.length) + VARIANTES.length) % VARIANTES.length];
  const lienzo = createCanvas(W, H);
  const ctx = lienzo.getContext('2d');
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = c.fondo;
  ctx.fillRect(0, 0, W, H);

  // Marca
  ctx.save();
  ctx.translate(M, M);
  ctx.scale(72 / 198, 72 / 198);
  ctx.fillStyle = c.logo;
  ctx.fill(new Path2D(LOGO));
  ctx.restore();
  ctx.fillStyle = c.texto;
  ctx.font = '600 46px Jost';
  ctx.fillText('Chilie IA', M + 76, M + 54);

  // Etiqueta
  ctx.fillStyle = c.acento;
  ctx.font = '500 32px Jost';
  ctx.fillText(String(etiqueta || 'IA para empresas').toUpperCase(), M, 330);

  // Titular: baja de tamaño hasta que quepa en seis líneas
  let lineas = [], tam = 0;
  for (tam of [108, 96, 86, 76, 68, 60]) {
    ctx.font = `600 ${tam}px Jost`;
    lineas = partir(ctx, titular, W - 2 * M);
    if (lineas.length <= 6 && lineas.every(l => ctx.measureText(l).width <= W - 2 * M)) break;
  }
  ctx.fillStyle = c.texto;
  let y = 330 + 40 + tam;
  for (const linea of lineas.slice(0, 7)) {
    ctx.fillText(linea, M, y);
    y += Math.round(tam * 1.14);
  }

  // Pie
  ctx.fillStyle = CHISPA;
  ctx.beginPath();
  ctx.arc(M + 11, H - M - 11, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.suave;
  ctx.font = '500 34px Jost';
  ctx.fillText('chilieia.com', M + 40, H - M);

  return lienzo.toBuffer('image/png');
}

module.exports = { generar };
