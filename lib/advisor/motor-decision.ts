// ============================================================
// MOTOR DE DECISION - EVALUA REGLAS Y GENERA OPORTUNIDADES
// ============================================================
//
// Este es el cerebro del sistema. Evalua cada regla contra
// las metricas del negocio y genera oportunidades estructuradas.
//
// IMPORTANTE: Todo es CODIGO PURO. La IA NO participa aqui.
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
// FUNCION PRINCIPAL: Detectar oportunidades
// --------------------------------------------------------
export function detectarOportunidades(
  metricas: MetricasNegocio,
  maxOportunidades: number = 5
): OportunidadDetectada[] {
  
  const oportunidades: OportunidadDetectada[] = []

  // Evaluar cada regla
  for (const regla of REGLAS) {
    try {
      // Ejecutar la funcion de evaluacion de la regla
      const productoDetectado = regla.evaluar(metricas)

      if (productoDetectado) {
        // Obtener el principio cientifico asociado
        const principio = getPrincipio(regla.principioId)

        if (!principio) {
          console.warn(`Principio no encontrado: ${regla.principioId}`)
          continue
        }

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
            anio: principio.anio
          }
        })
      }
    } catch (error) {
      console.error(`Error evaluando regla ${regla.id}:`, error)
    }
  }

  // DEDUPLICACION: Eliminar productos repetidos, mantener solo la oportunidad de mayor prioridad
  const oportunidadesUnicas = deduplicarPorProducto(oportunidades)

  // Ordenar por prioridad (1 = alta, 3 = baja)
  oportunidadesUnicas.sort((a, b) => a.prioridad - b.prioridad)

  // Limitar cantidad de oportunidades
  return oportunidadesUnicas.slice(0, maxOportunidades)
}

// --------------------------------------------------------
// FUNCION: Deduplicar oportunidades por producto
// --------------------------------------------------------
function deduplicarPorProducto(oportunidades: OportunidadDetectada[]): OportunidadDetectada[] {
  const mapa = new Map<string, OportunidadDetectada>()

  for (const oportunidad of oportunidades) {
    const nombreProducto = oportunidad.producto.nombre.toLowerCase().trim()
    
    const existente = mapa.get(nombreProducto)
    
    if (!existente) {
      // No existe, agregar
      mapa.set(nombreProducto, oportunidad)
    } else {
      // Ya existe, comparar prioridades
      if (oportunidad.prioridad < existente.prioridad) {
        // Nueva tiene mayor prioridad (1 > 2 > 3), reemplazar
        mapa.set(nombreProducto, oportunidad)
      }
      // Si tienen la misma prioridad, mantener la primera
    }
  }

  return Array.from(mapa.values())
}

// --------------------------------------------------------
// FUNCION: Filtrar oportunidades por prioridad
// --------------------------------------------------------
export function filtrarPorPrioridad(
  oportunidades: OportunidadDetectada[],
  prioridad: Prioridad
): OportunidadDetectada[] {
  return oportunidades.filter(o => o.prioridad === prioridad)
}

// --------------------------------------------------------
// FUNCION: Obtener resumen de oportunidades
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
// FUNCION: Verificar si hay datos suficientes
// --------------------------------------------------------
export function hayDatosSuficientes(metricas: MetricasNegocio): {
  suficientes: boolean
  mensaje: string
} {
  // Minimo 3 productos para analisis significativo
  if (metricas.productos.length < 3) {
    return {
      suficientes: false,
      mensaje: `Solo hay ${metricas.productos.length} producto(s) registrado(s). Se necesitan al menos 3 productos diferentes para generar recomendaciones significativas.`
    }
  }

  // Minimo 10 ventas totales
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
      mensaje: `No se pudo detectar con certeza el tipo de negocio (confianza: ${metricas.confianzaSector}%). Las recomendaciones seran genericas.`
    }
  }

  return {
    suficientes: true,
    mensaje: ''
  }
}