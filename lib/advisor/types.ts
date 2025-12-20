// ============================================================
// TIPOS DEL SISTEMA DE ASESORAMIENTO - REKALCULA
// ============================================================

// Sectores detectables automáticamente
export type Sector = 
  | 'cafeteria' 
  | 'restaurante' 
  | 'peluqueria' 
  | 'tienda' 
  | 'taller' 
  | 'desconocido'

// IDs de principios científicos (solo estos 10, inmutables)
export type PrincipioId = 
  | 'autoridad'
  | 'escasez'
  | 'anclaje'
  | 'prueba_social'
  | 'reciprocidad'
  | 'paradoja_eleccion'
  | 'efecto_senuelo'
  | 'aversion_perdida'
  | 'primacia_recencia'
  | 'efecto_compromiso'

// Tipos de oportunidad detectables
export type TipoOportunidad = 
  | 'aumentar_visibilidad'
  | 'evaluar_subida_precio'
  | 'investigar_declive'
  | 'potenciar_estrella'
  | 'evaluar_eliminacion'
  | 'crear_combo'
  | 'usar_como_ancla'
  | 'promocion_hora_valle'
  | 'simplificar_opciones'
  | 'aplicar_efecto_senuelo'

// Prioridad de la recomendación
export type Prioridad = 1 | 2 | 3 // 1 = Alta, 2 = Media, 3 = Baja

// ============================================================
// PRINCIPIO PSICOLÓGICO (Base científica verificable)
// ============================================================
export interface PrincipioPsicologico {
  id: PrincipioId
  nombre: string
  autor: string
  estudio: string
  año: number
  publicacion: string
  hallazgo: string
  aplicacionComercial: string
  // Cómo se adapta el lenguaje a cada sector
  adaptaciones: {
    [key in Sector]?: string
  }
}

// ============================================================
// PRODUCTO CON MÉTRICAS CALCULADAS
// ============================================================
export interface ProductoConMetricas {
  nombre: string
  ventas: number
  ingresos: number
  precioUnitario: number
  porcentajeVentas: number
  porcentajeIngresos: number
  tendencia: number // Porcentaje de cambio vs período anterior
  ranking: number
}

// ============================================================
// MÉTRICAS AGREGADAS DEL NEGOCIO
// ============================================================
export interface MetricasNegocio {
  sector: Sector
  confianzaSector: number // 0-100
  periodo: 'dia' | 'semana' | 'mes'
  
  productos: ProductoConMetricas[]
  
  totales: {
    ventas: number
    ingresos: number
    productosUnicos: number
  }
  
  medias: {
    ventasPorProducto: number
    precioUnitario: number
    ingresosPorProducto: number
  }
  
  destacados: {
    masVendido: ProductoConMetricas | null
    menosVendido: ProductoConMetricas | null
    mayorIngreso: ProductoConMetricas | null
    mayorCrecimiento: ProductoConMetricas | null
    mayorDeclive: ProductoConMetricas | null
  }
}

// ============================================================
// REGLA DE DETECCIÓN (Evaluada por código, NO por IA)
// ============================================================
export interface ReglaDeteccion {
  id: string
  nombre: string
  descripcion: string
  prioridad: Prioridad
  
  // La condición se evalúa en código TypeScript
  // Devuelve el producto que cumple la condición o null
  evaluar: (metricas: MetricasNegocio) => ProductoConMetricas | null
  
  // Qué tipo de oportunidad representa
  tipoOportunidad: TipoOportunidad
  
  // Qué principio científico respalda la acción
  principioId: PrincipioId
}

// ============================================================
// OPORTUNIDAD DETECTADA (Output del motor de decisión)
// ============================================================
export interface OportunidadDetectada {
  id: string
  reglaId: string
  tipo: TipoOportunidad
  prioridad: Prioridad
  
  producto: {
    nombre: string
    ventas: number
    ingresos: number
    tendencia: number
  }
  
  contexto: {
    mediaVentas: number
    mediaPrecio: number
    sector: Sector
  }
  
  principio: {
    id: PrincipioId
    nombre: string
    autor: string
    año: number
  }
}

// ============================================================
// RECOMENDACIÓN FINAL (Para mostrar al usuario)
// ============================================================
export interface Recomendacion {
  id: string
  prioridad: Prioridad
  
  // Generado por IA basándose en la oportunidad
  titulo: string
  mensaje: string
  
  // Datos de respaldo
  producto: string
  datosReales: {
    ventas: number
    mediaVentas: number
    tendencia: number
    ingresos: number
  }
  
  // Principio científico aplicado
  principio: {
    id: PrincipioId
    nombre: string
    autor: string
    año: number
    publicacion: string
  }
  
  // Metadatos
  sector: Sector
  fechaGeneracion: string
}

// ============================================================
// RESPUESTA DE LA API
// ============================================================
export interface AdvisorResponse {
  success: boolean
  sector: Sector
  confianzaSector: number
  periodo: string
  recomendaciones: Recomendacion[]
  sinRecomendaciones?: boolean
  mensaje?: string
}