'use strict';
/*
 * Escolhe onde rodam as contas do Minhas Finanças:
 *  - no programa de Windows (Tauri), chama o Rust do próprio .exe;
 *  - no navegador / celular, carrega o mesmo Rust compilado em WebAssembly
 *    (nucleo.wasm) e guarda os dados no armazenamento do aparelho.
 * O app.js só usa window.plataforma.invoke(comando, args), igual nos dois casos.
 */

(function () {
  const tauri = window.__TAURI__?.core?.invoke;
  if (tauri) {
    window.plataforma = { tipo: 'desktop', invoke: tauri };
    return;
  }

  const CHAVE = 'minhas-financas:dados';
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  let nucleo = null;
  let salvoAntes = null; // último JSON gravado com sucesso

  function ler(chave) {
    try { return localStorage.getItem(chave); } catch { return null; }
  }

  function gravar(chave, valor) {
    try {
      localStorage.setItem(chave, valor);
      return true;
    } catch {
      return false;
    }
  }

  /** Manda um pedido em JSON para o Rust e devolve a resposta já convertida. */
  function pedir(comando, args) {
    const x = nucleo;
    const bytes = enc.encode(JSON.stringify({ comando, args }));
    const p = x.reservar(bytes.length);
    new Uint8Array(x.memory.buffer, p, bytes.length).set(bytes);
    let r;
    try {
      r = x.chamar(p, bytes.length);
    } finally {
      x.liberar(p, bytes.length);
    }
    const rp = Number(r >> 32n);
    const rn = Number(r & 0xffffffffn);
    const texto = dec.decode(new Uint8Array(x.memory.buffer, rp, rn));
    x.liberar(rp, rn);
    return JSON.parse(texto);
  }

  async function iniciar() {
    const resposta = await fetch('nucleo.wasm');
    if (!resposta.ok) throw new Error('não encontrei o nucleo.wasm');
    const { instance } = await WebAssembly.instantiate(await resposta.arrayBuffer(), {});
    nucleo = instance.exports;

    const guardado = ler(CHAVE);
    const r = pedir('abrir', { json: guardado });
    if (r.erro) throw new Error(r.erro);
    if (r.danificado) {
      // Igual ao Windows: não apaga o que estava salvo, guarda uma cópia à parte.
      gravar(`minhas-financas:danificado-${Date.now()}`, guardado);
    }
    salvoAntes = guardado ?? null;

    // Pede ao navegador para não apagar os dados sozinho quando faltar espaço.
    navigator.storage?.persist?.().catch(() => {});
  }

  const pronto = iniciar();

  /** Grava o novo JSON; se não der, volta os dados para o último salvo. */
  function salvar(json) {
    if (gravar(CHAVE, json)) {
      salvoAntes = json;
      return;
    }
    pedir('abrir', { json: salvoAntes });
    throw 'Não foi possível salvar no aparelho (armazenamento cheio ou bloqueado).';
  }

  async function invoke(comando, args = {}) {
    try {
      await pronto;
    } catch (e) {
      throw `Não consegui iniciar o programa: ${e?.message || e}`;
    }
    const r = pedir(comando, args);
    if (r.erro) throw r.erro;
    if (typeof r.salvar === 'string') salvar(r.salvar);
    return r.ok;
  }

  /** Backup: o JSON atual, no mesmo formato do financas.json do Windows. */
  async function exportar() {
    await pronto;
    return pedir('exportar', {}).ok;
  }

  /** Restaura um backup. Se o arquivo não servir, nada muda. */
  async function importar(texto) {
    await pronto;
    const r = pedir('abrir', { json: texto, restaurar: true });
    if (r.erro) {
      pedir('abrir', { json: salvoAntes });
      throw r.erro;
    }
    salvar(r.salvar);
  }

  window.plataforma = { tipo: 'web', invoke, exportar, importar };

  // Funciona sem internet depois da primeira visita (só no site publicado, com https).
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
