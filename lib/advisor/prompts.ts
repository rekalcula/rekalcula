// ============================================================
// PROMPTS DEL SISTEMA - INSTRUCCIONES RESTRICTIVAS PARA LA IA
// ============================================================
//
// IMPORTANTE: La IA SOLO redacta mensajes basándose en datos
// proporcionados. NUNCA decide, NUNCA inventa, NUNCA añade.
//
// ============================================================

import { OportunidadDetectada, Sector } from './types'
import { getPrincipio, getAdaptacion } from './principios'

// --------------------------------------------------------
// PROMPT DE SISTEMA (Instrucciones restrictivas)
// --------------------------------------------------------
export const SYSTEM_PROMPT = `Eres un REDACTOR de mensajes para un sistema de asesoramiento de negocios.

=== REGLAS ABSOLUTAS (VIOLACIÓN = FALLO) ===

❌ PROHIBIDO INVENTAR:
- NO inventes datos, porcentajes o estadísticas
- NO inventes principios psicológicos
- NO inventes estudios o autores
- NO añadas recomendaciones adicionales
- NO uses frases como "también podrías", "otra opción sería"
- NO uses "generalmente", "normalmente", "suele ocurrir"
- NO menciones porcentajes de éxito o mejora

❌ PROHIBIDO DECIDIR:
- NO decides qué recomendar (ya está decidido)
- NO evalúas si la recomendación es buena
- NO sugieres alternativas
- NO contradigas la acción indicada

✅ TU ÚNICA FUNCIÓN:
- Convertir datos estructurados en 2-3 frases legibles
- Usar SOLO los datos proporcionados en el input
- Mencionar el principio psicológico indicado
- Adaptar el lenguaje al sector del negocio
- Ser claro, directo y accionable

=== FORMATO DE RESPUESTA ===

- Máximo 3 oraciones cortas
- Primera oración: El dato/problema detectado
- Segunda oración: La acción recomendada
- Tercera oración (opcional): El principio que lo respalda
- Tono: Profesional pero cercano, sin tecnicismos
- NO uses introducciones ("Bueno...", "Mira...")
- NO uses despedidas ("Espero que...", "Suerte...")

=== EJEMPLO ===

INPUT:
{
  "producto": "Tostada con tomate",
  "ventas": 23,
  "mediaVentas": 84,
  "tendencia": -8,
  "principio": "Autoridad",
  "sector": "cafeteria",
  "accion": "aumentar_visibilidad"
}

OUTPUT CORRECTO:
"Tu Tostada con tomate tiene 23 ventas cuando la media es 84. Márcala como 'Recomendación del barista' en la pizarra o carta. Según el principio de Autoridad (Cialdini), los clientes confían en las sugerencias del establecimiento."

OUTPUT INCORRECTO (viola reglas):
"Tu Tostada con tomate podría aumentar un 40% sus ventas si la destacas. También podrías bajar el precio o hacer promociones. Generalmente esto funciona muy bien en cafeterías."

=== SI NO PUEDES REDACTAR ===

Si los datos son insuficientes o confusos, responde EXACTAMENTE:
"No es posible generar una recomendación con los datos proporcionados."

NO intentes rellenar ni inventar.`

// --------------------------------------------------------
// FUNCIÓN: Generar prompt de usuario para una oportunidad
// --------------------------------------------------------
export function generarPromptUsuario(oportunidad: OportunidadDetectada): string {
  const principio = getPrincipio(oportunidad.principio.id)
  const adaptacion = getAdaptacion(oportunidad.principio.id, oportunidad.contexto.sector)

  const datos = {
    producto: oportunidad.producto.nombre,
    ventas: oportunidad.producto.ventas,
    ingresos: oportunidad.producto.ingresos,
    tendencia: oportunidad.producto.tendencia,
    mediaVentas: Math.round(oportunidad.contexto.mediaVentas),
    mediaPrecio: oportunidad.contexto.mediaPrecio,
    sector: traducirSector(oportunidad.contexto.sector),
    tipoOportunidad: traducirTipoOportunidad(oportunidad.tipo),
    principio: {
      nombre: principio?.nombre || oportunidad.principio.nombre,
      autor: principio?.autor || oportunidad.principio.autor,
      aplicacion: adaptacion
    }
  }

  return `Redacta un mensaje breve (máximo 3 oraciones) para esta oportunidad detectada.

DATOS (usa SOLO estos, no inventes):
- Producto: ${datos.producto}
- Ventas del período: ${datos.ventas}
- Media de ventas: ${datos.mediaVentas}
- Tendencia: ${datos.tendencia > 0 ? '+' : ''}${datos.tendencia}%
- Ingresos: €${datos.ingresos.toFixed(2)}
- Sector: ${datos.sector}

ACCIÓN A COMUNICAR: ${datos.tipoOportunidad}

PRINCIPIO CIENTÍFICO A MENCIONAR:
- Nombre: ${datos.principio.nombre}
- Autor: ${datos.principio.autor}
- Aplicación en ${datos.sector}: "${datos.principio.aplicacion}"

Recuerda: NO inventes datos, NO añadas recomendaciones extra, NO uses "podrías" ni "también".`
}

// --------------------------------------------------------
// FUNCIÓN: Generar título para una oportunidad
// --------------------------------------------------------
export function generarTitulo(oportunidad: OportunidadDetectada): string {
  const { tipo, producto } = oportunidad
  
  const titulos: Record<string, string> = {
    'aumentar_visibilidad': `Destaca "${producto.nombre}"`,
    'evaluar_subida_precio': `Oportunidad de precio en "${producto.nombre}"`,
    'investigar_declive': `Atención: "${producto.nombre}" está cayendo`,
    'potenciar_estrella': `Potencia tu estrella: "${producto.nombre}"`,
    'evaluar_eliminacion': `Evalúa simplificar: "${producto.nombre}"`,
    'crear_combo': `Oportunidad de combo con "${producto.nombre}"`,
    'usar_como_ancla': `Usa "${producto.nombre}" como ancla de precio`,
    'promocion_hora_valle': `Promociona "${producto.nombre}" en horas valle`,
    'simplificar_opciones': `Simplifica tu carta`,
    'aplicar_efecto_senuelo': `Crea opciones para "${producto.nombre}"`
  }

  return titulos[tipo] || `Oportunidad en "${producto.nombre}"`
}

// --------------------------------------------------------
// FUNCIÓN: Traducir sector a español legible
// --------------------------------------------------------
function traducirSector(sector: Sector): string {
  const traducciones: Record<Sector, string> = {
    cafeteria: 'cafetería',
    restaurante: 'restaurante',
    peluqueria: 'peluquería',
    tienda: 'tienda',
    taller: 'taller mecánico',
    desconocido: 'negocio'
  }
  return traducciones[sector] || 'negocio'
}

// --------------------------------------------------------
// FUNCIÓN: Traducir tipo de oportunidad
// --------------------------------------------------------
function traducirTipoOportunidad(tipo: string): string {
  const traducciones: Record<string, string> = {
    'aumentar_visibilidad': 'Destacar este producto para aumentar sus ventas',
    'evaluar_subida_precio': 'Evaluar una subida de precio moderada (5-10%)',
    'investigar_declive': 'Investigar por qué está bajando y tomar acción',
    'potenciar_estrella': 'Aprovechar su popularidad para maximizar beneficio',
    'evaluar_eliminacion': 'Considerar eliminar para simplificar la oferta',
    'crear_combo': 'Crear un pack o menú que incluya este producto',
    'usar_como_ancla': 'Usar su precio alto para que otros parezcan razonables',
    'promocion_hora_valle': 'Promocionar en horarios de baja actividad',
    'simplificar_opciones': 'Reducir opciones para facilitar la decisión del cliente',
    'aplicar_efecto_senuelo': 'Crear versiones pequeña/mediana/grande'
  }
  return traducciones[tipo] || tipo
}

// --------------------------------------------------------
// PLANTILLAS DE FALLBACK (si la IA falla o no está disponible)
// --------------------------------------------------------
export const PLANTILLAS_FALLBACK: Record<string, string> = {
  'aumentar_visibilidad': 
    'El producto "{producto}" tiene {ventas} ventas (media: {mediaVentas}). ' +
    'Destacarlo como recomendación puede aumentar su visibilidad. ' +
    'Según el principio de {principio} ({autor}), los clientes confían en las sugerencias del establecimiento.',

  'evaluar_subida_precio': 
    'El producto "{producto}" tiene {ventas} ventas con tendencia {tendencia}%. ' +
    'Su alta demanda permite evaluar una subida de precio del 5-10%. ' +
    'Según el principio de {principio}, la demanda sostenida tolera ajustes moderados.',

  'investigar_declive': 
    'El producto "{producto}" muestra una tendencia de {tendencia}%. ' +
    'Es importante investigar las causas y tomar acción. ' +
    'Según el principio de {principio} ({autor}), actuar a tiempo evita pérdidas mayores.',

  'potenciar_estrella': 
    'El producto "{producto}" es tu más vendido con {ventas} ventas. ' +
    'Puedes destacarlo como "el más pedido" para reforzar su atractivo. ' +
    'Según el principio de {principio} ({autor}), los clientes siguen lo que otros eligen.',

  'evaluar_eliminacion': 
    'El producto "{producto}" tiene solo {ventas} ventas (media: {mediaVentas}). ' +
    'Considera eliminarlo para simplificar tu oferta. ' +
    'Según el principio de {principio} ({autor}), menos opciones facilitan la decisión.',

  'crear_combo': 
    'El producto "{producto}" podría combinarse en un pack o menú. ' +
    'Los combos simplifican la elección y aumentan el ticket medio. ' +
    'Según el principio de {principio} ({autor}), menos decisiones = más compras.',

  'usar_como_ancla': 
    'El producto "{producto}" tiene un precio superior a la media. ' +
    'Colócalo primero en la carta para que otros precios parezcan más razonables. ' +
    'Según el principio de {principio} ({autor}), el primer precio influye en la percepción.',

  'promocion_hora_valle': 
    'El producto "{producto}" puede promocionarse en horas de menor actividad. ' +
    'Una oferta limitada en tiempo crea sensación de urgencia. ' +
    'Según el principio de {principio} ({autor}), lo limitado se percibe como más valioso.',

  'simplificar_opciones': 
    'Tienes muchos productos con ventas bajo la media. ' +
    'Reducir opciones puede aumentar las ventas totales. ' +
    'Según el principio de {principio} ({autor}), demasiadas opciones paralizan la decisión.',

  'aplicar_efecto_senuelo': 
    'El producto "{producto}" podría tener versiones pequeña, mediana y grande. ' +
    'La mayoría de clientes elegirá la opción intermedia. ' +
    'Según el principio de {principio} ({autor}), entre tres opciones se elige la del medio.'
}

// --------------------------------------------------------
// FUNCIÓN: Aplicar plantilla de fallback
// --------------------------------------------------------
export function aplicarPlantillaFallback(
  oportunidad: OportunidadDetectada
): string {
  const plantilla = PLANTILLAS_FALLBACK[oportunidad.tipo]
  
  if (!plantilla) {
    return `Se detectó una oportunidad en "${oportunidad.producto.nombre}" basada en el principio de ${oportunidad.principio.nombre}.`
  }

  return plantilla
    .replace('{producto}', oportunidad.producto.nombre)
    .replace('{ventas}', String(oportunidad.producto.ventas))
    .replace('{mediaVentas}', String(Math.round(oportunidad.contexto.mediaVentas)))
    .replace('{tendencia}', `${oportunidad.producto.tendencia > 0 ? '+' : ''}${oportunidad.producto.tendencia}`)
    .replace('{principio}', oportunidad.principio.nombre)
    .replace('{autor}', oportunidad.principio.autor)
}