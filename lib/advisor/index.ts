// ============================================================
// SISTEMA DE ASESORAMIENTO - ReKalcula
// ============================================================
//
// Exporta todos los mÃ³dulos del sistema de asesoramiento.
//
// ============================================================

// Tipos
export * from './types'

// Principios cientÃ­ficos (inmutables)
export { PRINCIPIOS, getPrincipio, getAdaptacion } from './principios'

// Umbrales cientÃ­ficos
export { 
  UMBRALES_CIENTIFICOS,
  cumpleUmbralesMinimos,
  esTendenciaSignificativa
} from './umbrales-cientificos'
// Reglas de detecciÃ³n
export { REGLAS, getRegla, getReglasPorPrioridad } from './reglas'

// Detector de sector
export { detectarSector, getKeywordsSector } from './detector-sector'

// Agregador de mÃ©tricas
export { agregarMetricas, calcularRangoFechas, calcularRangoFechasPersonalizado } from './agregador-metricas'

// Motor de decisiÃ³n
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

