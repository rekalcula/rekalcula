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
// ============================================================

import { 
  ReglaDeteccion, 
  MetricasNegocio, 
  ProductoConMetricas 
} from './types'

export const REGLAS: ReglaDeteccion[] = [
  // --------------------------------------------------------
  // R01: OPORTUNIDAD OCULTA (Alta prioridad)
  // Producto con buen precio pero pocas ventas
  // --------------------------------------------------------
  {
    id: 'R01',
    nombre: 'Oportunidad oculta',
    descripcion: 'Producto con precio superior a la media pero ventas inferiores al 50% de la media',
    prioridad: 1,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'autoridad',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto con precio >= media y ventas < 50% media
      const candidato = productos.find(p => 
        p.precioUnitario >= medias.precioUnitario &&
        p.ventas < medias.ventasPorProducto * 0.5 &&
        p.ventas > 0 // Tiene al menos alguna venta
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
    descripcion: 'Producto con ventas superiores al 150% de la media y tendencia positiva',
    prioridad: 2,
    tipoOportunidad: 'evaluar_subida_precio',
    principioId: 'prueba_social',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto muy vendido con tendencia positiva
      const candidato = productos.find(p => 
        p.ventas > medias.ventasPorProducto * 1.5 &&
        p.tendencia > 5 // Crecimiento > 5%
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
    descripcion: 'Producto con tendencia inferior al -15%',
    prioridad: 1,
    tipoOportunidad: 'investigar_declive',
    principioId: 'aversion_perdida',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos } = metricas
      
      // Buscar producto con declive significativo
      const candidato = productos.find(p => 
        p.tendencia < -15 &&
        p.ventas > 0 // Tiene ventas para comparar
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
    descripcion: 'Producto con ventas superiores al 200% de la media',
    prioridad: 2,
    tipoOportunidad: 'potenciar_estrella',
    principioId: 'prueba_social',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto estrella
      const candidato = productos.find(p => 
        p.ventas > medias.ventasPorProducto * 2
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
    descripcion: 'Producto con ventas inferiores al 20% de la media y tendencia negativa',
    prioridad: 3,
    tipoOportunidad: 'evaluar_eliminacion',
    principioId: 'paradoja_eleccion',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto con muy pocas ventas y en declive
      const candidato = productos.find(p => 
        p.ventas < medias.ventasPorProducto * 0.2 &&
        p.ventas > 0 &&
        p.tendencia < 0
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
    descripcion: 'Producto con precio superior al 150% de la media',
    prioridad: 2,
    tipoOportunidad: 'usar_como_ancla',
    principioId: 'anclaje',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto premium que pueda servir de ancla
      const candidato = productos.find(p => 
        p.precioUnitario > medias.precioUnitario * 1.5
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
    descripcion: 'Más de 10 productos donde más del 50% tienen ventas bajo la media',
    prioridad: 2,
    tipoOportunidad: 'simplificar_opciones',
    principioId: 'paradoja_eleccion',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      if (productos.length < 10) return null
      
      const productosDebiles = productos.filter(p => 
        p.ventas < medias.ventasPorProducto
      )
      
      // Si más del 50% están bajo la media, hay exceso
      if (productosDebiles.length > productos.length * 0.5) {
        // Devolver el de menos ventas como ejemplo
        return productosDebiles.sort((a, b) => a.ventas - b.ventas)[0] || null
      }
      
      return null
    }
  },

  // --------------------------------------------------------
  // R08: OPORTUNIDAD DE ESCASEZ (Baja prioridad)
  // Producto con ventas concentradas en ciertos días/horas
  // --------------------------------------------------------
  {
    id: 'R08',
    nombre: 'Oportunidad de escasez',
    descripcion: 'Producto estrella que puede beneficiarse de edición limitada',
    prioridad: 3,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'escasez',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { destacados } = metricas
      
      // El producto más vendido puede usar escasez para aumentar valor percibido
      if (destacados.masVendido && destacados.masVendido.tendencia >= 0) {
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
    descripcion: 'Producto con precio bajo que podría usarse como detalle/cortesía',
    prioridad: 3,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'reciprocidad',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto barato (< 30% del precio medio)
      const candidato = productos.find(p => 
        p.precioUnitario < medias.precioUnitario * 0.3 &&
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
    descripcion: 'Producto medio que podría beneficiarse de una estructura de 3 opciones',
    prioridad: 2,
    tipoOportunidad: 'aplicar_efecto_senuelo',
    principioId: 'efecto_senuelo',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto con precio cercano a la media (80%-120%)
      const candidato = productos.find(p => 
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
    descripcion: 'Producto con buen margen que debería tener mejor posición',
    prioridad: 3,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'primacia_recencia',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Buscar producto con buen precio pero no es el más vendido
      const candidato = productos.find(p => 
        p.precioUnitario >= medias.precioUnitario * 1.2 &&
        p.ranking > 3 && // No está en top 3
        p.ventas > 0
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
      
      // Si hay producto barato y caro del mismo tipo, sugerir crear medio
      if (productos.length >= 2) {
        const ordenados = [...productos].sort((a, b) => a.precioUnitario - b.precioUnitario)
        const barato = ordenados[0]
        const caro = ordenados[ordenados.length - 1]
        
        // Si la diferencia de precio es grande, hay oportunidad
        if (caro.precioUnitario > barato.precioUnitario * 2) {
          return caro // Sugerir crear opción media basada en el caro
        }
      }
      
      return null
    }
  },

  // --------------------------------------------------------
  // R13: CRECIMIENTO ACELERADO (Alta prioridad)
  // Producto nuevo con crecimiento muy rápido
  // --------------------------------------------------------
  {
    id: 'R13',
    nombre: 'Crecimiento acelerado',
    descripcion: 'Producto con tendencia superior al +25%',
    prioridad: 1,
    tipoOportunidad: 'potenciar_estrella',
    principioId: 'prueba_social',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos } = metricas
      
      // Buscar producto con crecimiento muy alto
      const candidato = productos.find(p => 
        p.tendencia > 25
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
    descripcion: 'Producto con ingreso por unidad alto pero pocas ventas',
    prioridad: 2,
    tipoOportunidad: 'aumentar_visibilidad',
    principioId: 'autoridad',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Producto con precio alto y ventas bajas (pero no mínimas)
      const candidato = productos.find(p => 
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
    descripcion: 'Producto con alto volumen de ventas pero tendencia negativa',
    prioridad: 1,
    tipoOportunidad: 'investigar_declive',
    principioId: 'aversion_perdida',
    evaluar: (metricas: MetricasNegocio): ProductoConMetricas | null => {
      const { productos, medias } = metricas
      
      // Producto importante (ventas altas) que está cayendo
      const candidato = productos.find(p => 
        p.ventas > medias.ventasPorProducto &&
        p.tendencia < -5
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
