// Deixa o Minhas Finanças abrir sem internet: guarda os arquivos do app no aparelho.
// VERSAO e ARQUIVOS são preenchidos pelo ferramentas/montar_web.js.
const VERSAO = '__VERSAO__';
const ARQUIVOS = __ARQUIVOS__;
const CACHE = `minhas-financas-${VERSAO}`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS.map((a) => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Primeiro o que está guardado; se não tiver, busca na internet.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
