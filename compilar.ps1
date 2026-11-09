# Compila o Minhas Financas e copia o executavel para esta pasta.
# Uso: clique com o botao direito > "Executar com o PowerShell"
#      ou, num terminal nesta pasta:  powershell -ExecutionPolicy Bypass -File .\compilar.ps1

# O cargo escreve o progresso no stderr; com 'Continue' o PowerShell 5.1 nao trata
# isso como erro. O resultado de cada etapa e conferido pelo $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"

Write-Host "Rodando os testes..." -ForegroundColor Cyan
cargo test --release
if ($LASTEXITCODE -ne 0) { Write-Host "Os testes falharam." -ForegroundColor Red; exit 1 }

Write-Host "Compilando (a primeira vez demora alguns minutos)..." -ForegroundColor Cyan
cargo build --release
if ($LASTEXITCODE -ne 0) { Write-Host "A compilacao falhou." -ForegroundColor Red; exit 1 }

$alvo = (cargo metadata --format-version 1 --no-deps | ConvertFrom-Json).target_directory
try {
    Copy-Item (Join-Path $alvo 'release\MinhasFinancas.exe') (Join-Path $PSScriptRoot 'MinhasFinancas.exe') -Force -ErrorAction Stop
} catch {
    Write-Host "Nao consegui substituir o MinhasFinancas.exe. Feche o programa e rode este script de novo." -ForegroundColor Red
    exit 1
}
Write-Host "Pronto! Executavel: $PSScriptRoot\MinhasFinancas.exe" -ForegroundColor Green
