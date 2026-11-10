//! Núcleo do Minhas Finanças em WebAssembly, usado pela versão de celular.
//!
//! As regras e os cálculos são os mesmos do programa de Windows: o arquivo
//! `src/dados.rs` é compilado aqui também. A diferença é só o salvamento: no
//! celular quem guarda os dados é a página (no armazenamento do navegador), então
//! cada alteração devolve o JSON completo para a página gravar.
//!
//! Conversa com o JavaScript (ui/plataforma.js), sem dependências extras:
//! 1. a página pede memória com `reservar(tamanho)` e escreve o pedido em JSON:
//!    `{"comando": "definir_renda", "args": {"mes": "2026-11", "texto": "3500"}}`;
//! 2. chama `chamar(ponteiro, tamanho)`, que devolve ponteiro e tamanho da resposta
//!    juntos num u64 (ponteiro nos 32 bits de cima);
//! 3. lê a resposta e devolve a memória com `liberar(ponteiro, tamanho)`.
//!
//! Resposta: `{"ok": <visão do mês>, "salvar": "<json dos dados>"}` ou `{"erro": "mensagem"}`.

#[path = "../../src/dados.rs"]
#[allow(dead_code)]
mod dados;

use dados::{Dados, NovaConta, NovoCartao, NovoPix, Visao};
use serde::de::DeserializeOwned;
use serde::Deserialize;
use serde_json::{json, Value};
use std::cell::RefCell;

thread_local! {
    static DADOS: RefCell<Dados> = RefCell::new(Dados::inicial());
}

// ---------------------------------------------------------------------------
// Memória compartilhada com o JavaScript
// ---------------------------------------------------------------------------

/// Reserva `tamanho` bytes para a página escrever o pedido.
#[no_mangle]
pub extern "C" fn reservar(tamanho: usize) -> *mut u8 {
    let mut v = Vec::<u8>::with_capacity(tamanho);
    let p = v.as_mut_ptr();
    std::mem::forget(v);
    p
}

/// Devolve a memória de um pedido (`reservar`) ou de uma resposta (`chamar`).
///
/// # Safety
/// `p` e `tamanho` precisam ser exatamente os que vieram de `reservar` ou `chamar`.
#[no_mangle]
pub unsafe extern "C" fn liberar(p: *mut u8, tamanho: usize) {
    drop(Vec::from_raw_parts(p, 0, tamanho));
}

/// Executa um pedido em JSON e devolve a resposta (ponteiro << 32 | tamanho).
///
/// # Safety
/// `p` precisa apontar para `tamanho` bytes válidos (reservados com `reservar`).
#[no_mangle]
pub unsafe extern "C" fn chamar(p: *const u8, tamanho: usize) -> u64 {
    let entrada = std::slice::from_raw_parts(p, tamanho);
    let bytes = processar(entrada).into_bytes().into_boxed_slice();
    let n = bytes.len();
    let ptr = Box::into_raw(bytes) as *mut u8;
    ((ptr as u64) << 32) | n as u64
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct Pedido {
    comando: String,
    #[serde(default)]
    args: Value,
}

fn processar(entrada: &[u8]) -> String {
    let resultado = serde_json::from_slice::<Pedido>(entrada)
        .map_err(|e| format!("Pedido inválido: {e}"))
        .and_then(|p| executar(&p.comando, p.args));
    match resultado {
        Ok(v) => v.to_string(),
        Err(msg) => json!({ "erro": msg }).to_string(),
    }
}

fn args<T: DeserializeOwned>(v: Value) -> Result<T, String> {
    serde_json::from_value(v).map_err(|e| format!("Dados do pedido inválidos: {e}"))
}

#[derive(Deserialize)]
struct Mes {
    mes: String,
}
#[derive(Deserialize)]
struct Texto {
    mes: String,
    texto: String,
}
#[derive(Deserialize)]
struct Id {
    mes: String,
    id: u64,
}
#[derive(Deserialize)]
struct IdTexto {
    mes: String,
    id: u64,
    texto: String,
}
#[derive(Deserialize)]
struct Cartao {
    mes: String,
    #[serde(default)]
    id: u64,
    cartao: NovoCartao,
}
#[derive(Deserialize)]
struct Conta {
    mes: String,
    #[serde(default)]
    id: u64,
    conta: NovaConta,
}
#[derive(Deserialize)]
struct Pix {
    mes: String,
    #[serde(default)]
    id: u64,
    pix: NovoPix,
}
#[derive(Deserialize)]
struct Abrir {
    /// Conteúdo salvo no aparelho (ausente na primeira vez).
    json: Option<String>,
    /// true ao restaurar um backup: JSON inválido vira erro em vez de começar do zero.
    #[serde(default)]
    restaurar: bool,
}

fn executar(comando: &str, a: Value) -> Result<Value, String> {
    match comando {
        "abrir" => abrir(args(a)?),
        "exportar" => DADOS.with(|d| Ok(json!({ "ok": json_dos_dados(&d.borrow())? }))),
        "carregar" => {
            let a: Mes = args(a)?;
            ver(&a.mes)
        }
        "definir_renda" => {
            let a: Texto = args(a)?;
            let valor = dados::interpretar_valor(&a.texto)?;
            alterar(&a.mes, |d| {
                d.mes_mut(&a.mes).renda = valor;
                Ok(())
            })
        }
        "adicionar_cartao" => {
            let a: Cartao = args(a)?;
            alterar(&a.mes, |d| d.adicionar_cartao(a.cartao).map(|_| ()))
        }
        "editar_cartao" => {
            let a: Cartao = args(a)?;
            alterar(&a.mes, |d| d.editar_cartao(a.id, a.cartao))
        }
        "remover_cartao" => {
            let a: Id = args(a)?;
            alterar(&a.mes, |d| d.remover_cartao(&a.mes, a.id))
        }
        "definir_fatura" => {
            let a: IdTexto = args(a)?;
            let valor = dados::interpretar_valor(&a.texto)?;
            alterar(&a.mes, |d| d.definir_fatura(&a.mes, a.id, valor))
        }
        "alternar_fatura_paga" => {
            let a: Id = args(a)?;
            alterar(&a.mes, |d| d.alternar_fatura_paga(&a.mes, a.id))
        }
        "adicionar_conta" => {
            let a: Conta = args(a)?;
            alterar(&a.mes, |d| d.adicionar_conta(&a.mes, a.conta).map(|_| ()))
        }
        "editar_conta" => {
            let a: Conta = args(a)?;
            alterar(&a.mes, |d| d.editar_conta(&a.mes, a.id, a.conta))
        }
        "remover_conta" => {
            let a: Id = args(a)?;
            alterar(&a.mes, |d| d.remover_conta(&a.mes, a.id))
        }
        "alternar_conta_paga" => {
            let a: Id = args(a)?;
            alterar(&a.mes, |d| d.alternar_conta_paga(&a.mes, a.id))
        }
        "adicionar_pix" => {
            let a: Pix = args(a)?;
            alterar(&a.mes, |d| d.adicionar_pix(&a.mes, a.pix).map(|_| ()))
        }
        "editar_pix" => {
            let a: Pix = args(a)?;
            alterar(&a.mes, |d| d.editar_pix(&a.mes, a.id, a.pix))
        }
        "remover_pix" => {
            let a: Id = args(a)?;
            alterar(&a.mes, |d| d.remover_pix(&a.mes, a.id))
        }
        outro => Err(format!("Comando desconhecido: {outro}")),
    }
}

/// Carrega os dados salvos no aparelho. Se estiverem danificados, começa do zero
/// e avisa a página (`danificado: true`) para ela guardar uma cópia do conteúdo.
fn abrir(a: Abrir) -> Result<Value, String> {
    let (novos, danificado) = match a.json.as_deref().map(str::trim) {
        None | Some("") => (Dados::inicial(), false),
        Some(texto) => match serde_json::from_str::<Dados>(texto.trim_start_matches('\u{feff}')) {
            Ok(mut d) => {
                d.normalizar();
                (d, false)
            }
            Err(e) if a.restaurar => {
                return Err(format!("Esse arquivo não é um backup válido do Minhas Finanças ({e})."))
            }
            Err(_) => (Dados::inicial(), true),
        },
    };
    let salvar = json_dos_dados(&novos)?;
    DADOS.with(|d| *d.borrow_mut() = novos);
    Ok(json!({ "ok": true, "danificado": danificado, "salvar": salvar }))
}

fn ver(mes: &str) -> Result<Value, String> {
    dados::validar_mes(mes)?;
    DADOS.with(|d| resposta(&d.borrow().visao(mes), None))
}

/// Igual ao programa de Windows: aplica a alteração numa cópia e só troca os
/// dados se der tudo certo. A página grava o JSON devolvido em "salvar".
fn alterar(mes: &str, alteracao: impl FnOnce(&mut Dados) -> Result<(), String>) -> Result<Value, String> {
    dados::validar_mes(mes)?;
    DADOS.with(|celula| {
        let mut nova = celula.borrow().clone();
        alteracao(&mut nova)?;
        let salvar = json_dos_dados(&nova)?;
        let visao = nova.visao(mes);
        *celula.borrow_mut() = nova;
        resposta(&visao, Some(salvar))
    })
}

fn resposta(visao: &Visao, salvar: Option<String>) -> Result<Value, String> {
    let ok = serde_json::to_value(visao).map_err(|e| format!("Erro ao montar a tela: {e}"))?;
    Ok(match salvar {
        Some(s) => json!({ "ok": ok, "salvar": s }),
        None => json!({ "ok": ok }),
    })
}

/// Mesmo formato do financas.json do Windows: um backup do celular abre no PC e vice-versa.
fn json_dos_dados(d: &Dados) -> Result<String, String> {
    serde_json::to_string_pretty(d).map_err(|e| format!("Erro ao gerar os dados: {e}"))
}

#[cfg(test)]
mod testes_web {
    use super::*;

    fn pedir(comando: &str, args: Value) -> Value {
        let texto = json!({ "comando": comando, "args": args }).to_string();
        serde_json::from_str(&processar(texto.as_bytes())).unwrap()
    }

    #[test]
    fn abre_vazio_altera_e_devolve_json_para_salvar() {
        let r = pedir("abrir", json!({ "json": null }));
        assert_eq!(r["ok"], true);
        let r = pedir("definir_renda", json!({ "mes": "2026-11", "texto": "3500+250,50" }));
        assert_eq!(r["ok"]["resumo"]["renda"].as_f64(), Some(3750.5));
        let salvo: Dados = serde_json::from_str(r["salvar"].as_str().unwrap()).unwrap();
        assert_eq!(salvo.meses["2026-11"].renda, 375050);

        // reabrindo com o que foi salvo, os dados voltam iguais
        let r = pedir("abrir", json!({ "json": r["salvar"] }));
        assert_eq!(r["danificado"], false);
        let r = pedir("carregar", json!({ "mes": "2026-11" }));
        assert_eq!(r["ok"]["resumo"]["renda"].as_f64(), Some(3750.5));
        assert!(r.get("salvar").is_none());
    }

    #[test]
    fn erros_voltam_como_mensagem_e_nao_mudam_nada() {
        pedir("abrir", json!({ "json": null }));
        let r = pedir("definir_renda", json!({ "mes": "2026-11", "texto": "abc" }));
        assert!(r["erro"].is_string());
        let r = pedir("comando_que_nao_existe", json!({}));
        assert!(r["erro"].as_str().unwrap().contains("desconhecido"));
        let r = pedir("carregar", json!({ "mes": "2026-11" }));
        assert_eq!(r["ok"]["resumo"]["renda"].as_f64(), Some(0.0));
    }

    #[test]
    fn json_danificado_comeca_do_zero_mas_backup_invalido_e_recusado() {
        let r = pedir("abrir", json!({ "json": "{isso nao e json" }));
        assert_eq!(r["danificado"], true);
        let r = pedir("abrir", json!({ "json": "{isso nao e json", "restaurar": true }));
        assert!(r["erro"].as_str().unwrap().contains("backup"));
    }
}
