// ============================================================
// AGREGADOR DE MÉTRICAS - CALCULA ESTADÍSTICAS DE VENTAS
// ============================================================
//
// Este módulo procesa los datos crudos de ventas y genera
// métricas estructuradas que el motor de decisión puede evaluar.
//
// Todo es CÓDIGO PURO - no hay IA involucrada.
//
// ACTUALIZADO: Incluye análisis científico basado en:
// - Porcentajes relativos
// - Impacto económico real
// - Umbrales estadísticamente significativos
//
// ============================================================

import { 
  MetricasNegocio, 
  ProductoConMetricas,
  Sector
} from './types'
import { detectarSector } from './detector-sector'
import { cumpleUmbralesMinimos } from './umbrales-cientificos'

// Tipo para los datos crudos de ventas
interface VentaCruda {
  id: string
  sale_date: string | null
  total: number | null
  sale_items: {
    product_name: string
    quantity: number
    unit_price: number
    total: number
  }[]
}

// Tipo para ventas del período anterior (para calcular tendencia)
interface DatosComparacion {
  ventasActuales: VentaCruda[]
  ventasAnteriores: VentaCruda[]
}

// --------------------------------------------------------
// FUNCIÓN PRINCIPAL: Agregar métricas de ventas
// --------------------------------------------------------
export function agregarMetricas(
  datos: DatosComparacion,
  periodo: 'dia' | 'semana' | 'mes'
): MetricasNegocio {

  const { ventasActuales, ventasAnteriores } = datos

  // 1. Extraer todos los productos únicos del período actual
  const productosMap = new Map<string, {
    ventas: number
    ingresos: number
    cantidadItems: number
  }>()

  // Procesar ventas actuales
  for (const venta of ventasActuales) {
    for (const item of venta.sale_items || []) {
      const nombre = normalizarNombreProducto(item.product_name)
      const actual = productosMap.get(nombre) || { ventas: 0, ingresos: 0, cantidadItems: 0 }

      productosMap.set(nombre, {
        ventas: actual.ventas + (item.quantity || 1),
        ingresos: actual.ingresos + (item.total || 0),
        cantidadItems: actual.cantidadItems + 1
      })
    }
  }

  // 2. Calcular ventas E INGRESOS del período anterior (para tendencias e impacto)
  const productosAnterioresMap = new Map<string, {
    ventas: number
    ingresos: number
  }>()

  for (const venta of ventasAnteriores) {
    for (const item of venta.sale_items || []) {
      const nombre = normalizarNombreProducto(item.product_name)
      const actual = productosAnterioresMap.get(nombre) || { ventas: 0, ingresos: 0 }
      productosAnterioresMap.set(nombre, {
        ventas: actual.ventas + (item.quantity || 1),
        ingresos: actual.ingresos + (item.total || 0)
      })
    }
  }

  // 3. Calcular totales para porcentajes relativos
  let totalVentas = 0
  let totalIngresos = 0
  let totalIngresosAnteriores = 0

  for (const [nombre, datos] of productosMap) {
    totalVentas += datos.ventas
    totalIngresos += datos.ingresos
  }

  for (const [nombre, datos] of productosAnterioresMap) {
    totalIngresosAnteriores += datos.ingresos
  }

  // 4. Construir array de productos con métricas científicas
  const productos: ProductoConMetricas[] = []

  let ranking = 0
  // Ordenar por ventas para asignar ranking
  const productosOrdenados = Array.from(productosMap.entries())
    .sort((a, b) => b[1].ventas - a[1].ventas)

  for (const [nombre, datos] of productosOrdenados) {
    ranking++

    const datosAnteriores = productosAnterioresMap.get(nombre) || { ventas: 0, ingresos: 0 }
    const ventasAnteriores = datosAnteriores.ventas
    const ingresosAnteriores = datosAnteriores.ingresos
    
    const tendencia = calcularTendencia(datos.ventas, ventasAnteriores)
    
    // NUEVOS CÁLCULOS - Impacto económico
    const impactoEconomicoAbsoluto = datos.ingresos - ingresosAnteriores
    const impactoEconomicoRelativo = totalIngresosAnteriores > 0
      ? (impactoEconomicoAbsoluto / totalIngresosAnteriores) * 100
      : 0

    const porcentajeVentasTotal = totalVentas > 0
      ? (datos.ventas / totalVentas) * 100
      : 0

    const porcentajeIngresosTotal = totalIngresos > 0
      ? (datos.ingresos / totalIngresos) * 100
      : 0

    // Validar si cumple umbrales científicos
    const cumpleUmbrales = cumpleUmbralesMinimos(
      datos.ventas,
      ventasAnteriores,
      porcentajeVentasTotal,
      impactoEconomicoRelativo
    )

    productos.push({
      nombre,
      ventas: datos.ventas,
      ingresos: Math.round(datos.ingresos * 100) / 100,
      precioUnitario: datos.ventas > 0
        ? Math.round((datos.ingresos / datos.ventas) * 100) / 100
        : 0,
      porcentajeVentas: Math.round(porcentajeVentasTotal * 10) / 10,
      porcentajeIngresos: Math.round(porcentajeIngresosTotal * 10) / 10,
      tendencia,
      ranking,
      
      // Nuevos campos científicos
      ventasAnteriores,
      impactoEconomicoAbsoluto: Math.round(impactoEconomicoAbsoluto * 100) / 100,
      impactoEconomicoRelativo: Math.round(impactoEconomicoRelativo * 100) / 100,
      cumpleUmbralesMinimos: cumpleUmbrales
    })
  }

  // 5. Calcular medias
  const numProductos = productos.length || 1
  const medias = {
    ventasPorProducto: Math.round((totalVentas / numProductos) * 10) / 10,
    precioUnitario: productos.length > 0
      ? Math.round((productos.reduce((sum, p) => sum + p.precioUnitario, 0) / numProductos) * 100) / 100
      : 0,
    ingresosPorProducto: Math.round((totalIngresos / numProductos) * 100) / 100
  }

  // 6. Detectar sector
  const nombresProductos = productos.map(p => p.nombre)
  const { sector, confianza } = detectarSector(nombresProductos)

  // 7. Identificar productos destacados (SOLO los que cumplen umbrales)
  const productosValidos = productos.filter(p => p.cumpleUmbralesMinimos)
  
  const destacados = {
    masVendido: productosValidos.length > 0 ? productosValidos[0] : null,
    menosVendido: productosValidos.length > 0 ? productosValidos[productosValidos.length - 1] : null,
    mayorIngreso: productosValidos.length > 0
      ? [...productosValidos].sort((a, b) => b.ingresos - a.ingresos)[0]
      : null,
    mayorCrecimiento: productosValidos.length > 0
      ? [...productosValidos].sort((a, b) => b.tendencia - a.tendencia)[0]
      : null,
    mayorDeclive: productosValidos.length > 0
      ? [...productosValidos].sort((a, b) => a.tendencia - b.tendencia)[0]
      : null
  }

  // 8. Construir y devolver métricas completas
  return {
    sector,
    confianzaSector: confianza,
    periodo,
    productos,
    totales: {
      ventas: totalVentas,
      ingresos: Math.round(totalIngresos * 100) / 100,
      productosUnicos: productos.length
    },
    medias,
    destacados
  }
}

// --------------------------------------------------------
// FUNCIÓN: Normalizar nombre de producto
// --------------------------------------------------------
function normalizarNombreProducto(nombre: string): string {
  if (!nombre) return 'Producto sin nombre'

  // Capitalizar primera letra, resto en minúsculas
  const normalizado = nombre.trim().toLowerCase()
  return normalizado.charAt(0).toUpperCase() + normalizado.slice(1)
}

// --------------------------------------------------------
// FUNCIÓN: Calcular tendencia (% cambio)
// --------------------------------------------------------
function calcularTendencia(actual: number, anterior: number): number {
  if (anterior === 0) {
    // Si no había ventas antes, cualquier venta es crecimiento infinito
    // Lo limitamos a 100% para no distorsionar
    return actual > 0 ? 100 : 0
  }

  const cambio = ((actual - anterior) / anterior) * 100
  return Math.round(cambio * 10) / 10
}

// --------------------------------------------------------
// FUNCIÓN: Calcular fechas de período
// --------------------------------------------------------
export function calcularRangoFechas(periodo: 'dia' | 'semana' | 'mes'): {
  inicioActual: Date
  finActual: Date
  inicioAnterior: Date
  finAnterior: Date
} {
  const ahora = new Date()
  let inicioActual: Date
  let finActual: Date = ahora
  let inicioAnterior: Date
  let finAnterior: Date

  switch (periodo) {
    case 'dia':
      inicioActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
      inicioAnterior = new Date(inicioActual)
      inicioAnterior.setDate(inicioAnterior.getDate() - 1)
      finAnterior = new Date(inicioActual)
      break

    case 'semana':
      const diaSemana = ahora.getDay()
      const diff = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)
      inicioActual = new Date(ahora.getFullYear(), ahora.getMonth(), diff)
      inicioAnterior = new Date(inicioActual)
      inicioAnterior.setDate(inicioAnterior.getDate() - 7)
      finAnterior = new Date(inicioActual)
      break

    case 'mes':
    default:
      inicioActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      inicioAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
      finAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0)
      break
  }

  return { inicioActual, finActual, inicioAnterior, finAnterior }
}