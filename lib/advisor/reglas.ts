// ============================================================
// REGLAS DE DETECCIÓN - EVALUADAS POR CÓDIGO (NO POR IA)
// ============================================================
//
// Cada regla tiene:
// - Una condición evaluable con código
// - Un tipo de oportunidad que genera
// - Un principio científico que la respalda
//
// La IA NUNCA evalúa estas reglas, solo redacta el resultado.
//
// ACTUALIZADO: Todas las reglas usan umbrales científicos basados en:
// - Porcentajes relativos (no absolutos)
// - Impacto económico real
// - Significancia estadística
//
// ============================================================

import { 
  ReglaDeteccion,
  MetricasNegocio,
  ProductoConMetricas
} from './types'
import { 
  UMBRALES_CIENTIFICOS,
  esTendenciaSignificativa
} from './umbrales-cientificos'

export const REGLAS: ReglaDeteccion[] = [
  // --------------------------------------------------------
  // R01: OPORTUNIDAD OCULTA (Alta prioridad)
  // Producto con buen precio pero pocas ventas
  // --------------------------------------------------------
  {
    id: 'R01',
    nombre: 'Oportunidad oculta',
    descripcion: 'Producto premium (precio >50% media) con ventas bajas pero que cumple umbrales mínimos',
    prioridad: 1,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'autoridad',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos && // Debe cumplir umbrales científicos
        p.precioUnitario >= medias.precioUnitario * UMBRALES_CIENTIFICOS.PRECIO_PREMIUM_MULTIPLICADOR &&
        p.ventas < medias.ventasPorProducto * 0.5
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R02: SUBIDA DE PRECIO VIABLE (Media prioridad)
  // Producto muy vendido con tendencia positiva
  // --------------------------------------------------------
  {
    id: 'R02',
    nombre: 'Subida de precio viable',
    descripcion: 'Producto estrella (ventas >2x media) con crecimiento significativo (>10%)',
    prioridad: 2,
    tipoOportunidad: 'evaluar_subida_precio',
    principioId: 'prueba_social',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.ventas > medias.ventasPorProducto * UMBRALES_CIENTIFICOS.PRODUCTO_ESTRELLA_MULTIPLICADOR &&
        esTendenciaSignificativa(p.tendencia, 'crecimiento')
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R03: PRODUCTO EN DECLIVE (Alta prioridad)
  // Producto con tendencia muy negativa
  // --------------------------------------------------------
  {
    id: 'R03',
    nombre: 'Producto en declive',
    descripcion: 'Producto con declive significativo (<-10%) y cumple umbrales mínimos',
    prioridad: 1,
    tipoOportunidad: 'investigar_declive',
    principioId: 'aversion_perdida',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        esTendenciaSignificativa(p.tendencia, 'declive')
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R04: PRODUCTO ESTRELLA (Media prioridad)
  // Producto con ventas muy superiores a la media
  // --------------------------------------------------------
  {
    id: 'R04',
    nombre: 'Producto estrella',
    descripcion: 'Producto con ventas >2x media y >5% de participación',
    prioridad: 2,
    tipoOportunidad: 'potenciar_estrella',
    principioId: 'prueba_social',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.ventas > medias.ventasPorProducto * UMBRALES_CIENTIFICOS.PRODUCTO_ESTRELLA_MULTIPLICADOR
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R05: PRODUCTO LASTRE (Baja prioridad)
  // Producto con muy pocas ventas y tendencia negativa
  // --------------------------------------------------------
  {
    id: 'R05',
    nombre: 'Producto lastre',
    descripcion: 'Producto con ventas <20% media, declive y bajo impacto económico',
    prioridad: 3,
    tipoOportunidad: 'evaluar_eliminacion',
    principioId: 'paradoja_eleccion',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.ventas < medias.ventasPorProducto * UMBRALES_CIENTIFICOS.PRODUCTO_BAJO_MULTIPLICADOR &&
        p.ventasAnteriores >= UMBRALES_CIENTIFICOS.VENTAS_MINIMAS_POR_PERIODO &&
        p.tendencia < 0 &&
        p.porcentajeIngresos < UMBRALES_CIENTIFICOS.PARTICIPACION_INGRESOS_MINIMA * 100
      )
      
      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R06: OPORTUNIDAD DE ANCLA (Media prioridad)
  // Producto con precio muy superior a la media
  // --------------------------------------------------------
  {
    id: 'R06',
    nombre: 'Oportunidad de ancla',
    descripcion: 'Producto premium (precio >1.5x media) que cumple umbrales',
    prioridad: 2,
    tipoOportunidad: 'usar_como_ancla',
    principioId: 'anclaje',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.precioUnitario > medias.precioUnitario * UMBRALES_CIENTIFICOS.PRECIO_PREMIUM_MULTIPLICADOR
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R07: EXCESO DE OPCIONES (Media prioridad)
  // Demasiados productos con pocas ventas cada uno
  // --------------------------------------------------------
  {
    id: 'R07',
    nombre: 'Exceso de opciones',
    descripcion: 'Más de 10 productos donde >50% tienen ventas bajo la media',
    prioridad: 2,
    tipoOportunidad: 'simplificar_opciones',
    principioId: 'paradoja_eleccion',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      if (productos.length < 10) return null

      const productosDebiles = productos.filter(p =>
        p.ventas < medias.ventasPorProducto
      )

      if (productosDebiles.length > productos.length * 0.5) {
        return productosDebiles.sort((a, b) => a.ventas - b.ventas)[0] || null
      }

      return null
    }
  },

  // --------------------------------------------------------
  // R08: OPORTUNIDAD DE ESCASEZ (Baja prioridad)
  // Producto estrella que puede beneficiarse de edición limitada
  // --------------------------------------------------------
  {
    id: 'R08',
    nombre: 'Oportunidad de escasez',
    descripcion: 'Producto estrella que cumple umbrales con tendencia positiva o estable',
    prioridad: 3,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'escasez',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { destacados } = metricas

      if (destacados.masVendido && 
          destacados.masVendido.cumpleUmbralesMinimos &&
          destacados.masVendido.tendencia >= 0) {
        return destacados.masVendido
      }
      
      return null
    }
  },

  // --------------------------------------------------------
  // R09: OPORTUNIDAD DE RECIPROCIDAD (Baja prioridad)
  // Producto de bajo costo que podría regalarse
  // --------------------------------------------------------
  {
    id: 'R09',
    nombre: 'Oportunidad de reciprocidad',
    descripcion: 'Producto económico (precio <30% media) que cumple umbrales mínimos',
    prioridad: 3,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'reciprocidad',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.precioUnitario < medias.precioUnitario * UMBRALES_CIENTIFICOS.PRECIO_ECONOMICO_MULTIPLICADOR &&
        p.precioUnitario > 0
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R10: EFECTO SEÑUELO (Media prioridad)
  // Detectar si hay oportunidad de crear tres opciones
  // --------------------------------------------------------
  {
    id: 'R10',
    nombre: 'Oportunidad de efecto señuelo',
    descripcion: 'Producto medio (precio 80-120% media) que cumple umbrales',
    prioridad: 2,
    tipoOportunidad: 'aplicar_efecto_senuelo',
    principioId: 'efecto_senuelo',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.precioUnitario >= medias.precioUnitario * 0.8 &&
        p.precioUnitario <= medias.precioUnitario * 1.2 &&
        p.ventas >= medias.ventasPorProducto * 0.5
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R11: POSICIÓN EN CARTA (Baja prioridad)
  // Producto rentable que debería estar al inicio o final
  // --------------------------------------------------------
  {
    id: 'R11',
    nombre: 'Oportunidad de posición',
    descripcion: 'Producto premium (precio >1.2x media) fuera del top 3 que cumple umbrales',
    prioridad: 3,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'primacia_recencia',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.precioUnitario >= medias.precioUnitario * 1.2 &&
        p.ranking > 3
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R12: EFECTO COMPROMISO (Media prioridad)
  // Oportunidad de crear opción intermedia rentable
  // --------------------------------------------------------
  {
    id: 'R12',
    nombre: 'Oportunidad de efecto compromiso',
    descripcion: 'Oportunidad de crear tres opciones donde la media sea la más rentable',
    prioridad: 2,
    tipoOportunidad: 'aplicar_efecto_senuelo',
    principioId: 'efecto_compromiso',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos } = metricas

      const productosValidos = productos.filter(p => p.cumpleUmbralesMinimos)

      if (productosValidos.length >= 2) {
        const ordenados = [...productosValidos].sort((a, b) => a.precioUnitario - b.precioUnitario)
        const barato = ordenados[0]
        const caro = ordenados[ordenados.length - 1]

        if (caro.precioUnitario > barato.precioUnitario * 2) {
          return caro
        }
      }

      return null
    }
  },

  // --------------------------------------------------------
  // R13: CRECIMIENTO ACELERADO (Alta prioridad)
  // Producto con crecimiento muy rápido y significativo
  // --------------------------------------------------------
  {
    id: 'R13',
    nombre: 'Crecimiento acelerado',
    descripcion: 'Producto con crecimiento >15%, >5% participación y >2% impacto económico',
    prioridad: 1,
    tipoOportunidad: 'potenciar_estrella',
    principioId: 'prueba_social',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.tendencia >= UMBRALES_CIENTIFICOS.TENDENCIA_CRECIMIENTO_ALTA * 100
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R14: PRODUCTO INFRAUTILIZADO (Media prioridad)
  // Producto con buen ingreso unitario pero baja rotación
  // --------------------------------------------------------
  {
    id: 'R14',
    nombre: 'Producto infrautilizado',
    descripcion: 'Producto premium (>1.3x media) con ventas 20-70% de la media que cumple umbrales',
    prioridad: 2,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'autoridad',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.precioUnitario > medias.precioUnitario * 1.3 &&
        p.ventas < medias.ventasPorProducto * 0.7 &&
        p.ventas >= medias.ventasPorProducto * 0.2
      )

      return candidato || null
    }
  },

  // --------------------------------------------------------
  // R15: PÉRDIDA POTENCIAL (Alta prioridad)
  // Producto importante que está cayendo
  // --------------------------------------------------------
  {
    id: 'R15',
    nombre: 'Pérdida potencial',
    descripcion: 'Producto con alto volumen (>media) y declive significativo (<-10%)',
    prioridad: 1,
    tipoOportunidad: 'investigar_declive',
    principioId: 'aversion_perdida',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas

      const candidato = productos.find(p =>
        p.cumpleUmbralesMinimos &&
        p.ventas > medias.ventasPorProducto &&
        esTendenciaSignificativa(p.tendencia, 'declive')
      )

      return candidato || null
    }
  }
]

// --------------------------------------------------------
// FUNCIÓN: Obtener regla por ID
// --------------------------------------------------------
export function getRegla(id: string): ReglaDeteccion | undefined {
  return REGLAS.find(r => r.id === id)
}

// --------------------------------------------------------
// FUNCIÓN: Obtener reglas por prioridad
// --------------------------------------------------------
export function getReglasPorPrioridad(prioridad: 1 | 2 | 3): ReglaDeteccion[] {
  return REGLAS.filter(r => r.prioridad === prioridad)
}