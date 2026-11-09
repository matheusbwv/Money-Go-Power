'use strict';
/*
 * Interface do Minhas Finanças.
 * Todos os cálculos e o salvamento ficam no Rust (src/dados.rs); aqui a
 * interface só desenha a "visão" do mês que o Rust devolve.
 */

const invoke = window.__TAURI__?.core?.invoke;

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
  'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CATEGORIAS = [
  { id: 'moradia', nome: 'Moradia / Aluguel', icone: '🏠', cor: '#EA580C' },
  { id: 'energia', nome: 'Luz', icone: '💡', cor: '#EAB308' },
  { id: 'agua', nome: 'Água', icone: '💧', cor: '#06B6D4' },
  { id: 'internet', nome: 'Internet / Celular', icone: '📶', cor: '#7C3AED' },
  { id: 'mercado', nome: 'Mercado', icone: '🛒', cor: '#16A34A' },
  { id: 'transporte', nome: 'Transporte', icone: '🚗', cor: '#64748B' },
  { id: 'saude', nome: 'Saúde', icone: '💊', cor: '#DC2626' },
  { id: 'educacao', nome: 'Educação', icone: '🎓', cor: '#65A30D' },
  { id: 'lazer', nome: 'Lazer', icone: '🎉', cor: '#EC4899' },
  { id: 'assinaturas', nome: 'Assinaturas', icone: '📺', cor: '#C026D3' },
  { id: 'emprestimo', nome: 'Empréstimo / Financiamento', icone: '🏦', cor: '#78716C' },
  { id: 'outros', nome: 'Outros', icone: '📦', cor: '#94A3B8' },
];
const CATEGORIA_CARTOES = { id: 'cartoes', nome: 'Cartões de crédito', icone: '💳', cor: '#2563EB' };
const CATEGORIA_PIX = { id: 'pix', nome: 'Pix', icone: pixSvg(18), cor: PIX_COR };

const SUGESTOES_CONTA = [
  ['Aluguel', 'moradia'], ['Condomínio', 'moradia'], ['Conta de luz', 'energia'], ['Conta de água', 'agua'],
  ['Internet', 'internet'], ['Celular', 'internet'], ['Mercado', 'mercado'], ['Combustível', 'transporte'],
  ['Plano de saúde', 'saude'], ['Faculdade', 'educacao'], ['Streaming', 'assinaturas'], ['Financiamento', 'emprestimo'],
];

const CORES_RENDA = { pago: '#3F7A1F', falta: '#A8231A', livre: '#E9B53B' };

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ICONES = {
  editar: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/></svg>',
  lixo: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  fechar: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  repetir: '<svg viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>',
};

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

const estado = { mes: chaveMes(new Date()), visao: null };

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

function chaveMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function somarMeses(chave, n) {
  const [ano, mes] = chave.split('-').map(Number);
  return chaveMes(new Date(ano, mes - 1 + n, 1));
}

function nomeMes(chave) {
  return MESES[Number(chave.split('-')[1]) - 1];
}

function statusVencimento(dia, pago, valor) {
  if (pago) return { classe: 'pago', texto: 'Pago' };
  if (!valor || !dia) return null;
  const hoje = new Date();
  const atual = chaveMes(hoje);
  if (estado.mes < atual) return { classe: 'atrasado', texto: 'Ficou sem pagar' };
  if (estado.mes > atual) return null;
  const faltam = dia - hoje.getDate();
  if (faltam < 0) return { classe: 'atrasado', texto: `Atrasado há ${-faltam} dia${faltam === -1 ? '' : 's'}` };
  if (faltam === 0) return { classe: 'alerta', texto: 'Vence hoje' };
  if (faltam <= 5) return { classe: 'alerta', texto: `Vence em ${faltam} dia${faltam === 1 ? '' : 's'}` };
  return null;
}

// ---------------------------------------------------------------------------
// Comunicação com o Rust
// ---------------------------------------------------------------------------

async function chamar(comando, args = {}) {
  if (!invoke) {
    toast('Abra o programa pelo arquivo MinhasFinancas.exe.', 'erro');
    return false;
  }
  const mes = estado.mes;
  try {
    const visao = await invoke(comando, { mes, ...args });
    if (visao.mes === estado.mes) {
      estado.visao = visao;
      renderizar();
    }
    return true;
  } catch (erro) {
    toast(typeof erro === 'string' ? erro : erro?.message || 'Algo deu errado.', 'erro');
    return false;
  }
}

function irParaMes(chave) {
  estado.mes = chave;
  renderTopo();
  chamar('carregar');
}

// ---------------------------------------------------------------------------
// Renderização
// ---------------------------------------------------------------------------

function renderizar() {
  const v = estado.visao;
  if (!v) return;
  const foco = capturarFoco();
  renderTopo();
  renderResumo(v.resumo);
  renderCartoes(v);
  renderContas(v);
  renderPix(v);
  renderGraficos(v);
  restaurarFoco(foco);
}

function renderTopo() {
  const [ano] = estado.mes.split('-');
  $('#mes-nome').textContent = nomeMes(estado.mes);
  $('#mes-ano').textContent = ano;
  $('#mes-hoje').hidden = estado.mes === chaveMes(new Date());
}

function valorCampo(valor) {
  return valor ? numero.format(valor) : '';
}

function renderResumo(r) {
  const renda = $('#renda');
  if (document.activeElement !== renda) {
    renda.value = valorCampo(r.renda);
    renda.classList.remove('invalido');
  }

  $('#total').textContent = brl.format(r.total);
  const partes = [`Cartões ${brl.format(r.total_cartoes)}`, `contas ${brl.format(r.total_contas)}`];
  if (r.total_pix > 0) partes.push(`Pix ${brl.format(r.total_pix)}`);
  $('#total-detalhe').textContent = partes.join(' + ');

  $('#pago').textContent = brl.format(r.pago);
  const pctPago = r.total > 0 ? (r.pago / r.total) * 100 : 0;
  $('#barra-pago').style.width = `${Math.min(100, pctPago)}%`;
  $('#pago-detalhe').textContent = r.total > 0 ? `${Math.round(pctPago)}% do total já foi pago` : 'Nada lançado ainda';

  $('#falta').textContent = brl.format(r.a_pagar);
  $('#falta-detalhe').textContent = r.pendentes
    ? `${r.pendentes} conta${r.pendentes === 1 ? '' : 's'} pendente${r.pendentes === 1 ? '' : 's'}`
    : r.total > 0 ? 'Tudo pago! 🎉' : '—';

  const sobra = $('#stat-sobra');
  $('#sobra').textContent = brl.format(r.sobra);
  sobra.classList.toggle('negativo', r.sobra < 0);
  sobra.classList.toggle('positivo', r.sobra >= 0 && r.renda > 0);
  $('#sobra-detalhe').textContent = r.renda > 0
    ? `${brl.format(r.renda)} − ${brl.format(r.total)}`
    : 'Informe a renda para calcular';
  $('#icone-sobra').innerHTML = pixelSvg(r.sobra < 0 ? 'coracaoPartido' : 'coracao', 26);

  // Contador de moedas no topo: quanto sobra no mês.
  const hud = $('#hud-moedas');
  hud.classList.toggle('negativo', r.sobra < 0);
  hud.innerHTML = `${pixelSvg('moeda', 30)}<div><small>sobra</small><strong>× ${brl.format(r.sobra)}</strong></div>`;
}

function renderCartoes(v) {
  const lista = $('#lista-cartoes');
  const ativos = v.cartoes.length;
  $('#cartoes-sub').textContent = ativos
    ? `${ativos} cartão${ativos === 1 ? '' : 'es'} · total das faturas ${brl.format(v.resumo.total_cartoes)}`
    : 'Nenhum cartão cadastrado';

  const fatura = `Fatura de ${nomeMes(estado.mes).toLowerCase()}`;
  lista.innerHTML = v.cartoes.map((c) => {
    const status = statusVencimento(c.vencimento, c.pago, c.valor);
    return `
      <article class="cartao-item ${c.pago ? 'pago' : ''}">
        ${cartaoVisual(c)}
        <div class="ci-corpo">
          <label class="ci-rotulo" for="fatura-${c.id}">${fatura}</label>
          <div class="campo-dinheiro">
            <span>R$</span>
            <input id="fatura-${c.id}" data-fatura="${c.id}" data-chave="fatura-${c.id}" inputmode="decimal"
                   autocomplete="off" placeholder="0,00" value="${valorCampo(c.valor)}">
          </div>
          <div class="ci-acoes">
            <button class="pill-pago ${c.pago ? 'marcado' : ''}" data-acao="pagar-fatura" data-id="${c.id}"
                    ${c.valor > 0 || c.pago ? '' : 'disabled'}>
              ${ICONES.check}<span>${c.pago ? 'Paga' : 'Já paguei'}</span>
            </button>
            ${status && !c.pago ? `<span class="selo ${status.classe}">${status.texto}</span>` : ''}
            <span class="espaco"></span>
            <button class="btn-icone pequeno" data-acao="editar-cartao" data-id="${c.id}" title="Editar cartão">${ICONES.editar}</button>
            <button class="btn-icone pequeno perigo" data-acao="remover-cartao" data-id="${c.id}" title="Remover cartão">${ICONES.lixo}</button>
          </div>
        </div>
      </article>`;
  }).join('') + `
    <button class="cartao-novo" data-acao="add-cartao">
      <span class="mais">+</span>
      <strong>Adicionar cartão</strong>
      <small>Nubank, Banco do Brasil, Bradesco, Itaú, Inter, Caixa e outros</small>
    </button>`;
}

function cartaoVisual(c, extraClasse = '') {
  const est = estiloBanco(c.banco, c.banco_nome, c.cor);
  const claro = est.texto.toUpperCase() === '#FFFFFF';
  const bandeira = bandeiraPorId(c.bandeira);
  const nome = c.banco === 'outro' ? c.banco_nome : est.nome;
  return `
    <div class="cartao-visual ${extraClasse} ${claro ? '' : 'texto-escuro'}"
         style="--c1:${est.cor};--c2:${est.cor2};--ct:${est.texto}">
      <div class="cv-topo">
        ${emblemaSvg(est.desenho, 38)}
        <div class="cv-banco">
          <strong>${esc(nome)}</strong>
          <span>${esc(c.apelido || 'Cartão de crédito')}</span>
        </div>
        ${c.pago ? `<span class="cv-pago">${ICONES.check} PAGA</span>` : ''}
      </div>
      <div class="cv-meio">
        <div class="cv-chip"><span></span></div>
        <div class="cv-numero">•••• ${esc(c.final_cartao || '••••')}</div>
      </div>
      <div class="cv-rodape">
        <div><small>VENCE DIA</small><strong>${String(c.vencimento).padStart(2, '0')}</strong></div>
        <div class="cv-valor"><small>FATURA</small><strong>${brl.format(c.valor || 0)}</strong></div>
        <div class="cv-bandeira">${bandeira.svg(claro)}</div>
      </div>
    </div>`;
}

function categoria(id) {
  if (id === 'cartoes') return CATEGORIA_CARTOES;
  if (id === 'pix') return CATEGORIA_PIX;
  return CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1];
}

function renderContas(v) {
  const lista = $('#lista-contas');
  const n = v.contas.length;
  $('#contas-sub').textContent = n
    ? `${n} conta${n === 1 ? '' : 's'} · ${brl.format(v.resumo.total_contas)}`
    : 'Aluguel, luz, água, internet…';

  if (!n) {
    lista.innerHTML = `
      <div class="vazio">
        ${pixelSvg('saco', 40)}
        <p>Nenhuma outra conta em ${nomeMes(estado.mes).toLowerCase()}.</p>
        <button class="btn-secundario" data-acao="add-conta">Adicionar aluguel, luz, água…</button>
      </div>`;
    return;
  }

  lista.innerHTML = v.contas.map((c) => {
    const cat = categoria(c.categoria);
    const status = statusVencimento(c.vencimento, c.pago, c.valor);
    const detalhes = [
      cat.nome,
      c.vencimento ? `vence dia ${String(c.vencimento).padStart(2, '0')}` : 'sem dia fixo',
    ];
    return `
      <div class="conta-linha ${c.pago ? 'paga' : ''}">
        <button class="check ${c.pago ? 'marcado' : ''}" data-acao="pagar-conta" data-id="${c.id}"
                title="${c.pago ? 'Desmarcar pagamento' : 'Marcar como paga'}">${ICONES.check}</button>
        <div class="conta-icone" style="--cor:${cat.cor}">${cat.icone}</div>
        <div class="conta-info">
          <strong>${esc(c.nome)}</strong>
          <span>${esc(detalhes.join(' · '))}${c.fixa ? ` <em class="fixa" title="Repete nos próximos meses">${ICONES.repetir} fixa</em>` : ''}</span>
        </div>
        ${status && !c.pago ? `<span class="selo ${status.classe}">${status.texto}</span>` : ''}
        <div class="conta-valor">${brl.format(c.valor)}</div>
        <div class="conta-acoes">
          <button class="btn-icone pequeno" data-acao="editar-conta" data-id="${c.id}" title="Editar">${ICONES.editar}</button>
          <button class="btn-icone pequeno perigo" data-acao="remover-conta" data-id="${c.id}" title="Remover">${ICONES.lixo}</button>
        </div>
      </div>`;
  }).join('');
}

// ----- Pix -----

function chaveBancoPix(banco, nome) {
  return banco === 'outro' ? `outro:${String(nome).toLowerCase()}` : banco;
}

function nomeBancoPix(p) {
  return p.banco === 'outro' ? p.banco_nome : bancoPorId(p.banco).nome;
}

/** Bancos para o "saiu de qual banco": primeiro os dos seus cartões, depois o resto do catálogo. */
function opcoesBancoPix() {
  const vistos = new Set();
  const meus = [];
  const incluir = (banco, nome, cor) => {
    const chave = chaveBancoPix(banco, nome);
    if (!banco || vistos.has(chave)) return;
    vistos.add(chave);
    const preset = banco !== 'outro' ? bancoPorId(banco) : null;
    meus.push({ chave, banco, banco_nome: preset ? preset.nome : nome, cor: preset ? preset.cor : cor });
  };
  (estado.visao?.cartoes || []).forEach((c) => incluir(c.banco, c.banco_nome, c.cor));
  (estado.visao?.pix || []).forEach((p) => incluir(p.banco, p.banco_nome, p.cor));
  const outros = BANCOS.filter((b) => b.id !== 'outro' && !vistos.has(b.id))
    .map((b) => ({ chave: b.id, banco: b.id, banco_nome: b.nome, cor: b.cor }));
  return [meus, outros];
}

function bancoDaOpcao(chave) {
  const achado = opcoesBancoPix().flat().find((o) => o.chave === chave);
  return achado
    ? { banco: achado.banco, banco_nome: achado.banco_nome, cor: achado.cor }
    : { banco: '', banco_nome: '', cor: '' };
}

function preencherSelectBanco(select, valor) {
  const [meus, outros] = opcoesBancoPix();
  const opcao = (o) => `<option value="${esc(o.chave)}">${esc(o.banco_nome)}</option>`;
  select.innerHTML = '<option value="">Banco (opcional)</option>' +
    (meus.length ? `<optgroup label="Meus bancos">${meus.map(opcao).join('')}</optgroup>` : '') +
    `<optgroup label="Outros bancos">${outros.map(opcao).join('')}</optgroup>`;
  select.value = valor;
  if (select.value !== valor) select.value = '';
}

function renderPix(v) {
  const n = v.pix.length;
  $('#pix-sub').textContent = n
    ? `${n} Pix · total ${brl.format(v.resumo.total_pix)}`
    : 'Nenhum Pix anotado neste mês';

  // Total por banco de origem (aparece quando algum Pix tem banco informado).
  const porBanco = new Map();
  v.pix.forEach((p) => {
    const chave = p.banco ? chaveBancoPix(p.banco, p.banco_nome) : '';
    const item = porBanco.get(chave) || { p, total: 0 };
    item.total += p.valor;
    porBanco.set(chave, item);
  });
  const temBanco = [...porBanco.keys()].some((k) => k);
  $('#pix-por-banco').innerHTML = temBanco
    ? [...porBanco.values()].sort((a, b) => b.total - a.total).map(({ p, total }) => `
        <span class="chip-banco" title="${esc(p.banco ? nomeBancoPix(p) : 'Banco não informado')}">
          ${p.banco ? emblemaBanco(p.banco, p.banco_nome, p.cor, 20) : pixSvg(20)}${brl.format(total)}
        </span>`).join('')
    : '';

  // Formulário rápido: lista de bancos e dia de hoje como sugestão.
  const form = $('#form-pix');
  const select = $('#pix-banco');
  const valorSelect = form.dataset.iniciado ? select.value : (lerPreferencia('pix-banco') || '');
  preencherSelectBanco(select, valorSelect);
  form.dataset.iniciado = '1';
  if (form.dataset.mes !== estado.mes) {
    form.dataset.mes = estado.mes;
    $('#pix-dia').value = estado.mes === chaveMes(new Date()) ? new Date().getDate() : '';
  }

  const lista = $('#lista-pix');
  if (!n) {
    lista.innerHTML = `<div class="vazio pequeno"><p>Nenhum Pix em ${nomeMes(estado.mes).toLowerCase()} ainda. Use o formulário acima para anotar.</p></div>`;
    return;
  }
  lista.innerHTML = v.pix.map((p) => {
    const detalhes = [p.dia ? `dia ${String(p.dia).padStart(2, '0')}` : 'sem dia'];
    if (p.banco) detalhes.push(nomeBancoPix(p));
    return `
      <div class="conta-linha pix-linha">
        <div class="pix-origem">${p.banco ? emblemaBanco(p.banco, p.banco_nome, p.cor, 36) : pixSvg(36)}</div>
        <div class="conta-info">
          <strong>${esc(p.descricao)}</strong>
          <span>${esc(detalhes.join(' · '))}</span>
        </div>
        <div class="conta-valor">${brl.format(p.valor)}</div>
        <div class="conta-acoes">
          <button class="btn-icone pequeno" data-acao="editar-pix" data-id="${p.id}" title="Editar">${ICONES.editar}</button>
          <button class="btn-icone pequeno perigo" data-acao="remover-pix" data-id="${p.id}" title="Remover">${ICONES.lixo}</button>
        </div>
      </div>`;
  }).join('');
}

function renderGraficos(v) {
  const r = v.resumo;

  desenharPizza($('#graf-bancos'), r.por_banco.map((f) => {
    const [banco] = f.chave.split(':');
    const est = estiloBanco(banco, f.nome, f.cor);
    return { nome: f.nome, valor: f.valor, cor: est.cor, icone: emblemaSvg(est.desenho, 22) };
  }), {
    titulo: 'Gastos por banco',
    vazio: 'Digite o valor das faturas dos cartões para ver a divisão por banco.',
  });

  desenharPizza($('#graf-categorias'), r.por_categoria.map((f) => {
    const cat = categoria(f.chave);
    return { nome: cat.nome, valor: f.valor, cor: cat.cor, icone: `<span class="leg-emoji">${cat.icone}</span>` };
  }), {
    titulo: 'Gastos por categoria',
    vazio: 'Quando você lançar faturas e contas, a divisão por categoria aparece aqui.',
  });

  const elRenda = $('#graf-renda');
  if (r.renda <= 0) {
    desenharPizza(elRenda, [], { vazio: 'Informe sua renda lá no topo para ver quanto dela já está comprometido.' });
    return;
  }
  const fatias = [
    { nome: 'Já pago', valor: r.pago, cor: CORES_RENDA.pago },
    { nome: 'Falta pagar', valor: r.a_pagar, cor: CORES_RENDA.falta },
  ];
  if (r.sobra > 0) fatias.push({ nome: 'Livre (sobra)', valor: r.sobra, cor: CORES_RENDA.livre });
  const pct = r.comprometido ?? 0;
  desenharPizza(elRenda, fatias, {
    rosca: true,
    titulo: 'Renda comprometida',
    vazio: 'Nenhum gasto lançado ainda: sua renda está 100% livre.',
    centro: {
      valor: `${pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%`,
      rotulo: pct > 100 ? 'acima da renda!' : 'da renda',
      classe: pct > 100 ? 'negativo' : pct > 80 ? 'alerta' : '',
    },
  });
  if (r.sobra < 0) {
    elRenda.insertAdjacentHTML('beforeend',
      `<p class="aviso-excedeu">⚠️ Os gastos passam da renda em <strong>${brl.format(-r.sobra)}</strong>.</p>`);
  }
}

// ----- preservar o campo em edição quando a tela é redesenhada -----

function capturarFoco() {
  const el = document.activeElement;
  if (!el || !el.dataset || !el.dataset.chave) return null;
  return { chave: el.dataset.chave, valor: el.value, ini: el.selectionStart, fim: el.selectionEnd };
}

function restaurarFoco(foco) {
  if (!foco) return;
  const el = document.querySelector(`[data-chave="${foco.chave}"]`);
  if (!el) return;
  if (document.activeElement !== el) {
    el.value = foco.valor;
    el.dataset.restaurando = '1'; // não selecionar tudo de novo (o usuário pode estar digitando)
    el.focus();
  }
  try { el.setSelectionRange(foco.ini, foco.fim); } catch { /* sem seleção */ }
}

// ---------------------------------------------------------------------------
// Janelas (modais)
// ---------------------------------------------------------------------------

function abrirModal(html, aoMontar) {
  fecharModal();
  const raiz = $('#modal-raiz');
  raiz.innerHTML = `<div class="modal-fundo"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const fundo = raiz.firstElementChild;
  const modal = $('.modal', fundo);
  fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) fecharModal(); });
  $$('[data-fechar]', modal).forEach((b) => b.addEventListener('click', fecharModal));
  requestAnimationFrame(() => fundo.classList.add('aberto'));
  aoMontar?.(modal);
}

function fecharModal() {
  $('#modal-raiz').innerHTML = '';
}

function modalAberto() {
  return !!$('#modal-raiz .modal');
}

function cabecalhoModal(titulo) {
  return `<header class="modal-cab"><h3>${titulo}</h3>
    <button class="btn-icone" data-fechar aria-label="Fechar">${ICONES.fechar}</button></header>`;
}

function confirmar(titulo, mensagem, textoBotao = 'Remover') {
  return new Promise((resolver) => {
    abrirModal(`
      ${cabecalhoModal(titulo)}
      <div class="modal-corpo"><p class="texto-confirmacao">${mensagem}</p></div>
      <footer class="modal-rodape">
        <button class="btn-secundario" data-fechar>Cancelar</button>
        <button class="btn-perigo" id="confirmar-sim">${textoBotao}</button>
      </footer>`, (modal) => {
      const sim = $('#confirmar-sim', modal);
      sim.addEventListener('click', () => { fecharModal(); resolver(true); });
      $$('[data-fechar]', modal).forEach((b) => b.addEventListener('click', () => resolver(false)));
      sim.focus();
    });
  });
}

function modalCartao(cartao) {
  const editando = !!cartao;
  const sel = {
    banco: cartao?.banco || 'nubank',
    nomeOutro: cartao?.banco === 'outro' ? cartao.banco_nome : '',
    corOutro: cartao?.banco === 'outro' ? cartao.cor : '#475569',
    apelido: cartao?.apelido || '',
    bandeira: cartao?.bandeira ?? 'mastercard',
    final: cartao?.final_cartao || '',
    vencimento: cartao?.vencimento || 10,
  };

  abrirModal(`
    ${cabecalhoModal(editando ? 'Editar cartão' : 'Novo cartão')}
    <div class="modal-corpo">
      <div class="previa" id="mc-previa"></div>

      <span class="rotulo">Banco</span>
      <div class="grade-bancos">
        ${BANCOS.map((b) => `
          <button type="button" class="opcao-banco" data-banco="${b.id}" title="${b.nome}">
            ${b.desenho ? emblemaSvg(b.desenho, 34) : `<span class="emblema-mais">+</span>`}
            <span>${b.nome}</span>
          </button>`).join('')}
      </div>

      <div class="campos-outro" id="mc-outro">
        <label>Nome do banco<input id="mc-nome-outro" maxlength="40" placeholder="Ex.: Banco Pan, Neon, Will…"></label>
        <label class="campo-cor">Cor do cartão<input id="mc-cor-outro" type="color"></label>
      </div>

      <div class="linha-campos">
        <label>Apelido (opcional)<input id="mc-apelido" maxlength="40" placeholder="Ex.: Cartão principal"></label>
        <label>Final do cartão<input id="mc-final" maxlength="4" inputmode="numeric" placeholder="1234"></label>
        <label>Vence dia<input id="mc-venc" type="number" min="1" max="31"></label>
      </div>

      <span class="rotulo">Bandeira</span>
      <div class="grade-bandeiras">
        ${BANDEIRAS.map((b) => `
          <button type="button" class="opcao-bandeira" data-bandeira="${b.id}" title="${b.nome}">
            ${b.svg(false) || '<span class="sem-bandeira">?</span>'}<span>${b.nome}</span>
          </button>`).join('')}
      </div>
    </div>
    <footer class="modal-rodape">
      <button class="btn-secundario" data-fechar>Cancelar</button>
      <button class="btn-primario" id="mc-salvar">${editando ? 'Salvar alterações' : 'Adicionar cartão'}</button>
    </footer>`, (modal) => {
    const campo = (id) => $(id, modal);
    campo('#mc-nome-outro').value = sel.nomeOutro;
    campo('#mc-cor-outro').value = sel.corOutro;
    campo('#mc-apelido').value = sel.apelido;
    campo('#mc-final').value = sel.final;
    campo('#mc-venc').value = sel.vencimento;

    const montarCartao = () => {
      const b = bancoPorId(sel.banco);
      const outro = sel.banco === 'outro';
      return {
        banco: sel.banco,
        banco_nome: outro ? (campo('#mc-nome-outro').value.trim() || '') : b.nome,
        cor: outro ? campo('#mc-cor-outro').value : b.cor,
        apelido: campo('#mc-apelido').value.trim(),
        bandeira: sel.bandeira,
        final_cartao: campo('#mc-final').value.replace(/\D/g, '').slice(0, 4),
        vencimento: parseInt(campo('#mc-venc').value, 10) || 0,
      };
    };

    const atualizar = () => {
      $$('.opcao-banco', modal).forEach((b) => b.classList.toggle('ativo', b.dataset.banco === sel.banco));
      $$('.opcao-bandeira', modal).forEach((b) => b.classList.toggle('ativo', b.dataset.bandeira === sel.bandeira));
      campo('#mc-outro').classList.toggle('visivel', sel.banco === 'outro');
      const c = montarCartao();
      const previa = { ...c, banco_nome: c.banco_nome || 'Meu banco', valor: cartao?.valor || 0, pago: false,
        vencimento: c.vencimento || '--' };
      campo('#mc-previa').innerHTML = cartaoVisual(previa, 'grande');
    };

    $$('.opcao-banco', modal).forEach((b) => b.addEventListener('click', () => {
      sel.banco = b.dataset.banco;
      atualizar();
      if (sel.banco === 'outro') campo('#mc-nome-outro').focus();
    }));
    $$('.opcao-bandeira', modal).forEach((b) => b.addEventListener('click', () => {
      sel.bandeira = b.dataset.bandeira;
      atualizar();
    }));
    $$('input', modal).forEach((i) => i.addEventListener('input', atualizar));

    campo('#mc-salvar').addEventListener('click', async () => {
      const c = montarCartao();
      if (c.banco === 'outro' && !c.banco_nome) {
        toast('Digite o nome do banco.', 'erro');
        campo('#mc-nome-outro').focus();
        return;
      }
      if (c.vencimento < 1 || c.vencimento > 31) {
        toast('O dia de vencimento deve ser entre 1 e 31.', 'erro');
        campo('#mc-venc').focus();
        return;
      }
      const ok = editando
        ? await chamar('editar_cartao', { id: cartao.id, cartao: c })
        : await chamar('adicionar_cartao', { cartao: c });
      if (ok) {
        fecharModal();
        toast(editando ? 'Cartão atualizado.' : 'Cartão adicionado! Agora é só digitar a fatura.');
      }
    });

    atualizar();
  });
}

function modalConta(conta) {
  const editando = !!conta;
  let categoriaSel = conta?.categoria || 'moradia';

  abrirModal(`
    ${cabecalhoModal(editando ? 'Editar conta' : 'Nova conta do mês')}
    <div class="modal-corpo">
      ${editando ? '' : `
        <span class="rotulo">Atalhos</span>
        <div class="sugestoes">
          ${SUGESTOES_CONTA.map(([nome, cat]) => `<button type="button" class="chip" data-nome="${nome}" data-cat="${cat}">${categoria(cat).icone} ${nome}</button>`).join('')}
        </div>`}
      <label class="campo-largo">Nome da conta<input id="ct-nome" maxlength="60" placeholder="Ex.: Aluguel, Conta de luz"></label>

      <span class="rotulo">Categoria</span>
      <div class="grade-categorias">
        ${CATEGORIAS.map((c) => `
          <button type="button" class="opcao-categoria" data-cat="${c.id}" style="--cor:${c.cor}">
            <span class="cat-emoji">${c.icone}</span><span>${c.nome}</span>
          </button>`).join('')}
      </div>

      <div class="linha-campos">
        <label>Valor
          <div class="campo-dinheiro"><span>R$</span><input id="ct-valor" inputmode="decimal" autocomplete="off" placeholder="0,00"></div>
        </label>
        <label>Vence dia (opcional)<input id="ct-venc" type="number" min="1" max="31" placeholder="—"></label>
      </div>

      <label class="caixa-marcar">
        <input type="checkbox" id="ct-fixa">
        <span><strong>Conta fixa</strong> — repetir automaticamente nos próximos meses (aluguel, internet…)</span>
      </label>
    </div>
    <footer class="modal-rodape">
      <button class="btn-secundario" data-fechar>Cancelar</button>
      <button class="btn-primario" id="ct-salvar">${editando ? 'Salvar alterações' : 'Adicionar conta'}</button>
    </footer>`, (modal) => {
    const campo = (id) => $(id, modal);
    campo('#ct-nome').value = conta?.nome || '';
    campo('#ct-valor').value = conta ? valorCampo(conta.valor) : '';
    campo('#ct-venc').value = conta?.vencimento || '';
    campo('#ct-fixa').checked = conta ? conta.fixa : true;

    const marcarCategoria = () => {
      $$('.opcao-categoria', modal).forEach((b) => b.classList.toggle('ativo', b.dataset.cat === categoriaSel));
    };
    $$('.opcao-categoria', modal).forEach((b) => b.addEventListener('click', () => {
      categoriaSel = b.dataset.cat;
      marcarCategoria();
    }));
    $$('.chip', modal).forEach((b) => b.addEventListener('click', () => {
      campo('#ct-nome').value = b.dataset.nome;
      categoriaSel = b.dataset.cat;
      marcarCategoria();
      campo('#ct-valor').focus();
    }));

    const salvar = async () => {
      const dados = {
        nome: campo('#ct-nome').value.trim(),
        categoria: categoriaSel,
        valor: campo('#ct-valor').value,
        vencimento: parseInt(campo('#ct-venc').value, 10) || 0,
        fixa: campo('#ct-fixa').checked,
      };
      if (!dados.nome) {
        toast('Dê um nome para a conta.', 'erro');
        campo('#ct-nome').focus();
        return;
      }
      const ok = editando
        ? await chamar('editar_conta', { id: conta.id, conta: dados })
        : await chamar('adicionar_conta', { conta: dados });
      if (ok) {
        fecharModal();
        toast(editando ? 'Conta atualizada.' : 'Conta adicionada.');
      }
    };
    campo('#ct-salvar').addEventListener('click', salvar);
    $$('input:not([type=checkbox])', modal).forEach((i) => i.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') salvar();
    }));

    marcarCategoria();
    campo('#ct-nome').focus();
  });
}

function modalPix(pix) {
  abrirModal(`
    ${cabecalhoModal('Editar Pix')}
    <div class="modal-corpo">
      <label class="campo-largo">Pra quem / o quê<input id="mp-descricao" maxlength="60"></label>
      <div class="linha-campos campos-pix">
        <label>Valor
          <div class="campo-dinheiro"><span>R$</span><input id="mp-valor" inputmode="decimal" autocomplete="off" placeholder="0,00"></div>
        </label>
        <label>Dia<input id="mp-dia" type="number" min="1" max="31" placeholder="—"></label>
        <label>Saiu do banco<select id="mp-banco"></select></label>
      </div>
    </div>
    <footer class="modal-rodape">
      <button class="btn-secundario" data-fechar>Cancelar</button>
      <button class="btn-primario" id="mp-salvar">Salvar alterações</button>
    </footer>`, (modal) => {
    const campo = (id) => $(id, modal);
    campo('#mp-descricao').value = pix.descricao;
    campo('#mp-valor').value = valorCampo(pix.valor);
    campo('#mp-dia').value = pix.dia || '';
    preencherSelectBanco(campo('#mp-banco'), pix.banco ? chaveBancoPix(pix.banco, pix.banco_nome) : '');

    const salvar = async () => {
      const dados = {
        descricao: campo('#mp-descricao').value.trim(),
        valor: campo('#mp-valor').value,
        dia: parseInt(campo('#mp-dia').value, 10) || 0,
        ...bancoDaOpcao(campo('#mp-banco').value),
      };
      if (await chamar('editar_pix', { id: pix.id, pix: dados })) {
        fecharModal();
        toast('Pix atualizado.');
      }
    };
    campo('#mp-salvar').addEventListener('click', salvar);
    $$('input', modal).forEach((i) => i.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') salvar();
    }));
    campo('#mp-descricao').focus();
  });
}

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------

function toast(mensagem, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = mensagem;
  $('#toasts').append(el);
  setTimeout(() => el.classList.add('saindo'), tipo === 'erro' ? 4500 : 2800);
  setTimeout(() => el.remove(), tipo === 'erro' ? 5000 : 3300);
}

// ---------------------------------------------------------------------------
// Tema claro/escuro
// ---------------------------------------------------------------------------

function lerPreferencia(chave) {
  try { return localStorage.getItem(chave); } catch { return null; }
}

function gravarPreferencia(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento */ }
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

function cartaoPorId(id) {
  return estado.visao?.cartoes.find((c) => c.id === id);
}

function contaPorId(id) {
  return estado.visao?.contas.find((c) => c.id === id);
}

function pixPorId(id) {
  return estado.visao?.pix.find((p) => p.id === id);
}

document.addEventListener('click', async (e) => {
  const botao = e.target.closest('[data-acao]');
  if (!botao || botao.disabled) return;
  const id = Number(botao.dataset.id);
  switch (botao.dataset.acao) {
    case 'add-cartao':
      modalCartao(null);
      break;
    case 'add-conta':
      modalConta(null);
      break;
    case 'editar-cartao':
      modalCartao(cartaoPorId(id));
      break;
    case 'editar-conta':
      modalConta(contaPorId(id));
      break;
    case 'pagar-fatura':
      chamar('alternar_fatura_paga', { id });
      break;
    case 'pagar-conta':
      chamar('alternar_conta_paga', { id });
      break;
    case 'remover-cartao': {
      const c = cartaoPorId(id);
      const nome = esc(c?.apelido ? `${c.banco_nome} (${c.apelido})` : c?.banco_nome);
      if (await confirmar('Remover cartão',
        `Remover o cartão <strong>${nome}</strong> a partir de ${nomeMes(estado.mes).toLowerCase()}? ` +
        'Os meses anteriores continuam com o histórico.')) {
        if (await chamar('remover_cartao', { id })) toast('Cartão removido.');
      }
      break;
    }
    case 'remover-conta': {
      const c = contaPorId(id);
      if (await confirmar('Remover conta', `Remover <strong>${esc(c?.nome)}</strong> de ${nomeMes(estado.mes).toLowerCase()}?`)) {
        if (await chamar('remover_conta', { id })) toast('Conta removida.');
      }
      break;
    }
    case 'editar-pix':
      modalPix(pixPorId(id));
      break;
    case 'remover-pix': {
      const p = pixPorId(id);
      if (await confirmar('Remover Pix',
        `Remover o Pix <strong>${esc(p?.descricao)}</strong> de ${brl.format(p?.valor || 0)}?`)) {
        if (await chamar('remover_pix', { id })) toast('Pix removido.');
      }
      break;
    }
    default:
      break;
  }
});

// Campos de dinheiro: salva ao sair do campo (Tab, clique fora) ou com Enter.
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'renda') {
    salvarCampo(el, 'definir_renda', {});
  } else if (el.dataset.fatura) {
    salvarCampo(el, 'definir_fatura', { id: Number(el.dataset.fatura) });
  }
});

async function salvarCampo(el, comando, args) {
  const ok = await chamar(comando, { ...args, texto: el.value });
  el.classList.toggle('invalido', !ok);
}

document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (e.key === 'Enter' && (el.id === 'renda' || el.dataset?.fatura)) {
    el.blur();
    return;
  }
  if (e.key === 'Escape' && modalAberto()) {
    fecharModal();
    return;
  }
  if (e.altKey && !modalAberto() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    irParaMes(somarMeses(estado.mes, e.key === 'ArrowLeft' ? -1 : 1));
  }
});

document.addEventListener('focusin', (e) => {
  if (e.target.matches?.('.campo-dinheiro input')) {
    if (e.target.dataset.restaurando) {
      delete e.target.dataset.restaurando;
      return;
    }
    e.target.classList.remove('invalido');
    requestAnimationFrame(() => e.target.select());
  }
});

// Menu do botão direito do navegador não faz sentido num app de desktop.
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('input, textarea')) e.preventDefault();
});

// Formulário rápido de Pix: Enter em qualquer campo já adiciona.
$('#form-pix').addEventListener('submit', async (e) => {
  e.preventDefault();
  const descricao = $('#pix-descricao');
  const valor = $('#pix-valor');
  if (!descricao.value.trim()) {
    toast('Escreva pra quem ou para que foi o Pix.', 'erro');
    descricao.focus();
    return;
  }
  if (!valor.value.trim()) {
    toast('Digite o valor do Pix.', 'erro');
    valor.focus();
    return;
  }
  const chaveBanco = $('#pix-banco').value;
  const ok = await chamar('adicionar_pix', {
    pix: {
      descricao: descricao.value.trim(),
      valor: valor.value,
      dia: parseInt($('#pix-dia').value, 10) || 0,
      ...bancoDaOpcao(chaveBanco),
    },
  });
  valor.classList.toggle('invalido', !ok);
  if (ok) {
    gravarPreferencia('pix-banco', chaveBanco);
    descricao.value = '';
    valor.value = '';
    descricao.focus();
    toast('Pix anotado.');
  }
});

$('#pix-icone-titulo').innerHTML = pixSvg(38);

$('#mes-anterior').addEventListener('click', () => irParaMes(somarMeses(estado.mes, -1)));
$('#mes-proximo').addEventListener('click', () => irParaMes(somarMeses(estado.mes, 1)));
$('#mes-hoje').addEventListener('click', () => irParaMes(chaveMes(new Date())));

// ---------------------------------------------------------------------------
// Início
// ---------------------------------------------------------------------------

$('#marca-icone').innerHTML = pixelSvg('moeda', 42);
$$('[data-pixel]').forEach((el) => { el.innerHTML = pixelSvg(el.dataset.pixel, 26); });
renderTopo();
chamar('carregar');
