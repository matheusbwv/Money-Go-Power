'use strict';
/*
 * Catálogo de bancos (cores + emblemas) e bandeiras de cartão.
 * Os emblemas são desenhos simplificados em SVG inspirados na identidade
 * visual de cada banco, feitos para funcionar sem internet.
 */

function textoEmblema(fundo, texto, corTexto, tamanho, extra = '') {
  return `<rect width="48" height="48" rx="12" fill="${fundo}"/>${extra}` +
    `<text x="24" y="24.5" dominant-baseline="central" text-anchor="middle" ` +
    `font-family="Segoe UI, Arial, sans-serif" font-size="${tamanho}" font-weight="800" ` +
    `letter-spacing="-0.4" fill="${corTexto}">${texto}</text>`;
}

const BANCOS = [
  {
    id: 'nubank', nome: 'Nubank', cor: '#820AD1', cor2: '#4A0482', texto: '#FFFFFF',
    desenho: `<rect width="48" height="48" rx="12" fill="#820AD1"/>
      <path d="M10.5 32V21a5 5 0 0 1 10 0v11M27.5 16v11a5 5 0 0 0 10 0V16" fill="none" stroke="#fff"
        stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    // Símbolo: duas peças iguais giradas 180°, com faixas na inclinação 2:3,
    // mais os dois cantinhos. Redesenhado a partir da marca do banco.
    id: 'bb', nome: 'Banco do Brasil', cor: '#FBD71E', cor2: '#F2B705', texto: '#0A3AA0',
    desenho: `<rect width="48" height="48" rx="12" fill="#FCDD1E"/>
      <path fill="#0A3AA0" d="M23.98 6L41.75 17.95L20.57 32.1L17.16 29.74L34.05 18.04L23.56 11.08L18.69 14.38L22.41 16.89L13.5 22.76L6.27 17.95Z
        M23.98 41.84L6.22 29.9L27.4 15.75L30.81 18.1L13.92 29.8L24.41 36.77L29.28 33.46L25.56 30.95L34.47 25.08L41.7 29.9Z
        M34.88 10.87L42 6.09L42 10.97L38.38 13.33Z M13.09 36.97L5.97 41.75L5.97 36.88L9.58 34.52Z"/>`,
  },
  {
    id: 'bradesco', nome: 'Bradesco', cor: '#CC092F', cor2: '#7A0019', texto: '#FFFFFF',
    // Árvore: arco grosso (copa), laço que atravessa e faz a curva à direita, e o
    // tronco de duas barras com topo inclinado. Redesenhado a partir da marca do
    // banco (coordenadas da imagem de referência, reduzidas para 48x48).
    desenho: `<rect width="48" height="48" rx="12" fill="#E0072D"/>
      <g fill="#fff" transform="translate(-3.9 -3.8) scale(0.127)">
        <path d="M164 289C130 262 110 230 111 195C112 130 160 82 222 81C262 80 295 98 313 122C318 128 312 134 305 129C285 112 265 105 240 106C205 107 175 123 159 145C147 162 138 185 139 210C139 240 152 268 172 284C176 290 168 293 164 289Z"/>
        <path d="M74 177C95 165 130 150 200 143C270 138 330 160 355 185C372 203 370 230 352 250C335 268 305 282 281 289C274 291 272 282 278 279C305 267 330 250 333 228C336 205 305 185 265 177C225 168 175 165 145 168C120 170 95 178 80 182C72 184 70 179 74 177Z"/>
        <path d="M196 359L196 293Q196 289 200 287L216 280L216 359Z"/>
        <path d="M223 359L223 275L248 262Q252 260 252 265L252 359Z"/>
      </g>`,
  },
  {
    id: 'itau', nome: 'Itaú', cor: '#EC7000', cor2: '#B54F00', texto: '#FFFFFF',
    desenho: textoEmblema('#EC7000', 'itaú', '#0A2E7A', 15.5,
      '<rect x="5" y="5" width="38" height="38" rx="9" fill="none" stroke="#0A2E7A" stroke-width="2.2"/>'),
  },
  {
    id: 'santander', nome: 'Santander', cor: '#EC0000', cor2: '#990000', texto: '#FFFFFF',
    desenho: `<rect width="48" height="48" rx="12" fill="#EC0000"/>
      <path d="M24.5 9c1.8 4.6 8.5 8 8.5 15.2a9 9 0 0 1-18 0c0-3.8 2.2-6.3 4.4-8.2.3 3 1.6 4.4 3.3 5.1-.9-4.2.6-8.3 1.8-12.1Z" fill="#fff"/>
      <path d="M13 38h22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    id: 'caixa', nome: 'Caixa', cor: '#005CA9', cor2: '#003A6E', texto: '#FFFFFF',
    desenho: `<rect width="48" height="48" rx="12" fill="#005CA9"/>
      <path d="M15 14l18 20" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
      <path d="M33 14 15 34" stroke="#F39200" stroke-width="6" stroke-linecap="round"/>`,
  },
  {
    id: 'inter', nome: 'Inter', cor: '#FF7A00', cor2: '#D45500', texto: '#FFFFFF',
    desenho: textoEmblema('#FF7A00', 'inter', '#fff', 14.5),
  },
  {
    id: 'c6', nome: 'C6 Bank', cor: '#2B2B2B', cor2: '#0A0A0A', texto: '#FFFFFF',
    desenho: textoEmblema('#2B2B2B', 'C6', '#fff', 20),
  },
  {
    id: 'picpay', nome: 'PicPay', cor: '#11C76F', cor2: '#078A4B', texto: '#FFFFFF',
    desenho: textoEmblema('#11C76F', 'PicPay', '#fff', 11),
  },
  {
    id: 'mercadopago', nome: 'Mercado Pago', cor: '#00A0E3', cor2: '#00649A', texto: '#FFFFFF',
    desenho: textoEmblema('#00A0E3', 'MP', '#fff', 19),
  },
  {
    id: 'sicoob', nome: 'Sicoob', cor: '#00AE9D', cor2: '#003641', texto: '#FFFFFF',
    desenho: textoEmblema('#003641', 'sicoob', '#7FE0D2', 11),
  },
  {
    id: 'sicredi', nome: 'Sicredi', cor: '#3FA110', cor2: '#22650A', texto: '#FFFFFF',
    desenho: textoEmblema('#3FA110', 'sicredi', '#fff', 10.5),
  },
  {
    id: 'btg', nome: 'BTG Pactual', cor: '#0D2240', cor2: '#050E1C', texto: '#FFFFFF',
    desenho: textoEmblema('#0D2240', 'btg', '#fff', 16),
  },
  {
    id: 'xp', nome: 'XP', cor: '#111111', cor2: '#000000', texto: '#FFFFFF',
    desenho: textoEmblema('#111111', 'XP', '#FFD100', 19),
  },
  {
    id: 'banrisul', nome: 'Banrisul', cor: '#0060AE', cor2: '#003C6E', texto: '#FFFFFF',
    desenho: textoEmblema('#0060AE', 'banrisul', '#fff', 9.5),
  },
  {
    id: 'outro', nome: 'Outro banco', cor: '#475569', cor2: '#1E293B', texto: '#FFFFFF', desenho: null,
  },
];

const BANDEIRAS = [
  {
    id: 'visa', nome: 'Visa',
    // Linha de base calculada pela altura das maiúsculas (~0,72 da fonte) para o
    // texto ficar no meio de verdade: 11 + 16 * 0,72 / 2 ≈ 16,8.
    svg: (claro) => `<svg class="bandeira-svg" viewBox="0 0 64 22" aria-label="Visa"><text x="31" y="16.8"
      text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900"
      font-style="italic" font-size="16" letter-spacing="-0.3" fill="${claro ? '#fff' : '#1A1F71'}">VISA</text></svg>`,
  },
  {
    id: 'mastercard', nome: 'Mastercard',
    svg: () => `<svg class="bandeira-svg" viewBox="0 0 38 24" aria-label="Mastercard">
      <circle cx="13" cy="12" r="11" fill="#EB001B"/><circle cx="25" cy="12" r="11" fill="#F79E1B"/>
      <path d="M19 2.78A11 11 0 0 0 19 21.22A11 11 0 0 0 19 2.78Z" fill="#FF5F00"/></svg>`,
  },
  {
    id: 'elo', nome: 'Elo',
    svg: (claro) => `<svg class="bandeira-svg" viewBox="0 0 50 24" aria-label="Elo">
      <circle cx="5" cy="5" r="3.3" fill="#FFCB05"/><circle cx="5" cy="12" r="3.3" fill="#00A4E0"/>
      <circle cx="5" cy="19" r="3.3" fill="#EF4123"/><text x="12" y="12" dominant-baseline="central"
      font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="20" fill="${claro ? '#fff' : '#111'}">elo</text></svg>`,
  },
  {
    id: 'amex', nome: 'American Express',
    svg: () => `<svg class="bandeira-svg" viewBox="0 0 48 24" aria-label="American Express">
      <rect width="48" height="24" rx="4" fill="#2E77BC"/><text x="24" y="16"
      text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="11" fill="#fff">AMEX</text></svg>`,
  },
  {
    id: 'hipercard', nome: 'Hipercard',
    svg: () => `<svg class="bandeira-svg" viewBox="0 0 64 24" aria-label="Hipercard">
      <rect width="64" height="24" rx="4" fill="#B3131B"/><text x="32" y="16.1"
      text-anchor="middle" font-family="Arial, sans-serif" font-style="italic" font-weight="800" font-size="11.5"
      fill="#fff">Hipercard</text></svg>`,
  },
  { id: '', nome: 'Outra / não sei', svg: () => '' },
];

// ---------- utilidades de cor ----------

function hexParaRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbParaHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function escurecer(hex, fator) {
  return rgbParaHex(hexParaRgb(hex).map((v) => v * (1 - fator)));
}

function luminancia(hex) {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function corTextoIdeal(hex) {
  return luminancia(hex) > 0.45 ? '#1A1A1A' : '#FFFFFF';
}

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- acesso ao catálogo ----------

function bancoPorId(id) {
  return BANCOS.find((b) => b.id === id) || BANCOS[BANCOS.length - 1];
}

function bandeiraPorId(id) {
  return BANDEIRAS.find((b) => b.id === id) || BANDEIRAS[BANDEIRAS.length - 1];
}

function iniciais(nome) {
  const partes = String(nome || '?').trim().split(/\s+/).filter((p) => !/^(de|da|do|dos|das|e)$/i.test(p));
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] || '?').slice(0, 2);
  return letras.toUpperCase();
}

/** Cores e emblema de um cartão (ou fatia de gráfico) a partir do banco salvo. */
function estiloBanco(banco, nome, cor) {
  const b = bancoPorId(banco);
  if (b.id !== 'outro') {
    return { cor: b.cor, cor2: b.cor2, texto: b.texto, desenho: b.desenho, nome: b.nome };
  }
  const base = /^#[0-9a-f]{6}$/i.test(cor || '') ? cor.toUpperCase() : b.cor;
  const texto = corTextoIdeal(base);
  return {
    cor: base,
    cor2: escurecer(base, 0.38),
    texto,
    nome: nome || b.nome,
    desenho: textoEmblema(base, esc(iniciais(nome)), texto, 17),
  };
}

function emblemaSvg(desenho, tamanho = 40) {
  return `<svg class="emblema" width="${tamanho}" height="${tamanho}" viewBox="0 0 48 48" aria-hidden="true">${desenho}</svg>`;
}

function emblemaBanco(banco, nome, cor, tamanho = 40) {
  return emblemaSvg(estiloBanco(banco, nome, cor).desenho, tamanho);
}

// ---------- Pix ----------

const PIX_COR = '#32BCAD';

/** Marca do Pix simplificada (losango), com ou sem fundo. */
function pixSvg(tamanho = 22, comFundo = true) {
  const traco = comFundo ? '#fff' : PIX_COR;
  return `<svg class="emblema pix-marca" width="${tamanho}" height="${tamanho}" viewBox="0 0 48 48" aria-hidden="true">` +
    (comFundo ? `<rect width="48" height="48" rx="12" fill="${PIX_COR}"/>` : '') +
    `<path d="M24 9.5 38.5 24 24 38.5 9.5 24Z" fill="none" stroke="${traco}" stroke-width="4.2" stroke-linejoin="round"/>` +
    `<path d="M24 18.5 29.5 24 24 29.5 18.5 24Z" fill="${traco}"/></svg>`;
}
