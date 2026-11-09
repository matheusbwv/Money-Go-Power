use std::path::PathBuf;

fn main() {
    // O compilador de recursos do Windows (rc.exe) tem problemas com caminhos
    // acentuados como "Área de Trabalho". Por isso copiamos o ícone para a pasta
    // de build (caminho sem acentos) antes de embuti-lo no executável.
    let out_dir = PathBuf::from(std::env::var("OUT_DIR").expect("OUT_DIR"));
    let icone = out_dir.join("icon.ico");
    std::fs::copy("icons/icon.ico", &icone).expect("não foi possível copiar icons/icon.ico");
    println!("cargo:rerun-if-changed=icons/icon.ico");
    println!("cargo:rerun-if-changed=ui");

    let windows = tauri_build::WindowsAttributes::new().window_icon_path(&icone);
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("falha ao preparar o build do Tauri");
}
