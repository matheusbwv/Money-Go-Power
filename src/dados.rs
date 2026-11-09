//! Modelo de dados, regras e cálculos do controle financeiro.
//!
//! Todo dinheiro é guardado em CENTAVOS (i64) para que as somas sejam exatas
//! (sem os erros de arredondamento de números com vírgula flutuante).

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::ops::Bound::{Excluded, Included, Unbounded};

/// Maior valor aceito: R$ 1 bilhão.
const LIMITE_CENTAVOS: i64 = 100_000_000_000;

fn versao_atual() -> u32 {
    1
}

fn dia_padrao() -> u8 {
    10
}

// ---------------------------------------------------------------------------
// Dados salvos em disco
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Dados {
    #[serde(default = "versao_atual")]
    pub versao: u32,
    #[serde(default)]
    pub proximo_id: u64,
    #[serde(default)]
    pub cartoes: Vec<Cartao>,
    /// Chave no formato "AAAA-MM" (ex.: "2026-11").
    #[serde(default)]
    pub meses: BTreeMap<String, Mes>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Cartao {
    pub id: u64,
    /// Identificador do banco no catálogo da interface ("nubank", "bb", "outro"...).
    pub banco: String,
    pub banco_nome: String,
    /// Cor principal no formato #RRGGBB.
    pub cor: String,
    #[serde(default)]
    pub apelido: String,
    /// Bandeira do cartão: "visa", "mastercard", "elo"...
    #[serde(default)]
    pub bandeira: String,
    #[serde(default)]
    pub final_cartao: String,
    #[serde(default = "dia_padrao")]
    pub vencimento: u8,
    /// Cartão removido que ainda aparece no histórico dos meses em que teve fatura.
    #[serde(default)]
    pub removido: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
pub struct Mes {
    #[serde(default)]
    pub renda: i64,
    /// Fatura de cada cartão neste mês (chave = id do cartão).
    #[serde(default)]
    pub faturas: BTreeMap<u64, Fatura>,
    #[serde(default)]
    pub contas: Vec<Conta>,
    /// Gastos feitos no Pix (já saíram da conta, então contam como pagos).
    #[serde(default)]
    pub pix: Vec<Pix>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Pix {
    pub id: u64,
    pub descricao: String,
    pub valor: i64,
    /// Dia do mês em que o Pix foi feito (0 = não informado).
    #[serde(default)]
    pub dia: u8,
    /// Banco de onde saiu o dinheiro (vazio = não informado).
    #[serde(default)]
    pub banco: String,
    #[serde(default)]
    pub banco_nome: String,
    #[serde(default)]
    pub cor: String,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, Default, PartialEq)]
pub struct Fatura {
    pub valor: i64,
    #[serde(default)]
    pub pago: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Conta {
    pub id: u64,
    pub nome: String,
    pub categoria: String,
    pub valor: i64,
    /// Dia do vencimento (0 = sem dia definido).
    #[serde(default)]
    pub vencimento: u8,
    #[serde(default)]
    pub pago: bool,
    /// Conta fixa é copiada automaticamente para os meses seguintes.
    #[serde(default)]
    pub fixa: bool,
}

// ---------------------------------------------------------------------------
// O que chega da interface
// ---------------------------------------------------------------------------

#[derive(Deserialize, Debug, Clone)]
pub struct NovoCartao {
    pub banco: String,
    pub banco_nome: String,
    pub cor: String,
    #[serde(default)]
    pub apelido: String,
    #[serde(default)]
    pub bandeira: String,
    #[serde(default)]
    pub final_cartao: String,
    pub vencimento: u8,
}

#[derive(Deserialize, Debug, Clone)]
pub struct NovaConta {
    pub nome: String,
    pub categoria: String,
    /// Texto digitado pelo usuário; aceita somas como "100 + 49,90".
    pub valor: String,
    #[serde(default)]
    pub vencimento: u8,
    #[serde(default)]
    pub fixa: bool,
}

#[derive(Deserialize, Debug, Clone)]
pub struct NovoPix {
    pub descricao: String,
    /// Texto digitado pelo usuário; aceita somas como "30 + 12,50".
    pub valor: String,
    #[serde(default)]
    pub dia: u8,
    #[serde(default)]
    pub banco: String,
    #[serde(default)]
    pub banco_nome: String,
    #[serde(default)]
    pub cor: String,
}

// ---------------------------------------------------------------------------
// O que vai para a interface (valores em reais)
// ---------------------------------------------------------------------------

#[derive(Serialize, Debug)]
pub struct Visao {
    pub mes: String,
    pub cartoes: Vec<CartaoVisao>,
    pub contas: Vec<ContaVisao>,
    pub pix: Vec<PixVisao>,
    pub resumo: Resumo,
    pub arquivo: String,
}

#[derive(Serialize, Debug)]
pub struct PixVisao {
    pub id: u64,
    pub descricao: String,
    pub valor: f64,
    pub dia: u8,
    pub banco: String,
    pub banco_nome: String,
    pub cor: String,
}

#[derive(Serialize, Debug)]
pub struct CartaoVisao {
    #[serde(flatten)]
    pub cartao: Cartao,
    pub valor: f64,
    pub pago: bool,
}

#[derive(Serialize, Debug)]
pub struct ContaVisao {
    pub id: u64,
    pub nome: String,
    pub categoria: String,
    pub valor: f64,
    pub vencimento: u8,
    pub pago: bool,
    pub fixa: bool,
}

#[derive(Serialize, Debug, Default)]
pub struct Resumo {
    pub renda: f64,
    pub total_cartoes: f64,
    pub total_contas: f64,
    pub total_pix: f64,
    pub total: f64,
    pub pago: f64,
    pub a_pagar: f64,
    /// Renda menos o total do mês (negativo = faltou dinheiro).
    pub sobra: f64,
    /// Percentual da renda usado pelos gastos (None quando a renda é zero).
    pub comprometido: Option<f64>,
    pub pendentes: u32,
    pub por_banco: Vec<Fatia>,
    pub por_categoria: Vec<Fatia>,
}

#[derive(Serialize, Debug, Clone, PartialEq)]
pub struct Fatia {
    pub chave: String,
    pub nome: String,
    pub cor: String,
    pub valor: f64,
}

fn reais(centavos: i64) -> f64 {
    centavos as f64 / 100.0
}

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------

impl Dados {
    /// Dados do primeiro uso: já vem com os cartões Nubank, Banco do Brasil e Bradesco.
    pub fn inicial() -> Self {
        let mut d = Dados {
            versao: versao_atual(),
            proximo_id: 0,
            cartoes: Vec::new(),
            meses: BTreeMap::new(),
        };
        let padrao = [
            ("nubank", "Nubank", "#820AD1", "mastercard"),
            ("bb", "Banco do Brasil", "#FBD71E", "visa"),
            ("bradesco", "Bradesco", "#CC092F", "visa"),
        ];
        for (banco, nome, cor, bandeira) in padrao {
            let id = d.novo_id();
            d.cartoes.push(Cartao {
                id,
                banco: banco.into(),
                banco_nome: nome.into(),
                cor: cor.into(),
                apelido: String::new(),
                bandeira: bandeira.into(),
                final_cartao: String::new(),
                vencimento: dia_padrao(),
                removido: false,
            });
        }
        d
    }

    /// Garante que o próximo id nunca repita um id já usado (ex.: arquivo editado à mão).
    pub fn normalizar(&mut self) {
        let maior = self
            .cartoes
            .iter()
            .map(|c| c.id)
            .chain(self.meses.values().flat_map(|m| m.contas.iter().map(|c| c.id)))
            .chain(self.meses.values().flat_map(|m| m.pix.iter().map(|p| p.id)))
            .max()
            .unwrap_or(0);
        self.proximo_id = self.proximo_id.max(maior);
        self.versao = versao_atual();
    }

    fn novo_id(&mut self) -> u64 {
        self.proximo_id += 1;
        self.proximo_id
    }

    /// Mês que ainda não foi editado começa com a renda e as contas fixas
    /// do último mês anterior registrado. Faturas de cartão começam zeradas.
    fn modelo_mes(&self, chave: &str) -> Mes {
        match self.meses.range::<str, _>((Unbounded, Excluded(chave))).next_back() {
            Some((_, anterior)) => Mes {
                renda: anterior.renda,
                faturas: BTreeMap::new(),
                contas: anterior
                    .contas
                    .iter()
                    .filter(|c| c.fixa)
                    .map(|c| Conta { pago: false, ..c.clone() })
                    .collect(),
                pix: Vec::new(),
            },
            None => Mes::default(),
        }
    }

    pub fn mes_mut(&mut self, chave: &str) -> &mut Mes {
        if !self.meses.contains_key(chave) {
            let modelo = self.modelo_mes(chave);
            self.meses.insert(chave.to_owned(), modelo);
        }
        self.meses.get_mut(chave).expect("mês acabou de ser inserido")
    }

    fn cartao_mut(&mut self, id: u64) -> Result<&mut Cartao, String> {
        self.cartoes
            .iter_mut()
            .find(|c| c.id == id)
            .ok_or_else(|| "Cartão não encontrado.".to_string())
    }

    // ----- cartões -----

    pub fn adicionar_cartao(&mut self, novo: NovoCartao) -> Result<u64, String> {
        let mut cartao = novo.validar()?;
        cartao.id = self.novo_id();
        let id = cartao.id;
        self.cartoes.push(cartao);
        Ok(id)
    }

    pub fn editar_cartao(&mut self, id: u64, novo: NovoCartao) -> Result<(), String> {
        let mut atualizado = novo.validar()?;
        let cartao = self.cartao_mut(id)?;
        atualizado.id = id;
        atualizado.removido = cartao.removido;
        *cartao = atualizado;
        Ok(())
    }

    /// Remove o cartão deste mês em diante. Meses anteriores com fatura
    /// continuam mostrando o cartão para não perder o histórico.
    pub fn remover_cartao(&mut self, mes: &str, id: u64) -> Result<(), String> {
        self.cartao_mut(id)?;
        for (_, m) in self.meses.range_mut::<str, _>((Included(mes), Unbounded)) {
            m.faturas.remove(&id);
        }
        let tem_historico = self
            .meses
            .values()
            .any(|m| m.faturas.get(&id).is_some_and(|f| f.valor > 0));
        if tem_historico {
            self.cartao_mut(id)?.removido = true;
        } else {
            self.cartoes.retain(|c| c.id != id);
            for m in self.meses.values_mut() {
                m.faturas.remove(&id);
            }
        }
        Ok(())
    }

    pub fn definir_fatura(&mut self, mes: &str, id: u64, centavos: i64) -> Result<(), String> {
        self.cartao_mut(id)?;
        let fatura = self.mes_mut(mes).faturas.entry(id).or_default();
        fatura.valor = centavos;
        if centavos == 0 {
            fatura.pago = false;
        }
        Ok(())
    }

    pub fn alternar_fatura_paga(&mut self, mes: &str, id: u64) -> Result<(), String> {
        self.cartao_mut(id)?;
        let fatura = self.mes_mut(mes).faturas.entry(id).or_default();
        fatura.pago = !fatura.pago;
        Ok(())
    }

    // ----- contas -----

    pub fn adicionar_conta(&mut self, mes: &str, nova: NovaConta) -> Result<u64, String> {
        let mut conta = nova.validar()?;
        conta.id = self.novo_id();
        let id = conta.id;
        self.mes_mut(mes).contas.push(conta);
        Ok(id)
    }

    pub fn editar_conta(&mut self, mes: &str, id: u64, nova: NovaConta) -> Result<(), String> {
        let atualizada = nova.validar()?;
        let conta = self.conta_mut(mes, id)?;
        conta.nome = atualizada.nome;
        conta.categoria = atualizada.categoria;
        conta.valor = atualizada.valor;
        conta.vencimento = atualizada.vencimento;
        conta.fixa = atualizada.fixa;
        Ok(())
    }

    pub fn remover_conta(&mut self, mes: &str, id: u64) -> Result<(), String> {
        let contas = &mut self.mes_mut(mes).contas;
        let antes = contas.len();
        contas.retain(|c| c.id != id);
        if contas.len() == antes {
            return Err("Conta não encontrada.".into());
        }
        Ok(())
    }

    pub fn alternar_conta_paga(&mut self, mes: &str, id: u64) -> Result<(), String> {
        let conta = self.conta_mut(mes, id)?;
        conta.pago = !conta.pago;
        Ok(())
    }

    // ----- pix -----

    pub fn adicionar_pix(&mut self, mes: &str, novo: NovoPix) -> Result<u64, String> {
        let mut pix = novo.validar()?;
        pix.id = self.novo_id();
        let id = pix.id;
        self.mes_mut(mes).pix.push(pix);
        Ok(id)
    }

    pub fn editar_pix(&mut self, mes: &str, id: u64, novo: NovoPix) -> Result<(), String> {
        let mut atualizado = novo.validar()?;
        let pix = self
            .mes_mut(mes)
            .pix
            .iter_mut()
            .find(|p| p.id == id)
            .ok_or_else(|| "Pix não encontrado.".to_string())?;
        atualizado.id = id;
        *pix = atualizado;
        Ok(())
    }

    pub fn remover_pix(&mut self, mes: &str, id: u64) -> Result<(), String> {
        let lista = &mut self.mes_mut(mes).pix;
        let antes = lista.len();
        lista.retain(|p| p.id != id);
        if lista.len() == antes {
            return Err("Pix não encontrado.".into());
        }
        Ok(())
    }

    fn conta_mut(&mut self, mes: &str, id: u64) -> Result<&mut Conta, String> {
        self.mes_mut(mes)
            .contas
            .iter_mut()
            .find(|c| c.id == id)
            .ok_or_else(|| "Conta não encontrada.".to_string())
    }

    // ----- visão do mês + cálculos -----

    pub fn visao(&self, chave: &str) -> Visao {
        let mes = self
            .meses
            .get(chave)
            .cloned()
            .unwrap_or_else(|| self.modelo_mes(chave));

        let cartoes: Vec<(&Cartao, Fatura)> = self
            .cartoes
            .iter()
            .filter_map(|c| {
                let fatura = mes.faturas.get(&c.id).copied().unwrap_or_default();
                (!c.removido || fatura.valor > 0).then_some((c, fatura))
            })
            .collect();

        let mut contas = mes.contas.clone();
        contas.sort_by(|a, b| {
            let dia = |c: &Conta| if c.vencimento == 0 { 99 } else { c.vencimento };
            dia(a)
                .cmp(&dia(b))
                .then_with(|| a.nome.to_lowercase().cmp(&b.nome.to_lowercase()))
        });

        // Pix: mais recentes primeiro (sem dia informado vão para o fim).
        let mut pix = mes.pix.clone();
        pix.sort_by(|a, b| b.dia.cmp(&a.dia).then_with(|| b.id.cmp(&a.id)));

        let resumo = calcular_resumo(mes.renda, &cartoes, &contas, &pix);

        Visao {
            mes: chave.to_owned(),
            cartoes: cartoes
                .iter()
                .map(|(c, f)| CartaoVisao {
                    cartao: (*c).clone(),
                    valor: reais(f.valor),
                    pago: f.pago,
                })
                .collect(),
            contas: contas
                .into_iter()
                .map(|c| ContaVisao {
                    id: c.id,
                    nome: c.nome,
                    categoria: c.categoria,
                    valor: reais(c.valor),
                    vencimento: c.vencimento,
                    pago: c.pago,
                    fixa: c.fixa,
                })
                .collect(),
            pix: pix
                .into_iter()
                .map(|p| PixVisao {
                    id: p.id,
                    descricao: p.descricao,
                    valor: reais(p.valor),
                    dia: p.dia,
                    banco: p.banco,
                    banco_nome: p.banco_nome,
                    cor: p.cor,
                })
                .collect(),
            resumo,
            arquivo: String::new(),
        }
    }
}

fn calcular_resumo(
    renda: i64,
    cartoes: &[(&Cartao, Fatura)],
    contas: &[Conta],
    pix: &[Pix],
) -> Resumo {
    let total_cartoes: i64 = cartoes.iter().map(|(_, f)| f.valor).sum();
    let total_contas: i64 = contas.iter().map(|c| c.valor).sum();
    let total_pix: i64 = pix.iter().map(|p| p.valor).sum();
    let total = total_cartoes + total_contas + total_pix;
    // Pix já saiu da conta, então entra direto como pago.
    let pago: i64 = cartoes
        .iter()
        .filter(|(_, f)| f.pago)
        .map(|(_, f)| f.valor)
        .sum::<i64>()
        + contas.iter().filter(|c| c.pago).map(|c| c.valor).sum::<i64>()
        + total_pix;
    let pendentes = cartoes.iter().filter(|(_, f)| f.valor > 0 && !f.pago).count()
        + contas.iter().filter(|c| c.valor > 0 && !c.pago).count();

    // Gastos por banco: dois cartões do mesmo banco somam na mesma fatia.
    let mut bancos: Vec<(String, String, String, i64)> = Vec::new();
    for (c, f) in cartoes.iter().filter(|(_, f)| f.valor > 0) {
        let chave = if c.banco == "outro" {
            format!("outro:{}", c.banco_nome.to_lowercase())
        } else {
            c.banco.clone()
        };
        match bancos.iter_mut().find(|b| b.0 == chave) {
            Some(b) => b.3 += f.valor,
            None => bancos.push((chave, c.banco_nome.clone(), c.cor.clone(), f.valor)),
        }
    }

    // Gastos por categoria: todas as faturas entram em "cartoes".
    let mut categorias: Vec<(String, i64)> = Vec::new();
    if total_cartoes > 0 {
        categorias.push(("cartoes".into(), total_cartoes));
    }
    for c in contas.iter().filter(|c| c.valor > 0) {
        match categorias.iter_mut().find(|k| k.0 == c.categoria) {
            Some(k) => k.1 += c.valor,
            None => categorias.push((c.categoria.clone(), c.valor)),
        }
    }
    if total_pix > 0 {
        categorias.push(("pix".into(), total_pix));
    }

    bancos.sort_by(|a, b| b.3.cmp(&a.3));
    categorias.sort_by(|a, b| b.1.cmp(&a.1));

    Resumo {
        renda: reais(renda),
        total_cartoes: reais(total_cartoes),
        total_contas: reais(total_contas),
        total_pix: reais(total_pix),
        total: reais(total),
        pago: reais(pago),
        a_pagar: reais(total - pago),
        sobra: reais(renda - total),
        comprometido: (renda > 0).then(|| total as f64 / renda as f64 * 100.0),
        pendentes: pendentes as u32,
        por_banco: bancos
            .into_iter()
            .map(|(chave, nome, cor, v)| Fatia { chave, nome, cor, valor: reais(v) })
            .collect(),
        por_categoria: categorias
            .into_iter()
            .map(|(chave, v)| Fatia {
                nome: chave.clone(),
                chave,
                cor: String::new(),
                valor: reais(v),
            })
            .collect(),
    }
}

// ---------------------------------------------------------------------------
// Validação das entradas
// ---------------------------------------------------------------------------

fn limpar(texto: &str, max: usize) -> String {
    texto
        .trim()
        .chars()
        .filter(|c| !c.is_control())
        .take(max)
        .collect()
}

fn cor_valida(cor: &str) -> bool {
    cor.len() == 7 && cor.starts_with('#') && cor[1..].chars().all(|c| c.is_ascii_hexdigit())
}

impl NovoCartao {
    fn validar(self) -> Result<Cartao, String> {
        let banco = limpar(&self.banco, 30).to_lowercase();
        if banco.is_empty() || !banco.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
            return Err("Escolha um banco.".into());
        }
        let banco_nome = limpar(&self.banco_nome, 40);
        if banco_nome.is_empty() {
            return Err("Informe o nome do banco.".into());
        }
        let cor = self.cor.trim().to_uppercase();
        if !cor_valida(&cor) {
            return Err("Cor inválida.".into());
        }
        if !(1..=31).contains(&self.vencimento) {
            return Err("O dia de vencimento deve ser entre 1 e 31.".into());
        }
        Ok(Cartao {
            id: 0,
            banco,
            banco_nome,
            cor,
            apelido: limpar(&self.apelido, 40),
            bandeira: limpar(&self.bandeira, 20).to_lowercase(),
            final_cartao: self.final_cartao.chars().filter(|c| c.is_ascii_digit()).take(4).collect(),
            vencimento: self.vencimento,
            removido: false,
        })
    }
}

impl NovaConta {
    fn validar(self) -> Result<Conta, String> {
        let nome = limpar(&self.nome, 60);
        if nome.is_empty() {
            return Err("Dê um nome para a conta (ex.: Aluguel, Luz).".into());
        }
        let mut categoria = limpar(&self.categoria, 30).to_lowercase();
        if categoria.is_empty() || categoria == "cartoes" {
            categoria = "outros".into();
        }
        if self.vencimento > 31 {
            return Err("O dia de vencimento deve ser entre 1 e 31.".into());
        }
        Ok(Conta {
            id: 0,
            nome,
            categoria,
            valor: interpretar_valor(&self.valor)?,
            vencimento: self.vencimento,
            pago: false,
            fixa: self.fixa,
        })
    }
}

impl NovoPix {
    fn validar(self) -> Result<Pix, String> {
        let descricao = limpar(&self.descricao, 60);
        if descricao.is_empty() {
            return Err("Escreva pra quem ou para que foi o Pix (ex.: Feira, Uber).".into());
        }
        let valor = interpretar_valor(&self.valor)?;
        if valor == 0 {
            return Err("Digite o valor do Pix.".into());
        }
        if self.dia > 31 {
            return Err("O dia deve ser entre 1 e 31.".into());
        }
        // Banco de origem é opcional; quando vem, segue as mesmas regras do cartão.
        let banco = limpar(&self.banco, 30).to_lowercase();
        let (banco, banco_nome, cor) = if banco.is_empty() {
            (String::new(), String::new(), String::new())
        } else {
            let nome = limpar(&self.banco_nome, 40);
            let cor = self.cor.trim().to_uppercase();
            if nome.is_empty()
                || !cor_valida(&cor)
                || !banco.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
            {
                return Err("Banco de origem inválido.".into());
            }
            (banco, nome, cor)
        };
        Ok(Pix {
            id: 0,
            descricao,
            valor,
            dia: self.dia,
            banco,
            banco_nome,
            cor,
        })
    }
}

/// Confere se a chave do mês está no formato "AAAA-MM".
pub fn validar_mes(chave: &str) -> Result<(), String> {
    let erro = || format!("Mês inválido: {chave}");
    let (ano, mes) = chave.split_once('-').ok_or_else(erro)?;
    if ano.len() != 4 || mes.len() != 2 {
        return Err(erro());
    }
    let ano: u32 = ano.parse().map_err(|_| erro())?;
    let mes: u32 = mes.parse().map_err(|_| erro())?;
    if !(1900..=2200).contains(&ano) || !(1..=12).contains(&mes) {
        return Err(erro());
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Leitura de valores em reais
// ---------------------------------------------------------------------------

/// Converte o texto digitado em centavos. Aceita o formato brasileiro e contas
/// de somar/subtrair, por exemplo: "1.234,56", "1234.56", "R$ 150 + 89,90 - 10".
pub fn interpretar_valor(texto: &str) -> Result<i64, String> {
    let erro = || {
        format!(
            "Não entendi o valor \"{}\". Use números como 1.234,56 ou somas como 100+49,90.",
            texto.trim()
        )
    };

    let limpo: String = texto
        .chars()
        .filter(|c| !c.is_whitespace())
        .collect::<String>()
        .replace("R$", "")
        .replace("r$", "");
    if limpo.is_empty() {
        return Ok(0);
    }

    let mut termos: Vec<(i64, String)> = Vec::new();
    let mut atual = String::new();
    let mut sinal = 1i64;
    let mut inicio = true;
    for ch in limpo.chars() {
        if ch == '+' || ch == '-' {
            let s = if ch == '-' { -1 } else { 1 };
            if atual.is_empty() {
                if inicio {
                    sinal = s;
                    inicio = false;
                    continue;
                }
                return Err(erro());
            }
            termos.push((sinal, std::mem::take(&mut atual)));
            sinal = s;
        } else {
            atual.push(ch);
        }
        inicio = false;
    }
    if atual.is_empty() {
        return Err(erro());
    }
    termos.push((sinal, atual));

    let mut total: i64 = 0;
    for (sinal, termo) in termos {
        let centavos = interpretar_numero(&termo).ok_or_else(erro)?;
        total = total.checked_add(sinal * centavos).ok_or_else(erro)?;
    }
    if total < 0 {
        return Err("O resultado não pode ficar negativo.".into());
    }
    if total > LIMITE_CENTAVOS {
        return Err("Valor alto demais.".into());
    }
    Ok(total)
}

fn interpretar_numero(s: &str) -> Option<i64> {
    if !s.chars().all(|c| c.is_ascii_digit() || c == '.' || c == ',')
        || !s.chars().any(|c| c.is_ascii_digit())
    {
        return None;
    }
    let virgulas = s.matches(',').count();
    let pontos = s.matches('.').count();

    let (inteiro, fracao): (String, String) = if virgulas > 1 {
        return None;
    } else if virgulas == 1 {
        // Formato brasileiro: ponto = milhar, vírgula = centavos.
        let (i, f) = s.split_once(',')?;
        (i.replace('.', ""), f.to_owned())
    } else if pontos == 0 {
        (s.to_owned(), String::new())
    } else if pontos == 1 {
        // "1.234" = mil duzentos e trinta e quatro; "12.5" = doze e cinquenta.
        let (i, f) = s.split_once('.')?;
        if f.len() == 3 && !i.is_empty() {
            (format!("{i}{f}"), String::new())
        } else {
            (i.to_owned(), f.to_owned())
        }
    } else {
        (s.replace('.', ""), String::new())
    };

    if fracao.contains('.') {
        return None;
    }
    let reais: i64 = if inteiro.is_empty() { 0 } else { inteiro.parse().ok()? };
    let digito = |n: usize| {
        fracao
            .chars()
            .nth(n)
            .and_then(|c| c.to_digit(10))
            .unwrap_or(0) as i64
    };
    let mut centavos = reais.checked_mul(100)?.checked_add(digito(0) * 10 + digito(1))?;
    if digito(2) >= 5 {
        centavos += 1;
    }
    Some(centavos)
}

// ---------------------------------------------------------------------------
// Testes (cargo test)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod testes {
    use super::*;

    fn conta(nome: &str, categoria: &str, valor: &str, fixa: bool) -> NovaConta {
        NovaConta {
            nome: nome.into(),
            categoria: categoria.into(),
            valor: valor.into(),
            vencimento: 5,
            fixa,
        }
    }

    #[test]
    fn le_valores_no_formato_brasileiro() {
        let casos = [
            ("1.234,56", 123_456),
            ("1234,56", 123_456),
            ("1234.56", 123_456),
            ("1.234", 123_400),
            ("12.5", 1_250),
            ("R$ 89,90", 8_990),
            ("0,5", 50),
            (",99", 99),
            ("1.234.567,89", 123_456_789),
            ("10,999", 1_100),
            ("", 0),
            ("   ", 0),
            ("150 + 89,90", 23_990),
            ("R$ 100,00 - 20", 8_000),
            ("+50", 5_000),
            ("120+45,90+12,10", 17_800),
        ];
        for (texto, esperado) in casos {
            assert_eq!(interpretar_valor(texto), Ok(esperado), "texto: {texto:?}");
        }
    }

    #[test]
    fn recusa_valores_invalidos() {
        for texto in ["abc", "10,5,3", "10++5", "10+", "-", "-5", "10 - 20", "1,2.3", "R$"] {
            let r = interpretar_valor(texto);
            // "R$" sozinho vira vazio = 0, os demais devem falhar
            if texto == "R$" {
                assert_eq!(r, Ok(0));
            } else {
                assert!(r.is_err(), "deveria recusar {texto:?}, veio {r:?}");
            }
        }
    }

    #[test]
    fn soma_faturas_e_contas_do_mes() {
        let mut d = Dados::inicial();
        let mes = "2026-11";
        d.mes_mut(mes).renda = interpretar_valor("5.000").unwrap();
        d.definir_fatura(mes, 1, interpretar_valor("1.200,50").unwrap()).unwrap(); // Nubank
        d.definir_fatura(mes, 2, interpretar_valor("800").unwrap()).unwrap(); // BB
        d.definir_fatura(mes, 3, interpretar_valor("300,25").unwrap()).unwrap(); // Bradesco
        d.adicionar_conta(mes, conta("Aluguel", "moradia", "1500", true)).unwrap();
        let luz = d.adicionar_conta(mes, conta("Luz", "energia", "199,25", true)).unwrap();
        d.alternar_fatura_paga(mes, 2).unwrap();
        d.alternar_conta_paga(mes, luz).unwrap();

        let r = d.visao(mes).resumo;
        assert_eq!(r.total_cartoes, 2300.75);
        assert_eq!(r.total_contas, 1699.25);
        assert_eq!(r.total, 4000.0);
        assert_eq!(r.pago, 999.25);
        assert_eq!(r.a_pagar, 3000.75);
        assert_eq!(r.sobra, 1000.0);
        assert_eq!(r.comprometido, Some(80.0));
        assert_eq!(r.pendentes, 3);
        assert_eq!(r.por_banco[0].chave, "nubank");
        assert_eq!(r.por_banco.len(), 3);
        assert_eq!(r.por_categoria[0].chave, "cartoes");
        assert_eq!(r.por_categoria[0].valor, 2300.75);
    }

    #[test]
    fn dois_cartoes_do_mesmo_banco_somam_na_mesma_fatia() {
        let mut d = Dados::inicial();
        let outro_nu = d
            .adicionar_cartao(NovoCartao {
                banco: "nubank".into(),
                banco_nome: "Nubank".into(),
                cor: "#820ad1".into(),
                apelido: "Virtual".into(),
                bandeira: "mastercard".into(),
                final_cartao: "12a34".into(),
                vencimento: 15,
            })
            .unwrap();
        d.definir_fatura("2026-11", 1, 10_000).unwrap();
        d.definir_fatura("2026-11", outro_nu, 5_000).unwrap();
        let v = d.visao("2026-11");
        assert_eq!(v.resumo.por_banco.len(), 1);
        assert_eq!(v.resumo.por_banco[0].valor, 150.0);
        let novo = v.cartoes.iter().find(|c| c.cartao.id == outro_nu).unwrap();
        assert_eq!(novo.cartao.final_cartao, "1234");
        assert_eq!(novo.cartao.cor, "#820AD1");
    }

    #[test]
    fn mes_novo_herda_renda_e_contas_fixas() {
        let mut d = Dados::inicial();
        d.mes_mut("2026-10").renda = 300_000;
        d.definir_fatura("2026-10", 1, 50_000).unwrap();
        let aluguel = d.adicionar_conta("2026-10", conta("Aluguel", "moradia", "1200", true)).unwrap();
        d.adicionar_conta("2026-10", conta("Presente", "lazer", "150", false)).unwrap();
        d.alternar_conta_paga("2026-10", aluguel).unwrap();

        let v = d.visao("2026-12");
        assert_eq!(v.resumo.renda, 3000.0);
        assert_eq!(v.contas.len(), 1);
        assert_eq!(v.contas[0].nome, "Aluguel");
        assert!(!v.contas[0].pago, "conta copiada deve começar como não paga");
        assert_eq!(v.resumo.total_cartoes, 0.0, "faturas começam zeradas");

        // Marcar a conta herdada como paga cria o mês de verdade.
        d.alternar_conta_paga("2026-12", aluguel).unwrap();
        assert!(d.meses.contains_key("2026-12"));
        assert!(d.visao("2026-12").contas[0].pago);
        assert!(d.visao("2026-10").contas.iter().any(|c| c.nome == "Presente"));
    }

    #[test]
    fn remover_cartao_preserva_historico() {
        let mut d = Dados::inicial();
        d.definir_fatura("2026-10", 3, 20_000).unwrap();
        d.definir_fatura("2026-11", 3, 30_000).unwrap();
        d.remover_cartao("2026-11", 3).unwrap();

        assert!(d.visao("2026-10").cartoes.iter().any(|c| c.cartao.id == 3));
        assert!(!d.visao("2026-11").cartoes.iter().any(|c| c.cartao.id == 3));
        assert!(!d.visao("2027-01").cartoes.iter().any(|c| c.cartao.id == 3));

        // Sem histórico, o cartão some de vez.
        d.remover_cartao("2026-11", 2).unwrap();
        assert!(!d.cartoes.iter().any(|c| c.id == 2));
    }

    #[test]
    fn valida_entradas() {
        let mut d = Dados::inicial();
        let ruim = NovoCartao {
            banco: "outro".into(),
            banco_nome: "Meu Banco".into(),
            cor: "roxo".into(),
            apelido: String::new(),
            bandeira: String::new(),
            final_cartao: String::new(),
            vencimento: 10,
        };
        assert!(d.adicionar_cartao(ruim.clone()).is_err());
        assert!(d.adicionar_cartao(NovoCartao { cor: "#123456".into(), vencimento: 0, ..ruim.clone() }).is_err());
        assert!(d.adicionar_cartao(NovoCartao { cor: "#123456".into(), ..ruim }).is_ok());
        assert!(d.adicionar_conta("2026-11", conta("  ", "outros", "10", false)).is_err());
        assert!(d.adicionar_conta("2026-11", conta("Luz", "energia", "dez", false)).is_err());
        assert!(validar_mes("2026-11").is_ok());
        for ruim in ["2026-13", "2026-1", "26-11", "abcd-ef", "", "2026_11"] {
            assert!(validar_mes(ruim).is_err(), "{ruim}");
        }
    }

    fn pix(descricao: &str, valor: &str, dia: u8, banco: &str) -> NovoPix {
        NovoPix {
            descricao: descricao.into(),
            valor: valor.into(),
            dia,
            banco: banco.into(),
            banco_nome: if banco.is_empty() { String::new() } else { "Nubank".into() },
            cor: if banco.is_empty() { String::new() } else { "#820AD1".into() },
        }
    }

    #[test]
    fn pix_entra_no_total_como_pago() {
        let mut d = Dados::inicial();
        let mes = "2026-11";
        d.mes_mut(mes).renda = 300_000;
        d.definir_fatura(mes, 1, 100_000).unwrap();
        d.adicionar_pix(mes, pix("Feira", "45+32,50", 3, "nubank")).unwrap();
        let uber = d.adicionar_pix(mes, pix("Uber", "22,40", 9, "")).unwrap();

        let v = d.visao(mes);
        assert_eq!(v.resumo.total_pix, 99.9);
        assert_eq!(v.resumo.total, 1099.9);
        assert_eq!(v.resumo.pago, 99.9, "Pix conta como já pago");
        assert_eq!(v.resumo.a_pagar, 1000.0);
        assert_eq!(v.resumo.sobra, 1900.1);
        assert_eq!(v.resumo.pendentes, 1, "só a fatura está pendente");
        assert!(v.resumo.por_categoria.iter().any(|c| c.chave == "pix" && c.valor == 99.9));
        assert_eq!(v.resumo.por_banco.len(), 1, "gráfico por banco continua só com faturas");
        assert_eq!(v.pix[0].descricao, "Uber", "mais recente (dia 9) primeiro");
        assert_eq!(v.pix[1].banco, "nubank");

        d.editar_pix(mes, uber, pix("Uber trabalho", "30", 9, "")).unwrap();
        assert_eq!(d.visao(mes).resumo.total_pix, 107.5);
        d.remover_pix(mes, uber).unwrap();
        assert_eq!(d.visao(mes).pix.len(), 1);
        assert!(d.remover_pix(mes, uber).is_err());

        // Pix não é copiado para o mês seguinte.
        assert!(d.visao("2026-12").pix.is_empty());
    }

    #[test]
    fn pix_valida_entradas() {
        let mut d = Dados::inicial();
        assert!(d.adicionar_pix("2026-11", pix("", "10", 1, "")).is_err());
        assert!(d.adicionar_pix("2026-11", pix("Lanche", "", 1, "")).is_err());
        assert!(d.adicionar_pix("2026-11", pix("Lanche", "dez", 1, "")).is_err());
        assert!(d.adicionar_pix("2026-11", pix("Lanche", "10", 32, "")).is_err());
        let ruim = NovoPix { cor: "roxo".into(), ..pix("Lanche", "10", 1, "nubank") };
        assert!(d.adicionar_pix("2026-11", ruim).is_err());
        assert!(d.adicionar_pix("2026-11", pix("Lanche", "10", 0, "")).is_ok());
    }

    #[test]
    fn arquivo_antigo_sem_pix_continua_abrindo() {
        let json = r##"{"versao":1,"proximo_id":3,"cartoes":[],"meses":{"2026-11":{"renda":100,"faturas":{},
            "contas":[{"id":3,"nome":"Luz","categoria":"energia","valor":500,"vencimento":5,"pago":false,"fixa":true}]}}}"##;
        let d: Dados = serde_json::from_str(json).unwrap();
        assert!(d.meses["2026-11"].pix.is_empty());
        assert_eq!(d.visao("2026-11").resumo.total, 5.0);
    }

    #[test]
    fn salva_e_le_json_sem_perder_nada() {
        let mut d = Dados::inicial();
        d.definir_fatura("2026-11", 1, 12_345).unwrap();
        d.adicionar_conta("2026-11", conta("Internet", "internet", "99,90", true)).unwrap();
        d.adicionar_pix("2026-11", pix("Padaria", "18,50", 2, "nubank")).unwrap();
        let json = serde_json::to_string_pretty(&d).unwrap();
        let mut lido: Dados = serde_json::from_str(&json).unwrap();
        lido.normalizar();
        assert_eq!(lido, d);
    }
}
