// ============================================================
// SISTEMA DE ASESORAMIENTO - ReKalcula
// ============================================================
//
// Exporta todos los módulos del sistema de asesoramiento.
//
// ============================================================

// Tipos
export * from './types'

// Principios científicos (inmutables)
export { PRINCIPIOS, getPrincipio, getAdaptacion } from './principios'

// Reglas de detección
export { REGLAS, getRegla, getReglasPorPrioridad } from './reglas'

// Detector de sector
export { detectarSector, getKeywordsSector } from './detector-sector'

// Agregador de métricas
export { agregarMetricas, calcularRangoFechas } from './agregador-metricas'

// Motor de decisión
export { 
  detectarOportunidades, 
  filtrarPorPrioridad, 
  obtenerResumen,
  hayDatosSuficientes 
} from './motor-decision'

// Generador de mensajes
export { 
  generarRecomendaciones, 
  generarRecomendacionesSinIA 
} from './generador-mensajes'

// Prompts (para testing/debug)
export { 
  SYSTEM_PROMPT, 
  generarPromptUsuario, 
  generarTitulo,
  aplicarPlantillaFallback,
  PLANTILLAS_FALLBACK 
} from './prompts'

