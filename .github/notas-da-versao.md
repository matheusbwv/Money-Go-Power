Primeira versão do **Minhas Finanças**: soma as faturas dos cartões, as contas e os Pix do mês e
mostra quanto já foi pago, quanto falta e quanto sobra da renda, com gráficos de pizza.

## Como baixar e usar

1. Baixe o **`MinhasFinancas.exe`** aqui embaixo, em *Assets*.
2. Coloque o arquivo onde preferir (Área de Trabalho, Documentos...) e dê dois cliques.
   Não precisa instalar nada.

Funciona no **Windows 10 e 11 (64 bits)**. O programa usa o WebView2 da Microsoft, que já vem
no Windows 11 e chega pelas atualizações do Windows 10. Se não abrir no seu, instale o
[WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/).

### "O Windows protegeu o computador"

O `.exe` não tem assinatura digital paga, então o Windows pode avisar na primeira vez.
Clique em **Mais informações** e depois em **Executar assim mesmo**. Se quiser conferir se o
arquivo é exatamente o que foi publicado aqui, o SHA-256 dele é:

```
{{SHA256}}
```

(no PowerShell: `Get-FileHash .\MinhasFinancas.exe`)

## Onde ficam os seus dados

Só no seu computador, num arquivo `.json` em
`%APPDATA%\com.matheus.minhasfinancas\financas.json`. Cada pessoa que baixar tem o seu
próprio arquivo, e o programa não envia nada para a internet. O arquivo é gravado a cada
alteração; para fazer backup, é só copiar esse arquivo.

Para atualizar para uma versão nova no futuro, é só trocar o `.exe`: os dados continuam
no mesmo lugar.

## O que tem nesta versão

- Faturas dos cartões: Nubank, Banco do Brasil e Bradesco já vêm na tela, e dá para
  adicionar Itaú, Santander, Caixa, Inter, C6 Bank, PicPay, Mercado Pago, Sicoob, Sicredi,
  BTG, XP, Banrisul ou outro banco com nome e cor à sua escolha.
- Bandeiras Visa, Mastercard, Elo, Amex e Hipercard, final do cartão e dia do vencimento.
- Campos que aceitam somas: digite `350+89,90+120` e o programa soma.
- Outras contas do mês (aluguel, luz, água...), com contas fixas que se repetem todo mês.
- Gastos no Pix do mês, com o total de Pix de cada banco.
- Gráficos de pizza por banco, por categoria e de quanto da renda está comprometido.
- Carimbo nos cartões e contas que vencem em até 5 dias ou já estão atrasados.
- Navegação entre os meses: um mês novo já começa com a renda e as contas fixas.
