// Gera as imagens do projeto a partir da pixel art de ui/pixel.js:
//   docs/moeda.svg       moeda grande para o README
//   icons/icon.png/.ico  ícone do programa (moeda em pixel art)
//   web/publico/icones/  ícones da versão de celular (tela de início do iPhone/Android)
// Uso: node ferramentas/gerar_imagens.js   (só usa módulos do próprio Node)

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { PIXEL_CORES, PIXEL_MAPAS, pixelSvg } = require('../ui/pixel.js');

const raiz = path.join(__dirname, '..');

// ---------- SVG do README ----------
fs.mkdirSync(path.join(raiz, 'docs'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'docs', 'moeda.svg'), pixelSvg('moeda', 160) + '\n');

// ---------- PNG sem bibliotecas ----------
const tabelaCrc = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = tabelaCrc[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function bloco(tipo, dados) {
  const t = Buffer.from(tipo, 'ascii');
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, crc]);
}
function png(largura, altura, rgba) {
  const linhas = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y++) {
    linhas[y * (largura * 4 + 1)] = 0;
    rgba.copy(linhas, y * (largura * 4 + 1) + 1, y * largura * 4, (y + 1) * largura * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr),
    bloco('IDAT', zlib.deflateSync(linhas, { level: 9 })),
    bloco('IEND', Buffer.alloc(0)),
  ]);
}

/** Desenha a moeda ampliada pixel a pixel (sem borrar), com margem. */
function moedaRgba(tamanho) {
  const mapa = PIXEL_MAPAS.moeda;
  const n = mapa.length;
  const margem = tamanho >= 48 ? Math.round(tamanho / 16) : 0;
  const escala = (tamanho - margem * 2) / n;
  const buf = Buffer.alloc(tamanho * tamanho * 4);
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const mx = Math.floor((x - margem) / escala);
      const my = Math.floor((y - margem) / escala);
      const ch = mapa[my]?.[mx];
      if (!ch || ch === '.') continue;
      const hex = PIXEL_CORES[ch];
      const i = (y * tamanho + x) * 4;
      buf[i] = parseInt(hex.slice(1, 3), 16);
      buf[i + 1] = parseInt(hex.slice(3, 5), 16);
      buf[i + 2] = parseInt(hex.slice(5, 7), 16);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

const tamanhos = [256, 64, 48, 32, 16];
const imagens = tamanhos.map((t) => png(t, t, moedaRgba(t)));
fs.writeFileSync(path.join(raiz, 'icons', 'icon.png'), imagens[0]);

// ICO com as imagens PNG embutidas
const cab = Buffer.alloc(6 + 16 * tamanhos.length);
cab.writeUInt16LE(0, 0);
cab.writeUInt16LE(1, 2);
cab.writeUInt16LE(tamanhos.length, 4);
let deslocamento = cab.length;
tamanhos.forEach((t, i) => {
  const e = 6 + i * 16;
  cab[e] = t >= 256 ? 0 : t;
  cab[e + 1] = t >= 256 ? 0 : t;
  cab.writeUInt16LE(1, e + 4);
  cab.writeUInt16LE(32, e + 6);
  cab.writeUInt32LE(imagens[i].length, e + 8);
  cab.writeUInt32LE(deslocamento, e + 12);
  deslocamento += imagens[i].length;
});
fs.writeFileSync(path.join(raiz, 'icons', 'icon.ico'), Buffer.concat([cab, ...imagens]));

console.log('Gerado: docs/moeda.svg, icons/icon.png, icons/icon.ico');

// ---------- Ícones da versão de celular ----------
// Fundo escuro do "porão" (o iPhone não aceita transparência) com a moeda no meio,
// ampliada em número inteiro de vezes para os pixels ficarem nítidos.
function iconeApp(tamanho, fracao) {
  const fundo = [0x1a, 0x11, 0x0b];
  const mapa = PIXEL_MAPAS.moeda;
  const n = mapa.length;
  const escala = Math.max(1, Math.floor((tamanho * fracao) / n));
  const inicio = Math.floor((tamanho - n * escala) / 2);
  const buf = Buffer.alloc(tamanho * tamanho * 4);
  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const i = (y * tamanho + x) * 4;
      const ch = mapa[Math.floor((y - inicio) / escala)]?.[Math.floor((x - inicio) / escala)];
      const hex = ch && ch !== '.' && x >= inicio && y >= inicio ? PIXEL_CORES[ch] : null;
      const cor = hex ? [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)) : fundo;
      buf[i] = cor[0];
      buf[i + 1] = cor[1];
      buf[i + 2] = cor[2];
      buf[i + 3] = 255;
    }
  }
  return png(tamanho, tamanho, buf);
}

const pastaIcones = path.join(raiz, 'web', 'publico', 'icones');
fs.mkdirSync(pastaIcones, { recursive: true });
fs.writeFileSync(path.join(pastaIcones, 'icone-180.png'), iconeApp(180, 0.72));
fs.writeFileSync(path.join(pastaIcones, 'icone-192.png'), iconeApp(192, 0.72));
fs.writeFileSync(path.join(pastaIcones, 'icone-512.png'), iconeApp(512, 0.72));
// "maskable": o Android pode cortar em círculo, então a moeda fica menor
fs.writeFileSync(path.join(pastaIcones, 'icone-maskable-512.png'), iconeApp(512, 0.56));
console.log('Gerado: web/publico/icones/ (180, 192, 512 e maskable 512)');
