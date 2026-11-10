// Monta a versão de celular (site que vira app na tela de início) em web/dist:
//   1. compila o núcleo em Rust para WebAssembly (web/ → nucleo.wasm);
//   2. copia a interface (ui/), o manifesto e os ícones (web/publico/);
//   3. coloca no index.html as marcações de app de celular;
//   4. gera o sw.js com a lista de arquivos para funcionar sem internet.
//
// Uso:
//   node ferramentas/montar_web.js            só monta
//   node ferramentas/montar_web.js --servir   monta e abre em http://localhost:8080
//
// Precisa do Rust com o alvo WebAssembly: rustup target add wasm32-unknown-unknown

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const { execFileSync } = require('child_process');

// Usa o cargo do rustup (~/.cargo/bin) mesmo quando ele não está no PATH.
const cargoRustup = path.join(os.homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'cargo.exe' : 'cargo');
const cargo = process.env.CARGO || (fs.existsSync(cargoRustup) ? cargoRustup : 'cargo');

const raiz = path.join(__dirname, '..');
const pastaWeb = path.join(raiz, 'web');
const destino = path.join(pastaWeb, 'dist');

// ---------- 1. WebAssembly ----------
const manifesto = path.join(pastaWeb, 'Cargo.toml');
execFileSync(cargo, ['build', '--release', '--locked', '--target', 'wasm32-unknown-unknown', '--manifest-path', manifesto],
  { stdio: 'inherit' });
const meta = JSON.parse(execFileSync(cargo, ['metadata', '--format-version', '1', '--no-deps', '--manifest-path', manifesto],
  { encoding: 'utf8' }));
const wasm = path.join(meta.target_directory, 'wasm32-unknown-unknown', 'release', 'minhas_financas_web.wasm');

// ---------- 2. Arquivos ----------
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
fs.cpSync(path.join(raiz, 'ui'), destino, { recursive: true });
fs.cpSync(path.join(pastaWeb, 'publico'), destino, { recursive: true });
fs.copyFileSync(wasm, path.join(destino, 'nucleo.wasm'));

// ---------- 3. index.html de app de celular ----------
const cabecalho = `<meta name="theme-color" content="#0E0805">
  <meta name="description" content="Faturas, contas e Pix do mês, já somados.">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" type="image/png" href="icones/icone-192.png">
  <link rel="apple-touch-icon" href="icones/icone-180.png">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Finanças">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`;
const arquivoIndex = path.join(destino, 'index.html');
const index = fs.readFileSync(arquivoIndex, 'utf8');
const marcador = /<!-- web:cabecalho[^>]*-->/;
if (!marcador.test(index)) throw new Error('ui/index.html sem o marcador <!-- web:cabecalho -->');
fs.writeFileSync(arquivoIndex, index.replace(marcador, cabecalho));

// ---------- 4. sw.js ----------
function listar(pasta, base = '') {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    return e.isDirectory() ? listar(path.join(pasta, e.name), rel) : [rel];
  });
}
const arquivos = listar(destino).sort();
const hash = crypto.createHash('sha256');
arquivos.forEach((a) => hash.update(a).update(fs.readFileSync(path.join(destino, a))));
const versao = hash.digest('hex').slice(0, 12);
const sw = fs.readFileSync(path.join(pastaWeb, 'sw.js'), 'utf8')
  .replace('__VERSAO__', versao)
  .replace('__ARQUIVOS__', JSON.stringify(['./', ...arquivos.map((a) => `./${a}`)], null, 2));
fs.writeFileSync(path.join(destino, 'sw.js'), sw);

const total = arquivos.reduce((s, a) => s + fs.statSync(path.join(destino, a)).size, 0);
console.log(`Versão de celular montada em web/dist (${arquivos.length + 1} arquivos, ${(total / 1024).toFixed(0)} KB, versão ${versao})`);

// ---------- --servir ----------
if (process.argv.includes('--servir')) {
  const tipos = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.wasm': 'application/wasm', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json', '.json': 'application/json',
  };
  const porta = Number(process.env.PORTA) || 8080;
  http.createServer((req, res) => {
    const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const arquivo = path.join(destino, caminho.endsWith('/') ? `${caminho}index.html` : caminho);
    if (!arquivo.startsWith(destino) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404).end('não encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(arquivo).pipe(res);
  }).listen(porta, '127.0.0.1', () => console.log(`Abra http://localhost:${porta}/`));
}
