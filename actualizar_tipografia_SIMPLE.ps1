# Actualización de Rangos Tipográficos
# Script simplificado sin errores

Write-Host ""
Write-Host "=== ACTUALIZACION DE TIPOGRAFIA ===" -ForegroundColor Cyan
Write-Host ""

# Variables
$downloads = "$env:USERPROFILE\Downloads"
$backupDir = "backups\typography_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Crear backup
Write-Host "[1/3] Creando backup..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if (Test-Path "components\admin\TypographyManager.tsx") {
    Copy-Item "components\admin\TypographyManager.tsx" "$backupDir\TypographyManager.tsx.backup" -Force
    Write-Host "  OK Backup creado" -ForegroundColor Green
}

Write-Host ""

# Actualizar archivos
Write-Host "[2/3] Actualizando archivos..." -ForegroundColor Yellow

# TypographyManager
if (Test-Path "$downloads\TypographyManager_v2.tsx") {
    Copy-Item "$downloads\TypographyManager_v2.tsx" "components\admin\TypographyManager.tsx" -Force
    Write-Host "  OK TypographyManager.tsx" -ForegroundColor Green
} else {
    Write-Host "  ERROR No encontrado: TypographyManager_v2.tsx" -ForegroundColor Red
}

# Route
if (Test-Path "$downloads\typography-config-route_v2.ts") {
    Copy-Item "$downloads\typography-config-route_v2.ts" "app\api\admin\typography-config\route.ts" -Force
    Write-Host "  OK route.ts" -ForegroundColor Green
} else {
    Write-Host "  ERROR No encontrado: typography-config-route_v2.ts" -ForegroundColor Red
}

Write-Host ""

# Resumen
Write-Host "[3/3] Resumen" -ForegroundColor Yellow
Write-Host ""
Write-Host "CAMBIOS:" -ForegroundColor Cyan
Write-Host "  - Escala: Slider 1.05 -> 1.618" -ForegroundColor White
Write-Host "  - Line Height: Slider 1.05 -> 2.0" -ForegroundColor White
Write-Host ""
Write-Host "PROXIMO PASO:" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'feat: extend typography ranges'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
Write-Host ""
