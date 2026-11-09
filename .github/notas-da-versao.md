**Para usar:** baixe o `MinhasFinancas.exe` aqui embaixo, em *Assets*, e dê dois cliques. É o programa completo, num arquivo só: não precisa instalar nada nem baixar mais nada.

Se aparecer "O Windows protegeu o computador", clique em **Mais informações** e depois em **Executar assim mesmo**.

Seus dados ficam só no seu computador. Para atualizar no futuro, é só trocar o `.exe`.

---

## Mudanças técnicas da 1.0.1

Os dados da 1.0.0 continuam abrindo sem mudança nenhuma: o formato do `financas.json` e a pasta onde ele fica são os mesmos.

### Interface

- **Tema novo** ("porão roguelike"): `ui/style.css` reescrito com variáveis de cor, textura de papel gerada por SVG `feTurbulence` em *data URI*, bordas irregulares com `border-radius` assimétrico e as fontes *Ink Free* e *Segoe Print*, que já vêm no Windows. Nada é baixado da internet.
- **Pixel art em SVG** (`ui/pixel.js`): cada desenho é um mapa de caracteres convertido em `<rect>` agrupados por linha, com `shape-rendering="crispEdges"`.
- **Itens das categorias:** os emojis das 12 categorias e dos cartões foram trocados por itens em pixel art. Emoji depende da fonte de emoji instalada; o SVG aparece igual em qualquer máquina.
- **Contador de moedas** no topo, com a sobra do mês, no lugar do botão de tema claro ou escuro. Os quadros do resumo ganharam ícones, e o coração parte quando a sobra fica negativa.
- **Ícone do programa** refeito a partir da mesma pixel art pelo `ferramentas/gerar_imagens.js`, que escreve PNG e ICO em Node puro, com zlib.

### Correções

- **Bandeiras:** VISA, AMEX e Hipercard ficavam abaixo do centro do cartão (`dominant-baseline: central` no WebView2). Agora a linha de base é posicionada pela altura das maiúsculas.
- **Títulos:** o sublinhado ondulado parecia marca do corretor ortográfico. Virou traço de pincel em SVG com `vector-effect: non-scaling-stroke`, e a página ganhou `spellcheck="false"`.
- **Gráfico de rosca:** o `filter: drop-shadow` no SVG inteiro duplicava o texto do meio. A sombra agora é uma forma desenhada atrás das fatias.
- **Botão "Já paguei":** não fica mais com texto verde sobre fundo verde ao passar o mouse num cartão já pago.
- **Emblemas** do Banco do Brasil e do Bradesco redesenhados com `<path>` SVG.

### Privacidade

- **Caminho dos dados:** a tela não mostra mais o caminho do arquivo de dados (que inclui o nome do usuário do Windows). O campo `arquivo` saiu da struct `Visao`, então o backend nem envia mais esse caminho para a interface.

### Compilação e publicação

- **Versão** `1.0.1` no `Cargo.toml` e no `tauri.conf.json`, que também aparece nas propriedades do `.exe`.
- **Release automática** com GitHub Actions: `cargo test --release --locked`, depois `cargo build --release --locked` no Windows, e a release é criada ou atualizada com o `.exe`.
- **`.cargo/config.toml`** com caminhos deste computador saiu do Git.

Histórico completo em [CHANGELOG.md](https://github.com/matheusbwv/Money-Go-Power/blob/main/CHANGELOG.md).
