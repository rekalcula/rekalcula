// ============================================================
// MOTOR DE DECISIÓN - EVALÚA REGLAS Y GENERA OPORTUNIDADES
// ============================================================
//
// Este es el cerebro del sistema. Evalúa cada regla contra
// las métricas del negocio y genera oportunidades estructuradas.
//
// IMPORTANTE: Todo es CÓDIGO PURO. La IA NO participa aquí.
//
// ============================================================

import { 
  MetricasNegocio, 
  OportunidadDetectada,
  Prioridad
} from './types'
import { REGLAS } from './reglas'
import { getPrincipio } from './principios'

// --------------------------------------------------------
// FUNCIÓN PRINCIPAL: Detectar oportunidades
// --------------------------------------------------------
export function detectarOportunidades(
  metricas: MetricasNegocio,
  maxOportunidades: number = 5
): OportunidadDetectada[] {
  
  const oportunidades: OportunidadDetectada[] = []

  // Evaluar cada regla
  for (const regla of REGLAS) {
    try {
      // Ejecutar la función de evaluación de la regla
      const productoDetectado = regla.evaluar(metricas)
      
      if (productoDetectado) {
        // Obtener el principio científico asociado
        const principio = getPrincipio(regla.principioId)
        
        if (!principio) {
          console.warn(`Principio no encontrado: ${regla.principioId}`)
          continue
        }

        // Verificar que no tengamos ya una oportunidad para este producto
        const yaExiste = oportunidades.some(o => 
          o.producto.nombre === productoDetectado.nombre &&
          o.tipo === regla.tipoOportunidad
        )

        if (!yaExiste) {
          oportunidades.push({
            id: `OPP-${Date.now()}-${regla.id}`,
            reglaId: regla.id,
            tipo: regla.tipoOportunidad,
            prioridad: regla.prioridad,
            producto: {
              nombre: productoDetectado.nombre,
              ventas: productoDetectado.ventas,
              ingresos: productoDetectado.ingresos,
              tendencia: productoDetectado.tendencia
            },
            contexto: {
              mediaVentas: metricas.medias.ventasPorProducto,
              mediaPrecio: metricas.medias.precioUnitario,
              sector: metricas.sector
            },
            principio: {
              id: principio.id,
              nombre: principio.nombre,
              autor: principio.autor,
              año: principio.año
            }
          })
        }
      }
    } catch (error) {
      console.error(`Error evaluando regla ${regla.id}:`, error)
    }
  }

  // Ordenar por prioridad (1 = alta, 3 = baja)
  oportunidades.sort((a, b) => a.prioridad - b.prioridad)

  // Limitar cantidad de oportunidades
  return oportunidades.slice(0, maxOportunidades)
}

// --------------------------------------------------------
// FUNCIÓN: Filtrar oportunidades por prioridad
// --------------------------------------------------------
export function filtrarPorPrioridad(
  oportunidades: OportunidadDetectada[],
  prioridad: Prioridad
): OportunidadDetectada[] {
  return oportunidades.filter(o => o.prioridad === prioridad)
}

// --------------------------------------------------------
// FUNCIÓN: Obtener resumen de oportunidades
// --------------------------------------------------------
export function obtenerResumen(oportunidades: OportunidadDetectada[]): {
  total: number
  altaPrioridad: number
  mediaPrioridad: number
  bajaPrioridad: number
  principiosUsados: string[]
} {
  return {
    total: oportunidades.length,
    altaPrioridad: oportunidades.filter(o => o.prioridad === 1).length,
    mediaPrioridad: oportunidades.filter(o => o.prioridad === 2).length,
    bajaPrioridad: oportunidades.filter(o => o.prioridad === 3).length,
    principiosUsados: [...new Set(oportunidades.map(o => o.principio.nombre))]
  }
}

// --------------------------------------------------------
// FUNCIÓN: Verificar si hay datos suficientes
// --------------------------------------------------------
export function hayDatosSuficientes(metricas: MetricasNegocio): {
  suficientes: boolean
  mensaje: string
} {
  // Mínimo 3 productos para análisis significativo
  if (metricas.productos.length < 3) {
    return {
      suficientes: false,
      mensaje: `Solo hay ${metricas.productos.length} producto(s) registrado(s). Se necesitan al menos 3 productos diferentes para generar recomendaciones significativas.`
    }
  }

  // Mínimo 10 ventas totales
  if (metricas.totales.ventas < 10) {
    return {
      suficientes: false,
      mensaje: `Solo hay ${metricas.totales.ventas} venta(s) registrada(s). Se necesitan al menos 10 ventas para generar recomendaciones fiables.`
    }
  }

  // Sector desconocido con baja confianza
  if (metricas.sector === 'desconocido' || metricas.confianzaSector < 30) {
    return {
      suficientes: true, // Permitir continuar pero avisar
      mensaje: `No se pudo detectar con certeza el tipo de negocio (confianza: ${metricas.confianzaSector}%). Las recomendaciones serán genéricas.`
    }
  }

  return {
    suficientes: true,
    mensaje: ''
  }
}
