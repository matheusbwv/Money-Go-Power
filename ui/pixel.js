'use strict';
/*
 * Pixel art original do Minhas Finanças (moeda, coração, caveira, saco, "check"
 * e os itens de cada categoria), gerada em SVG com pixels nítidos. Também é usada pelo script que
 * gera o ícone do programa e a imagem do README.
 */

const PIXEL_CORES = {
  o: '#2B1608', // contorno
  y: '#E9B53B', // ouro
  s: '#B57D1C', // sombra do ouro
  h: '#FFE38A', // brilho do ouro
  i: '#C99227', // anel em relevo
  w: '#FFF8DC', // reflexo
  r: '#C8261C', // vermelho
  R: '#7E140E', // vermelho escuro
  p: '#FF8A7A', // brilho do vermelho
  b: '#9C6B3A', // saco (couro)
  B: '#6E4522', // saco sombra
  c: '#EDE3C8', // osso
  C: '#B8A888', // osso sombra
  g: '#6DB33F', // verde
  G: '#3F7A1F', // verde escuro
  k: '#3B6FB6', // azul
  K: '#24477A', // azul escuro
  l: '#A9D4F5', // azul claro
  v: '#8FD0F2', // vidro
  n: '#A8A8A8', // metal
  N: '#6B6B6B', // metal escuro
  t: '#B07A3E', // madeira
  T: '#7A5228', // madeira escura
  m: '#8E44AD', // roxo
  M: '#5E2D79', // roxo escuro
  a: '#D9AE6E', // papelão
  A: '#A97E45', // papelão escuro
};

/** Moeda 16x16 desenhada por geometria: contorno, aro com luz e sombra, anel em relevo. */
function mapaMoeda() {
  const n = 16;
  const R = 7.5;
  const linhas = [];
  for (let y = 0; y < n; y++) {
    let linha = '';
    for (let x = 0; x < n; x++) {
      const px = x + 0.5 - n / 2;
      const py = y + 0.5 - n / 2;
      const d = Math.hypot(px, py);
      const diag = (px + py) / R;
      let c = '.';
      if (d <= R + 0.35) {
        if (d > R - 0.8) c = 'o';
        else if (d > R - 2.1) c = diag > 0.3 ? 's' : diag < -0.4 ? 'h' : 'y';
        else if (d > 2.9 && d < 4.0) c = diag > 0.1 ? 's' : 'i';
        else c = 'y';
      }
      linha += c;
    }
    linhas.push(linha);
  }
  // reflexos
  const brilho = [[4, 3], [5, 3], [3, 4], [3, 5]];
  brilho.forEach(([x, y]) => {
    linhas[y] = linhas[y].slice(0, x) + 'w' + linhas[y].slice(x + 1);
  });
  return linhas;
}

const PIXEL_MAPAS = {
  moeda: mapaMoeda(),
  coracao: [
    '.oo...oo.',
    'orro.orro',
    'oprrorrRo',
    'orrrrrrRo',
    '.orrrrRo.',
    '..orrRo..',
    '...oRo...',
    '....o....',
  ],
  coracaoPartido: [
    '.oo...oo.',
    'orro.orro',
    'oprro.rRo',
    'orrro.rRo',
    '.orrro.o.',
    '..orrro..',
    '...oro...',
    '....o....',
  ],
  caveira: [
    '..ooooo..',
    '.occccco.',
    'occcccCco',
    'ocoocooCo',
    'ocoocooCo',
    'occcoccCo',
    '.occccCo.',
    '.ocococo.',
    '..ooooo..',
  ],
  saco: [
    '...oooo...',
    '....oo....',
    '...obbo...',
    '..obbbBo..',
    '.obbbbbBo.',
    'obbbyybbBo',
    'obbyhysbBo',
    'obbbyybbBo',
    '.obbbbbBo.',
    '..oooooo..',
  ],
  check: [
    '......ooo',
    '.....oggo',
    'oo..oggo.',
    'ogooggo..',
    'ogggGo...',
    '.ogGo....',
    '..oo.....',
  ],

  // ----- itens das categorias -----
  casa: [
    '.....oo.....',
    '....orRo....',
    '...orrrRo...',
    '..orrrrrRo..',
    '.orrrrrrrRo.',
    'oooooooooooo',
    '.occcccccCo.',
    '.okkocctTCo.',
    '.okkocctTCo.',
    '.occcccttCo.',
    '.occcccttCo.',
    '.oooooooooo.',
  ],
  lampada: [
    '....oooo....',
    '...ohhyyo...',
    '..ohwyyyso..',
    '..ohyyyyso..',
    '..oyyyyyso..',
    '...oyyyso...',
    '...oyyyso...',
    '....oooo....',
    '....onno....',
    '....oNNo....',
    '....onno....',
    '.....oo.....',
  ],
  gota: [
    '....oo....',
    '...okko...',
    '..okkkko..',
    '..olkkko..',
    '.olkkkkko.',
    '.olkkkkKo.',
    'olkkkkkkKo',
    'olwkkkkkKo',
    'olkkkkkKKo',
    '.okkkkKKo.',
    '..oKKKKo..',
    '...oooo...',
  ],
  sinal: [
    '.........ooo',
    '.........oko',
    '......oooolo',
    '......okooko',
    '...oooolooko',
    '...okooKooKo',
    'oooolooKooKo',
    'okooKooKooKo',
    'oKooKooKooKo',
    'oooooooooooo',
  ],
  maca: [
    '......o.....',
    '.....ot.oo..',
    '.....otogGo.',
    '..oooootoo..',
    '.oprrroorro.',
    'oprrrrrrrrRo',
    'orrrrrrrrrRo',
    'orrrrrrrrrRo',
    'orrrrrrrrRRo',
    '.orrrrrrRRo.',
    '..orrRoRRo..',
    '...ooo.ooo..',
  ],
  carro: [
    '...oooooo...',
    '..ovvoovvo..',
    '.ovvvoovvvo.',
    'oooooooooooo',
    'okkkkkkkkkKo',
    'olkkkkkkkKKo',
    'ooNNooooNNoo',
    '.oNNo..oNNo.',
    '..oo....oo..',
  ],
  pilula: [
    '.oooooooooo.',
    'oprrrrocccCo',
    'orrrrrocccCo',
    'oRRRRRoCCCCo',
    '.oooooooooo.',
  ],
  livro: [
    '.ooooooooooo',
    'oMmmmmmmmmMo',
    'oMhhhhhhmmMo',
    'oMmmmmmmmmMo',
    'oMmmmmmmmmMo',
    'oMmmmmmmmmMo',
    'oMmmmmmmmmMo',
    'oMMMMMMMMMMo',
    'occcccccccCo',
    '.ooooooooooo',
  ],
  dado: [
    '.oooooooooo.',
    'occcccccccCo',
    'ocrrccccrrCo',
    'ocrrccccrrCo',
    'occcccccccCo',
    'occccrrcccCo',
    'occccrrcccCo',
    'occcccccccCo',
    'ocrrccccrrCo',
    'ocrrccccrrCo',
    'oCCCCCCCCCCo',
    '.oooooooooo.',
  ],
  tv: [
    '..o.....o...',
    '...o...o....',
    '....o.o.....',
    'oooooooooooo',
    'otvvvvvvtnto',
    'otvwvvvvtNto',
    'otvvvvvvtnto',
    'otvvvvvvtNto',
    'oTTTTTTTTTTo',
    'oooooooooooo',
    '.oo......oo.',
  ],
  bau: [
    '.oooooooooo.',
    'otttttttttTo',
    'otttttttttTo',
    'ooooohhooooo',
    'otttoyyottTo',
    'otttoysottTo',
    'ottttoottTTo',
    'otttttttttTo',
    'oTTTTTTTTTTo',
    'oooooooooooo',
  ],
  caixa: [
    '.oooooooooo.',
    'oaaaaTTaaaAo',
    'oaaaaTTaaaAo',
    'oooooooooooo',
    'oaaaaTTaaaAo',
    'oaaaaaaaaaAo',
    'oaaaaaaaaaAo',
    'oaaaaaaaaaAo',
    'oAAAAAAAAAAo',
    'oooooooooooo',
  ],
  cartao: [
    'oooooooooooo',
    'okkkkkkkkkKo',
    'okhykkkkkkKo',
    'okyskkkkkkKo',
    'okkkkkkkkkKo',
    'oklllklllkKo',
    'okkkkkkkkkKo',
    'oKKKKKKKKKKo',
    'oooooooooooo',
  ],
};

/** Converte um mapa de caracteres em SVG (cada letra = uma cor, "." = vazio). */
function pixelSvg(nome, tamanho = 24, classe = '') {
  const mapa = PIXEL_MAPAS[nome];
  const alt = mapa.length;
  const larg = Math.max(...mapa.map((l) => l.length));
  let rects = '';
  mapa.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const ch = linha[x];
      let fim = x + 1;
      while (fim < linha.length && linha[fim] === ch) fim++;
      if (ch !== '.' && PIXEL_CORES[ch]) {
        rects += `<rect x="${x}" y="${y}" width="${fim - x}" height="1" fill="${PIXEL_CORES[ch]}"/>`;
      }
      x = fim;
    }
  });
  const altura = Math.round((tamanho * alt) / larg);
  return `<svg class="pixel ${classe}" width="${tamanho}" height="${altura}" viewBox="0 0 ${larg} ${alt}" ` +
    `shape-rendering="crispEdges" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

if (typeof module !== 'undefined') {
  module.exports = { PIXEL_CORES, PIXEL_MAPAS, pixelSvg };
}
