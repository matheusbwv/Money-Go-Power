# Minhas Finanças

Programa para Windows que soma as faturas dos cartões e as contas do mês, mostra
quanto já foi pago, quanto falta e quanto sobra da renda, com gráficos de pizza.

**Abrir:** dê dois cliques em `MinhasFinancas.exe`.

## Como usar

1. **Renda do mês** (no topo): digite seu salário + extras. Pode digitar somas: `3500+800`.
2. **Meus cartões**: já vem com **Nubank**, **Banco do Brasil** e **Bradesco**. Digite o
   valor da fatura de cada um e aperte `Enter` ou `Tab`. Também aceita somas:
   `350+89,90+120` (o programa soma para você).
3. **+ Adicionar cartão**: escolha entre Nubank, Banco do Brasil, Bradesco, Itaú,
   Santander, Caixa, Inter, C6 Bank, PicPay, Mercado Pago, Sicoob, Sicredi, BTG, XP,
   Banrisul ou **Outro banco** (você escolhe o nome e a cor). Dá para escolher a bandeira
   (Visa, Mastercard, Elo, Amex, Hipercard), o final do cartão e o dia do vencimento.
4. **Outras contas do mês**: aluguel, luz, água, internet... Marque **Conta fixa** para
   ela aparecer sozinha nos próximos meses.
5. **Gastos no Pix**: anote cada Pix do mês (pra quem, valor, dia e, se quiser, de qual
   banco saiu) e aperte `Enter`. O Pix entra no total e já conta como pago, porque o
   dinheiro já saiu. No topo do painel aparece quanto saiu no Pix de cada banco.
6. Clique em **Marcar como paga** (cartões) ou na bolinha ✓ (contas) quando pagar.
7. Use as setas no topo (ou `Alt + ←/→`) para trocar de mês. Um mês novo já começa com a
   renda e as contas fixas do mês anterior; as faturas e os Pix começam zerados.

### Os resumos

| Quadro | O que mostra |
| --- | --- |
| Total do mês | Soma de todas as faturas + contas + Pix |
| Já pago / Falta pagar | Separado pelo que você marcou como pago (Pix sempre conta como pago) |
| Sobra no mês | Renda − total do mês (fica vermelho se faltar dinheiro) |

### Os gráficos de pizza

- **Gastos por banco** — faturas dos cartões nas cores de cada banco (roxo Nubank, amarelo BB, vermelho Bradesco...).
- **Gastos por categoria** — cartões, Pix, moradia, mercado, luz, etc.
- **Quanto da renda está comprometido** — já pago, falta pagar e o que sobra livre.

Os cartões vencendo em até 5 dias ganham um aviso amarelo, e os atrasados, vermelho.

## Onde ficam os dados

Só no seu computador, em
`%APPDATA%\com.matheus.minhasfinancas\financas.json` (o caminho aparece no rodapé do
programa). Para fazer backup, é só copiar esse arquivo.

## Como o projeto é feito

- **Rust + [Tauri 2](https://tauri.app)**: o Rust faz todos os cálculos (em centavos, sem
  erro de arredondamento), entende os valores digitados (`1.234,56`, `100+49,90`...),
  valida tudo e salva o arquivo de dados.
- **HTML + CSS + JavaScript** na interface (pasta `ui/`), com os gráficos de pizza e os
  emblemas dos bancos desenhados em SVG, sem depender de internet.

```
src/main.rs      janela, comandos chamados pela interface e salvamento
src/dados.rs     regras, cálculos, leitura de valores e testes
ui/index.html    estrutura da tela
ui/style.css     visual (tema claro e escuro)
ui/app.js        comportamento da tela
ui/bancos.js     bancos, cores, emblemas e bandeiras de cartão
ui/graficos.js   gráficos de pizza
icons/           ícone do programa
```

Os emblemas dos bancos são desenhos simplificados inspirados nas cores e símbolos de
cada banco, não os logotipos oficiais.

## Compilar de novo (depois de mudar o código)

Precisa do Rust (rustup) e do Visual Studio Build Tools com C++ (já instalados neste PC).

```powershell
powershell -ExecutionPolicy Bypass -File .\compilar.ps1
```

O script roda os testes, compila e copia o `MinhasFinancas.exe` para esta pasta. Os
arquivos temporários da compilação ficam fora do OneDrive, em
`%LOCALAPPDATA%\MinhasFinancas-build` (definido em `.cargo/config.toml`).
