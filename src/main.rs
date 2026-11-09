// Esconde a janela preta do console no executável final.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod dados;

use dados::{Dados, NovaConta, NovoCartao, NovoPix, Visao};
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Manager, State};

struct Estado {
    dados: Mutex<Dados>,
    arquivo: PathBuf,
}

impl Estado {
    fn ver(&self, mes: &str) -> Result<Visao, String> {
        dados::validar_mes(mes)?;
        let d = self.dados.lock().map_err(|_| "Erro interno (trava).".to_string())?;
        Ok(d.visao(mes))
    }

    /// Aplica a alteração numa cópia, salva no disco e só então confirma.
    /// Se salvar falhar, nada muda na memória.
    fn alterar(
        &self,
        mes: &str,
        alteracao: impl FnOnce(&mut Dados) -> Result<(), String>,
    ) -> Result<Visao, String> {
        dados::validar_mes(mes)?;
        let mut d = self.dados.lock().map_err(|_| "Erro interno (trava).".to_string())?;
        let mut nova = d.clone();
        alteracao(&mut nova)?;
        salvar(&self.arquivo, &nova)?;
        *d = nova;
        Ok(d.visao(mes))
    }
}

// ---------------------------------------------------------------------------
// Comandos chamados pela interface (window.__TAURI__.core.invoke)
// ---------------------------------------------------------------------------

#[tauri::command]
fn carregar(mes: String, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.ver(&mes)
}

#[tauri::command]
fn definir_renda(mes: String, texto: String, estado: State<'_, Estado>) -> Result<Visao, String> {
    let valor = dados::interpretar_valor(&texto)?;
    estado.alterar(&mes, |d| {
        d.mes_mut(&mes).renda = valor;
        Ok(())
    })
}

#[tauri::command]
fn adicionar_cartao(mes: String, cartao: NovoCartao, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.adicionar_cartao(cartao).map(|_| ()))
}

#[tauri::command]
fn editar_cartao(mes: String, id: u64, cartao: NovoCartao, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.editar_cartao(id, cartao))
}

#[tauri::command]
fn remover_cartao(mes: String, id: u64, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.remover_cartao(&mes, id))
}

#[tauri::command]
fn definir_fatura(mes: String, id: u64, texto: String, estado: State<'_, Estado>) -> Result<Visao, String> {
    let valor = dados::interpretar_valor(&texto)?;
    estado.alterar(&mes, |d| d.definir_fatura(&mes, id, valor))
}

#[tauri::command]
fn alternar_fatura_paga(mes: String, id: u64, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.alternar_fatura_paga(&mes, id))
}

#[tauri::command]
fn adicionar_conta(mes: String, conta: NovaConta, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.adicionar_conta(&mes, conta).map(|_| ()))
}

#[tauri::command]
fn editar_conta(mes: String, id: u64, conta: NovaConta, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.editar_conta(&mes, id, conta))
}

#[tauri::command]
fn remover_conta(mes: String, id: u64, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.remover_conta(&mes, id))
}

#[tauri::command]
fn alternar_conta_paga(mes: String, id: u64, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.alternar_conta_paga(&mes, id))
}

#[tauri::command]
fn adicionar_pix(mes: String, pix: NovoPix, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.adicionar_pix(&mes, pix).map(|_| ()))
}

#[tauri::command]
fn editar_pix(mes: String, id: u64, pix: NovoPix, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.editar_pix(&mes, id, pix))
}

#[tauri::command]
fn remover_pix(mes: String, id: u64, estado: State<'_, Estado>) -> Result<Visao, String> {
    estado.alterar(&mes, |d| d.remover_pix(&mes, id))
}

// ---------------------------------------------------------------------------
// Arquivo de dados
// ---------------------------------------------------------------------------

fn carregar_arquivo(caminho: &Path) -> Result<Dados, String> {
    match fs::read_to_string(caminho) {
        Ok(texto) => match serde_json::from_str::<Dados>(texto.trim_start_matches('\u{feff}')) {
            Ok(mut d) => {
                d.normalizar();
                Ok(d)
            }
            Err(_) => {
                // Arquivo danificado: guarda uma cópia em vez de apagar.
                let segundos = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                let copia = caminho.with_file_name(format!("financas-danificado-{segundos}.json"));
                fs::rename(caminho, &copia)
                    .map_err(|e| format!("Arquivo de dados danificado e não foi possível renomeá-lo: {e}"))?;
                Ok(Dados::inicial())
            }
        },
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(Dados::inicial()),
        Err(e) => Err(format!("Não foi possível ler {}: {e}", caminho.display())),
    }
}

fn salvar(caminho: &Path, dados: &Dados) -> Result<(), String> {
    let json = serde_json::to_string_pretty(dados).map_err(|e| format!("Erro ao gerar os dados: {e}"))?;
    // Grava num arquivo temporário e depois troca: assim uma queda de energia
    // no meio do salvamento não corrompe o arquivo principal.
    let temporario = caminho.with_extension("json.tmp");
    fs::write(&temporario, json).map_err(|e| format!("Não foi possível salvar: {e}"))?;
    fs::rename(&temporario, caminho).map_err(|e| format!("Não foi possível salvar: {e}"))?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // FINANCAS_ARQUIVO permite usar outro arquivo (útil para testes).
            let arquivo = match std::env::var_os("FINANCAS_ARQUIVO") {
                Some(caminho) => PathBuf::from(caminho),
                None => app.path().app_data_dir()?.join("financas.json"),
            };
            if let Some(pasta) = arquivo.parent() {
                fs::create_dir_all(pasta)?;
            }
            let dados = carregar_arquivo(&arquivo)?;
            app.manage(Estado {
                dados: Mutex::new(dados),
                arquivo,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            carregar,
            definir_renda,
            adicionar_cartao,
            editar_cartao,
            remover_cartao,
            definir_fatura,
            alternar_fatura_paga,
            adicionar_conta,
            editar_conta,
            remover_conta,
            alternar_conta_paga,
            adicionar_pix,
            editar_pix,
            remover_pix,
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Minhas Finanças");
}
