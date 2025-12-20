// ============================================================
// AGREGADOR DE MÉTRICAS - CALCULA ESTADÍSTICAS DE VENTAS
// ============================================================
//
// Este módulo procesa los datos crudos de ventas y genera
// métricas estructuradas que el motor de decisión puede evaluar.
//
// Todo es CÓDIGO PURO - no hay IA involucrada.
//
// ============================================================

import { 
  MetricasNegocio, 
  ProductoConMetricas,
  Sector 
} from './types'
import { detectarSector } from './detector-sector'

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

  // 2. Calcular ventas del período anterior (para tendencias)
  const productosAnterioresMap = new Map<string, number>()
  
  for (const venta of ventasAnteriores) {
    for (const item of venta.sale_items || []) {
      const nombre = normalizarNombreProducto(item.product_name)
      const actual = productosAnterioresMap.get(nombre) || 0
      productosAnterioresMap.set(nombre, actual + (item.quantity || 1))
    }
  }

  // 3. Construir array de productos con métricas
  const productos: ProductoConMetricas[] = []
  let totalVentas = 0
  let totalIngresos = 0

  for (const [nombre, datos] of productosMap) {
    totalVentas += datos.ventas
    totalIngresos += datos.ingresos
  }

  let ranking = 0
  // Ordenar por ventas para asignar ranking
  const productosOrdenados = Array.from(productosMap.entries())
    .sort((a, b) => b[1].ventas - a[1].ventas)

  for (const [nombre, datos] of productosOrdenados) {
    ranking++
    
    const ventasAnteriores = productosAnterioresMap.get(nombre) || 0
    const tendencia = calcularTendencia(datos.ventas, ventasAnteriores)
    
    productos.push({
      nombre,
      ventas: datos.ventas,
      ingresos: Math.round(datos.ingresos * 100) / 100,
      precioUnitario: datos.ventas > 0 
        ? Math.round((datos.ingresos / datos.ventas) * 100) / 100 
        : 0,
      porcentajeVentas: totalVentas > 0 
        ? Math.round((datos.ventas / totalVentas) * 1000) / 10 
        : 0,
      porcentajeIngresos: totalIngresos > 0 
        ? Math.round((datos.ingresos / totalIngresos) * 1000) / 10 
        : 0,
      tendencia,
      ranking
    })
  }

  // 4. Calcular medias
  const numProductos = productos.length || 1
  const medias = {
    ventasPorProducto: Math.round((totalVentas / numProductos) * 10) / 10,
    precioUnitario: productos.length > 0
      ? Math.round((productos.reduce((sum, p) => sum + p.precioUnitario, 0) / numProductos) * 100) / 100
      : 0,
    ingresosPorProducto: Math.round((totalIngresos / numProductos) * 100) / 100
  }

  // 5. Detectar sector
  const nombresProductos = productos.map(p => p.nombre)
  const { sector, confianza } = detectarSector(nombresProductos)

  // 6. Identificar productos destacados
  const destacados = {
    masVendido: productos.length > 0 ? productos[0] : null,
    menosVendido: productos.length > 0 ? productos[productos.length - 1] : null,
    mayorIngreso: productos.length > 0 
      ? [...productos].sort((a, b) => b.ingresos - a.ingresos)[0] 
      : null,
    mayorCrecimiento: productos.length > 0
      ? [...productos].sort((a, b) => b.tendencia - a.tendencia)[0]
      : null,
    mayorDeclive: productos.length > 0
      ? [...productos].sort((a, b) => a.tendencia - b.tendencia)[0]
      : null
  }

  // 7. Construir y devolver métricas completas
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