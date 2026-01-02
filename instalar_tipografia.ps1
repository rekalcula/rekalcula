# ============================================
# INSTALACIÓN SISTEMA DE TIPOGRAFÍA GLOBAL
# ============================================

Write-Host "=== INSTALANDO SISTEMA DE TIPOGRAFÍA GLOBAL ===" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\darecode\Desktop\rekalcula"
cd $projectPath

# ============================================
Write-Host "1. Creando estructura de carpetas..." -ForegroundColor Yellow

# Crear carpeta para provider
New-Item -ItemType Directory -Path "app\providers" -Force | Out-Null
Write-Host "   ✅ app/providers/" -ForegroundColor Green

# Crear carpeta para API
New-Item -ItemType Directory -Path "app\api\admin\typography-config" -Force | Out-Null
Write-Host "   ✅ app/api/admin/typography-config/" -ForegroundColor Green

Write-Host ""

# ============================================
Write-Host "2. Verificando archivos descargados..." -ForegroundColor Yellow

$files = @{
    "TypographyProvider.tsx" = "app\providers\TypographyProvider.tsx"
    "TypographyManager.tsx" = "components\admin\TypographyManager.tsx"
    "typography-config-route.ts" = "app\api\admin\typography-config\route.ts"
}

$allFound = $true
foreach ($file in $files.Keys) {
    if (Test-Path "C:\Users\darecode\Downloads\$file") {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NO ENCONTRADO" -ForegroundColor Red
        $allFound = $false
    }
}

if (-not $allFound) {
    Write-Host ""
    Write-Host "⚠️  Faltan archivos. Descárgalos primero." -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
Write-Host "3. Copiando archivos..." -ForegroundColor Yellow

# Copiar Provider
$content = Get-Content "C:\Users\darecode\Downloads\TypographyProvider.tsx" -Raw -Encoding UTF8
Set-Content "app\providers\TypographyProvider.tsx" -Value $content -Encoding UTF8
Write-Host "   ✅ TypographyProvider.tsx → app/providers/" -ForegroundColor Green

# Copiar TypographyManager
$content = Get-Content "C:\Users\darecode\Downloads\TypographyManager.tsx" -Raw -Encoding UTF8
Set-Content "components\admin\TypographyManager.tsx" -Value $content -Encoding UTF8
Write-Host "   ✅ TypographyManager.tsx → components/admin/" -ForegroundColor Green

# Copiar API route
$content = Get-Content "C:\Users\darecode\Downloads\typography-config-route.ts" -Raw -Encoding UTF8
Set-Content "app\api\admin\typography-config\route.ts" -Value $content -Encoding UTF8
Write-Host "   ✅ route.ts → app/api/admin/typography-config/" -ForegroundColor Green

Write-Host ""

# ============================================
Write-Host "4. Actualizando app/layout.tsx..." -ForegroundColor Yellow

$layoutPath = "app\layout.tsx"
$layoutContent = Get-Content $layoutPath -Raw -Encoding UTF8

# Verificar si ya está el import
if ($layoutContent -notmatch "import.*TypographyProvider") {
    # Añadir import después de los otros imports
    $layoutContent = $layoutContent -replace "(import.*@/lib/supabase.*)", "`$1`nimport { TypographyProvider } from './providers/TypographyProvider'"
    
    # Envolver children con TypographyProvider
    $layoutContent = $layoutContent -replace "(<body[^>]*>)", "`$1`n        <TypographyProvider>"
    $layoutContent = $layoutContent -replace "(</body>)", "        </TypographyProvider>`n      `$1"
    
    Set-Content $layoutPath -Value $layoutContent -Encoding UTF8
    Write-Host "   ✅ layout.tsx actualizado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  layout.tsx ya tenía TypographyProvider" -ForegroundColor Gray
}

Write-Host ""

# ============================================
Write-Host "5. Actualizando AdminDashboard.tsx..." -ForegroundColor Yellow

$dashboardPath = "components\admin\AdminDashboard.tsx"
$dashboardContent = Get-Content $dashboardPath -Raw -Encoding UTF8

# Verificar si ya está el import
if ($dashboardContent -notmatch "import.*TypographyManager") {
    # Añadir import
    $dashboardContent = $dashboardContent -replace "(import.*CostAnalyzer.*)", "`$1`nimport TypographyManager from './TypographyManager'"
    
    # Actualizar tipo del useState
    $dashboardContent = $dashboardContent -replace "useState<'users' \| 'plans' \| 'packages' \| 'trial' \| 'costs'>", "useState<'users' | 'plans' | 'packages' | 'trial' | 'costs' | 'typography'>"
    
    # Añadir botón de pestaña (antes del cierre del div de pestañas)
    $buttonHTML = @"
  <button
    onClick={() => setActiveTab('typography')}
    className={``px-4 py-2 rounded-lg font-medium transition whitespace-nowrap `${
      activeTab === 'typography'
        ? 'bg-[#D98C21] text-black'
        : 'bg-[#333] text-gray-300 hover:bg-[#444]'
    }``}
  >
    Tipografía
  </button>
"@
    
    $dashboardContent = $dashboardContent -replace "(</div>\s*{/\* Contenido de las pestañas \*/})", "$buttonHTML`n        `$1"
    
    # Añadir renderizado condicional
    $dashboardContent = $dashboardContent -replace "({activeTab === 'costs' && <CostAnalyzer />})", "`$1`n      {activeTab === 'typography' && <TypographyManager />}"
    
    Set-Content $dashboardPath -Value $dashboardContent -Encoding UTF8
    Write-Host "   ✅ AdminDashboard.tsx actualizado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  AdminDashboard.tsx ya tenía TypographyManager" -ForegroundColor Gray
}

Write-Host ""

# ============================================
Write-Host "=== INSTALACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host ""

Write-Host "📋 PASOS PENDIENTES:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  EJECUTAR SQL EN SUPABASE:" -ForegroundColor Yellow
Write-Host "   - Abre Supabase SQL Editor" -ForegroundColor White
Write-Host "   - Ejecuta: typography_config_table.sql" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  HACER COMMIT Y PUSH:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m 'feat: add global typography configuration system'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  PROBAR EN /admin:" -ForegroundColor Yellow
Write-Host "   - Ir a /admin" -ForegroundColor White
Write-Host "   - Pestaña 'Tipografía'" -ForegroundColor White
Write-Host "   - Ajustar tamaños y fuente" -ForegroundColor White
Write-Host "   - Guardar y recargar" -ForegroundColor White
Write-Host ""

Write-Host "🎯 FUNCIONALIDADES:" -ForegroundColor Cyan
Write-Host "  ✓ Configurar tamaño base (mobile/tablet/desktop)" -ForegroundColor White
Write-Host "  ✓ Elegir familia tipográfica (10+ opciones)" -ForegroundColor White
Write-Host "  ✓ Ajustar escala tipográfica (1.125-1.618)" -ForegroundColor White
Write-Host "  ✓ Preview en tiempo real" -ForegroundColor White
Write-Host "  ✓ Aplicación global automática" -ForegroundColor White
Write-Host "  ✓ Responsive (3 breakpoints)" -ForegroundColor White
Write-Host "  ✓ Restablecer valores por defecto" -ForegroundColor White
Write-Host ""

Write-Host "💡 TIP: Después de instalar, podrás configurar toda la tipografía" -ForegroundColor Yellow
Write-Host "   de tu app desde el panel admin sin tocar código." -ForegroundColor Yellow
Write-Host ""
