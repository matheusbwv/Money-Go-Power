'use strict';
/*
 * Gráficos de pizza (círculo) em SVG, sem bibliotecas externas.
 * desenharPizza(elemento, fatias, opcoes)
 *   fatias: [{ nome, valor, cor, icone? }]
 *   opcoes: { rosca: bool, vazio: 'texto', centro: { valor, rotulo, classe } }
 */

const PIZZA = { C: 100, R: 92, RI: 60, AFASTAR: 7 };

function pontoNoCirculo(r, angulo) {
  return [PIZZA.C + r * Math.cos(angulo), PIZZA.C + r * Math.sin(angulo)].map((v) => +v.toFixed(3));
}

function caminhoFatia(a0, a1, R, RI) {
  const grande = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pontoNoCirculo(R, a0);
  const [x1, y1] = pontoNoCirculo(R, a1);
  if (!RI) {
    return `M${PIZZA.C} ${PIZZA.C}L${x0} ${y0}A${R} ${R} 0 ${grande} 1 ${x1} ${y1}Z`;
  }
  const [x2, y2] = pontoNoCirculo(RI, a1);
  const [x3, y3] = pontoNoCirculo(RI, a0);
  return `M${x0} ${y0}A${R} ${R} 0 ${grande} 1 ${x1} ${y1}L${x2} ${y2}A${RI} ${RI} 0 ${grande} 0 ${x3} ${y3}Z`;
}

function caminhoCirculoInteiro(R, RI) {
  const C = PIZZA.C;
  const anel = (r) => `M${C - r} ${C}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  return RI ? anel(R) + anel(RI) : anel(R);
}

function formatarPct(frac) {
  const p = frac * 100;
  if (p > 0 && p < 1) return '<1%';
  return `${Math.round(p)}%`;
}

function desenharPizza(el, fatias, opcoes = {}) {
  const dados = fatias.filter((f) => f.valor > 0);
  const total = dados.reduce((s, f) => s + f.valor, 0);

  if (!dados.length || total <= 0) {
    el.innerHTML = `
      <div class="grafico-vazio">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r="80" class="vazio-anel"/>
        </svg>
        <p>${opcoes.vazio || 'Sem dados neste mês.'}</p>
      </div>`;
    return;
  }

  const R = PIZZA.R;
  const RI = opcoes.rosca ? PIZZA.RI : 0;
  let angulo = -Math.PI / 2;

  const partes = dados.map((f, i) => {
    const frac = f.valor / total;
    const a0 = angulo;
    const a1 = angulo + frac * Math.PI * 2;
    angulo = a1;
    return { ...f, i, frac, a0, a1, meio: (a0 + a1) / 2 };
  });

  const fatiasSvg = partes.map((p) => {
    const inteiro = p.frac > 0.9999;
    const d = inteiro ? caminhoCirculoInteiro(R, RI) : caminhoFatia(p.a0, p.a1, R, RI);
    const dx = inteiro ? 0 : Math.cos(p.meio) * PIZZA.AFASTAR;
    const dy = inteiro ? 0 : Math.sin(p.meio) * PIZZA.AFASTAR;
    let rotulo = '';
    if (p.frac >= 0.07) {
      const raio = RI ? (R + RI) / 2 : R * 0.62;
      const [tx, ty] = inteiro && !RI ? [PIZZA.C, PIZZA.C] : pontoNoCirculo(raio, inteiro ? -Math.PI / 2 : p.meio);
      rotulo = `<text class="fatia-rotulo" x="${tx}" y="${ty}" fill="${corTextoIdeal(p.cor)}">${formatarPct(p.frac)}</text>`;
    }
    return `<g class="fatia" data-i="${p.i}" style="--dx:${dx.toFixed(2)}px;--dy:${dy.toFixed(2)}px">
      <path d="${d}" fill="${p.cor}" fill-rule="evenodd"/>${rotulo}</g>`;
  }).join('');

  let centro = '';
  if (RI && opcoes.centro) {
    centro = `<text class="centro-valor ${opcoes.centro.classe || ''}" x="100" y="94">${esc(opcoes.centro.valor)}</text>
      <text class="centro-rotulo" x="100" y="119">${esc(opcoes.centro.rotulo || '')}</text>`;
  }

  const legenda = partes.map((p) => `
    <li data-i="${p.i}">
      <span class="leg-cor" style="background:${p.cor}"></span>
      ${p.icone || ''}
      <span class="leg-nome">${esc(p.nome)}</span>
      <span class="leg-valor">${brl.format(p.valor)}</span>
      <span class="leg-pct">${formatarPct(p.frac)}</span>
    </li>`).join('');

  el.innerHTML = `
    <div class="grafico-conteudo">
      <div class="grafico-svg">
        <svg viewBox="-10 -10 220 220" role="img" aria-label="${esc(opcoes.titulo || 'Gráfico de pizza')}">
          ${fatiasSvg}${centro}
        </svg>
      </div>
      <ul class="legenda">${legenda}</ul>
    </div>`;

  const destacar = (i, ativo) => {
    el.querySelectorAll(`[data-i="${i}"]`).forEach((n) => n.classList.toggle('ativa', ativo));
  };

  el.querySelectorAll('[data-i]').forEach((n) => {
    const i = Number(n.dataset.i);
    const p = partes[i];
    n.addEventListener('mouseenter', () => destacar(i, true));
    n.addEventListener('mouseleave', () => {
      destacar(i, false);
      esconderDica();
    });
    if (n.classList.contains('fatia')) {
      n.addEventListener('mousemove', (e) => mostrarDica(e, p));
    }
  });
}

function mostrarDica(evento, p) {
  const dica = document.getElementById('dica-grafico');
  if (!dica) return;
  dica.innerHTML = `<span class="dica-cor" style="background:${p.cor}"></span><strong>${esc(p.nome)}</strong>
    <span>${brl.format(p.valor)} · ${formatarPct(p.frac)}</span>`;
  dica.classList.add('visivel');
  const margem = 14;
  let x = evento.clientX + margem;
  let y = evento.clientY + margem;
  const { width, height } = dica.getBoundingClientRect();
  if (x + width > window.innerWidth - 8) x = evento.clientX - width - margem;
  if (y + height > window.innerHeight - 8) y = evento.clientY - height - margem;
  dica.style.transform = `translate(${x}px, ${y}px)`;
}

function esconderDica() {
  document.getElementById('dica-grafico')?.classList.remove('visivel');
}
