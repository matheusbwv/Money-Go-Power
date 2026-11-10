# Mudanças

## Ainda não lançado

### Versão de celular (iPhone e Android)

- **App de celular** instalável pela tela de início (PWA), publicado no GitHub Pages pelo
  workflow `.github/workflows/pages.yml`.
- **Mesmo núcleo em Rust:** `web/src/lib.rs` inclui o `src/dados.rs` e é compilado para
  `wasm32-unknown-unknown`, sem wasm-bindgen. A página conversa com ele por JSON, usando
  memória compartilhada (`reservar`, `chamar`, `liberar`).
- **`ui/plataforma.js`:** escolhe entre o Tauri (Windows) e o WebAssembly (navegador). No
  navegador, cada alteração devolve o JSON completo, que é gravado no `localStorage`; se a
  gravação falhar, os dados voltam para o último estado salvo.
- **Backup** (botão do baú, só no celular): salva e restaura o `financas.json` no mesmo
  formato do Windows. Um arquivo inválido é recusado sem mexer em nada.
- **Sem internet:** um service worker guarda os arquivos do app, com versão calculada pelo
  conteúdo em `ferramentas/montar_web.js`.
- **Layout para telas de até 720 px:** topo em duas linhas, resumo em 2 × 2, uma coluna,
  linhas de conta em grade, janelas na largura da tela e margens seguras do iPhone
  (`env(safe-area-inset-*)`).
- **Fontes:** no iPhone entram a Chalkboard SE e a Noteworthy, que já vêm no aparelho.
- **Ícones** de tela de início (180, 192, 512 e maskable) gerados pelo
  `ferramentas/gerar_imagens.js`.

### Correções

- **Plural:** "3 cartãoes" agora aparece como "3 cartões".

## 1.0.1

Primeira versão publicada para download. Os dados da 1.0.0 continuam abrindo sem mudança
nenhuma: o formato do `financas.json` e a pasta onde ele fica são os mesmos.

### Interface

- **Tema novo** ("porão roguelike"): `ui/style.css` reescrito com variáveis de cor
  (`--papel`, `--tinta`, `--sangue`, `--ouro`, `--musgo`, `--pix`), textura de papel gerada
  por SVG `feTurbulence` em *data URI*, bordas irregulares com `border-radius` assimétrico
  e as fontes *Ink Free* e *Segoe Print*, que já vêm no Windows. Nada é baixado da
  internet.
- **Pixel art em SVG** (`ui/pixel.js`): cada desenho é um mapa de caracteres convertido em
  `<rect>` agrupados por linha, com `shape-rendering="crispEdges"` para os pixels ficarem
  nítidos em qualquer escala.
- **Itens das categorias:** os emojis das 12 categorias e dos cartões foram trocados por
  itens em pixel art (casinha, lâmpada, gota, sinal, maçã, carrinho, cápsula, livro, dado,
  TV, baú, caixa e cartão). Emoji depende da fonte de emoji do Windows instalada; o SVG
  aparece igual em qualquer máquina.
- **Contador de moedas** no topo, com a sobra do mês, no lugar do botão de tema claro ou
  escuro. Os quadros do resumo ganharam ícones: moeda, saco, check, caveira e um coração
  que parte quando a sobra fica negativa.
- **Ícone do programa** refeito a partir da mesma pixel art pelo
  `ferramentas/gerar_imagens.js`, que escreve o PNG e o ICO direto em Node, com zlib e sem
  dependências.

### Correções

- **Bandeiras:** VISA, AMEX e Hipercard ficavam abaixo do centro do cartão. O texto usava
  `dominant-baseline: central`, que o WebView2 calcula diferente; agora a linha de base é
  posicionada pela altura das letras maiúsculas.
- **Títulos:** o sublinhado ondulado parecia marca de erro do corretor ortográfico. Virou
  um traço de pincel em SVG com `vector-effect: non-scaling-stroke`, e a página ganhou
  `spellcheck="false"`.
- **Gráfico de rosca:** a sombra era um `filter: drop-shadow` aplicado no SVG inteiro e
  duplicava o texto do meio. Agora é uma forma escura desenhada atrás das fatias, em
  `ui/graficos.js`.
- **Botão "Já paguei":** o texto ficava verde sobre fundo verde ao passar o mouse num
  cartão já pago (`:not(.marcado)` no `:hover`).
- **Emblemas** do Banco do Brasil e do Bradesco redesenhados com `<path>` SVG, com
  proporções medidas a partir de imagens de referência das marcas.

### Privacidade

- **Caminho dos dados:** a tela não mostra mais o caminho do arquivo de dados (que inclui o
  nome do usuário do Windows). O campo `arquivo` saiu da struct `Visao`, então o backend em
  Rust nem envia mais esse caminho para a interface.

### Compilação e publicação

- **Versão** `1.0.1` no `Cargo.toml` e no `tauri.conf.json`, que também aparece nas
  propriedades do `.exe`.
- **Release automática** com GitHub Actions (`.github/workflows/release.yml`): no Windows,
  roda `cargo test --release --locked`, compila com `cargo build --release --locked` e cria
  ou atualiza a release com o `.exe`.
- **`.cargo/config.toml`** (pasta de build deste computador) saiu do Git; o README explica
  como criar o seu.

## 1.0.0

- **Faturas de cartão:** Nubank, Banco do Brasil e Bradesco já vêm na tela, e há mais 13
  opções de banco no catálogo. Cada cartão tem bandeira, final e vencimento.
- **Contas do mês** com categoria e conta fixa.
- **Gastos no Pix**, com total por banco.
- **Três gráficos de pizza:** por banco, por categoria e quanto da renda está comprometido.
- **Valores em centavos** (`i64`): campos que aceitam somas no formato brasileiro, como
  `350+89,90`.
- **Dados salvos em JSON** a cada alteração, gravados primeiro num arquivo temporário e
  depois renomeados. Se o arquivo estiver danificado, ele é guardado à parte em vez de ser
  apagado.
- **Mês novo** já começa com a renda e as contas fixas do mês anterior.
