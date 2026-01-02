# ============================================
# ACTUALIZAR COST ANALYZER CON COSTOS REALES
# ============================================

Write-Host "=== ACTUALIZANDO COST ANALYZER CON COSTOS REALES ===" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\darecode\Desktop\rekalcula"
cd $projectPath

# Verificar que existe el archivo descargado
$sourceFile = "C:\Users\darecode\Downloads\CostAnalyzer-V3-ConCostosReales.tsx"

if (!(Test-Path $sourceFile)) {
    Write-Host "❌ ERROR: No se encuentra el archivo descargado" -ForegroundColor Red
    Write-Host "   Por favor, descarga primero: CostAnalyzer-V3-ConCostosReales.tsx" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Guardalo en: C:\Users\darecode\Downloads\" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Hacer backup del archivo actual
Write-Host "1. Haciendo backup del archivo actual..." -ForegroundColor Yellow
Copy-Item "components\admin\CostAnalyzer.tsx" "components\admin\CostAnalyzer.tsx.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force
Write-Host "   ✅ Backup creado" -ForegroundColor Green
Write-Host ""

# Copiar el nuevo archivo
Write-Host "2. Actualizando CostAnalyzer.tsx..." -ForegroundColor Yellow
Copy-Item $sourceFile "components\admin\CostAnalyzer.tsx" -Force
Write-Host "   ✅ Archivo actualizado" -ForegroundColor Green
Write-Host ""

# Verificar que la API de ai-usage-stats existe
Write-Host "3. Verificando API de ai-usage-stats..." -ForegroundColor Yellow
if (Test-Path "app\api\admin\ai-usage-stats\route.ts") {
    Write-Host "   ✅ API existe" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  API no encontrada - Necesitas instalar primero el sistema de monitoreo" -ForegroundColor Yellow
    Write-Host "   Ejecuta: .\instalar_monitoreo_costos.ps1" -ForegroundColor Gray
}
Write-Host ""

Write-Host "=== ACTUALIZACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 NUEVAS FUNCIONALIDADES:" -ForegroundColor Cyan
Write-Host "  ✓ Visualización de costos reales vs configurados" -ForegroundColor White
Write-Host "  ✓ Comparación lado a lado en tarjetas" -ForegroundColor White
Write-Host "  ✓ Botón 'Aplicar Recomendados' (real + 20% buffer)" -ForegroundColor White
Write-Host "  ✓ Estadísticas de operaciones procesadas" -ForegroundColor White
Write-Host "  ✓ Rango de costos (mín-máx)" -ForegroundColor White
Write-Host "  ✓ Alertas si costos están muy desviados" -ForegroundColor White
Write-Host ""

Write-Host "📋 SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'feat: add real cost visualization in CostAnalyzer'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
Write-Host ""

Write-Host "💡 CÓMO VERLO:" -ForegroundColor Cyan
Write-Host "  1. Ve a /admin" -ForegroundColor White
Write-Host "  2. Pestaña 'Análisis Costos'" -ForegroundColor White
Write-Host "  3. Verás una sección verde con 'Costos Reales vs Configurados'" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Si no ves datos reales, necesitas:" -ForegroundColor White
Write-Host "  1. Haber ejecutado el SQL en Supabase (crear tabla ai_usage_logs)" -ForegroundColor Gray
Write-Host "  2. Haber integrado el logger en tus APIs" -ForegroundColor Gray
Write-Host "  3. Procesar al menos 10-20 operaciones" -ForegroundColor Gray
Write-Host ""
