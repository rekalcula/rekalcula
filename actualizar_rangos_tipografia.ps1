# ============================================
# ACTUALIZACIÓN: Rangos Personalizados de Tipografía
# Ratio de Escala: 1.05 - 1.618
# Line Height: 1.05 - 2.0
# ============================================

Write-Host "`n=== ACTUALIZACIÓN DE RANGOS TIPOGRÁFICOS ===" -ForegroundColor Cyan
Write-Host "Proyecto: reKalcula" -ForegroundColor Cyan
Write-Host "`n"

$ErrorCount = 0

# ============================================
# PASO 1: BACKUP DE ARCHIVOS EXISTENTES
# ============================================
Write-Host "[1/3] Creando backup de archivos existentes..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups\typography_$timestamp"

if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" -Force | Out-Null
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup de archivos
$archivosBackup = @(
    "components\admin\TypographyManager.tsx",
    "app\api\admin\typography-config\route.ts"
)

foreach ($archivo in $archivosBackup) {
    if (Test-Path $archivo) {
        $destino = Join-Path $backupDir (Split-Path $archivo -Leaf)
        Copy-Item $archivo $destino -Force
        Write-Host "  ✓ Backup: $archivo" -ForegroundColor Green
    }
}

Write-Host "`n"

# ============================================
# PASO 2: ACTUALIZAR ARCHIVOS
# ============================================
Write-Host "[2/3] Actualizando archivos con nuevos rangos..." -ForegroundColor Yellow

$downloads = "$env:USERPROFILE\Downloads"

# Actualizar TypographyManager.tsx
if (Test-Path "$downloads\TypographyManager_v2.tsx") {
    Copy-Item "$downloads\TypographyManager_v2.tsx" "components\admin\TypographyManager.tsx" -Force
    Write-Host "  ✓ TypographyManager.tsx actualizado" -ForegroundColor Green
    Write-Host "    - Escala: 1.05 - 1.618 (slider continuo)" -ForegroundColor Gray
    Write-Host "    - Line Height: 1.05 - 2.0" -ForegroundColor Gray
} else {
    Write-Host "  ✗ No encontrado: TypographyManager_v2.tsx" -ForegroundColor Red
    $ErrorCount++
}

# Actualizar route.ts
if (Test-Path "$downloads\typography-config-route_v2.ts") {
    Copy-Item "$downloads\typography-config-route_v2.ts" "app\api\admin\typography-config\route.ts" -Force
    Write-Host "  ✓ route.ts actualizado (validaciones)" -ForegroundColor Green
} else {
    Write-Host "  ✗ No encontrado: typography-config-route_v2.ts" -ForegroundColor Red
    $ErrorCount++
}

Write-Host "`n"

# ============================================
# PASO 3: RESUMEN
# ============================================
Write-Host "[3/3] Resumen de cambios..." -ForegroundColor Yellow

if ($ErrorCount -eq 0) {
    Write-Host "`n✅ ACTUALIZACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host "`nCAMBIOS REALIZADOS:" -ForegroundColor Cyan
    Write-Host "  • Ratio de Escala: Ahora slider 1.05 → 1.618" -ForegroundColor White
    Write-Host "  • Line Height: Ahora comienza en 1.05" -ForegroundColor White
    Write-Host "  • Vista previa mejorada con marcadores" -ForegroundColor White
    Write-Host "  • Identificación automática de escalas (Minor Second, Major Third, etc.)" -ForegroundColor White
    Write-Host "`nBACKUP guardado en:" -ForegroundColor Yellow
    Write-Host "  $backupDir" -ForegroundColor Gray
    Write-Host "`nPRÓXIMOS PASOS:" -ForegroundColor Yellow
    Write-Host "  1. git add ." -ForegroundColor White
    Write-Host "  2. git commit -m 'feat: extend typography scale ranges (1.05-1.618)'" -ForegroundColor White
    Write-Host "  3. git push" -ForegroundColor White
    Write-Host "  4. Ir a /admin → Tipografía para probar" -ForegroundColor White
    Write-Host "`n"
} else {
    Write-Host "`n⚠️ ACTUALIZACIÓN COMPLETADA CON $ErrorCount ERRORES" -ForegroundColor Yellow
    Write-Host "Revisa que los archivos _v2 estén en Downloads" -ForegroundColor Yellow
    Write-Host "`n"
}

Write-Host "=== FIN ===" -ForegroundColor Cyan
Write-Host "`n"
