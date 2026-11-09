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
    id: 'bb', nome: 'Banco do Brasil', cor: '#FBD71E', cor2: '#F2B705', texto: '#1E3A9E',
    desenho: `<rect width="48" height="48" rx="12" fill="#FBD71E"/>
      <path d="M24 8.5 35.5 20 24 31.5 12.5 20Z M24 16.5 35.5 28 24 39.5 12.5 28Z" fill="none"
        stroke="#2A44B8" stroke-width="3.6" stroke-linejoin="round"/>`,
  },
  {
    id: 'bradesco', nome: 'Bradesco', cor: '#CC092F', cor2: '#7A0019', texto: '#FFFFFF',
    desenho: `<rect width="48" height="48" rx="12" fill="#CC092F"/>
      <g fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round">
        <path d="M12 27.5c4-9 20-9 24 0"/><path d="M15.5 21.5c3.5-6.5 13.5-6.5 17 0"/>
        <path d="M19.5 15.8c2.5-3 6.5-3 9 0"/><path d="M24 27.5V37"/>
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
    svg: (claro) => `<svg class="bandeira-svg" viewBox="0 0 64 22" aria-label="Visa"><text x="32" y="11.5"
      dominant-baseline="central" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900"
      font-style="italic" font-size="19" letter-spacing="-0.5" fill="${claro ? '#fff' : '#1A1F71'}">VISA</text></svg>`,
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
      <rect width="48" height="24" rx="4" fill="#2E77BC"/><text x="24" y="12.5" dominant-baseline="central"
      text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="11" fill="#fff">AMEX</text></svg>`,
  },
  {
    id: 'hipercard', nome: 'Hipercard',
    svg: () => `<svg class="bandeira-svg" viewBox="0 0 64 24" aria-label="Hipercard">
      <rect width="64" height="24" rx="4" fill="#B3131B"/><text x="32" y="12.5" dominant-baseline="central"
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
