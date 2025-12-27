// ============================================================
// GENERADOR DE MENSAJES - USA IA CON RESTRICCIONES ESTRICTAS
// ============================================================
//
// Este módulo llama a Claude para redactar mensajes legibles,
// pero con validación estricta del output.
//
// Si la IA falla o inventa, se usa la plantilla de fallback.
//
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import { 
  OportunidadDetectada, 
  Recomendacion 
} from './types'
import { getPrincipio } from './principios'
import { 
  SYSTEM_PROMPT, 
  generarPromptUsuario, 
  generarTitulo,
  aplicarPlantillaFallback 
} from './prompts'

// --------------------------------------------------------
// FUNCIÓN PRINCIPAL: Generar recomendaciones completas
// --------------------------------------------------------
export async function generarRecomendaciones(
  oportunidades: OportunidadDetectada[],
  usarIA: boolean = true
): Promise<Recomendacion[]> {
  
  const recomendaciones: Recomendacion[] = []

  for (const oportunidad of oportunidades) {
    try {
      let mensaje: string

      if (usarIA) {
        // Intentar generar con IA
        mensaje = await generarMensajeConIA(oportunidad)
        
        // Validar que no inventó
        if (!validarMensaje(mensaje, oportunidad)) {
          console.warn(`Mensaje de IA no pasó validación para ${oportunidad.id}, usando fallback`)
          mensaje = aplicarPlantillaFallback(oportunidad)
        }
      } else {
        // Usar plantilla directamente
        mensaje = aplicarPlantillaFallback(oportunidad)
      }

      const principio = getPrincipio(oportunidad.principio.id)

      recomendaciones.push({
        id: oportunidad.id,
        prioridad: oportunidad.prioridad,
        titulo: generarTitulo(oportunidad),
        mensaje,
        producto: oportunidad.producto.nombre,
        datosReales: {
          ventas: oportunidad.producto.ventas,
          mediaVentas: oportunidad.contexto.mediaVentas,
          tendencia: oportunidad.producto.tendencia,
          ingresos: oportunidad.producto.ingresos
        },
        principio: {
          id: oportunidad.principio.id,
          nombre: oportunidad.principio.nombre,
          autor: oportunidad.principio.autor,
          anio: oportunidad.principio.anio,
          publicacion: principio?.publicacion || ''
        },
        sector: oportunidad.contexto.sector,
        fechaGeneracion: new Date().toISOString()
      })

    } catch (error) {
      console.error(`Error generando recomendación para ${oportunidad.id}:`, error)
      
      // En caso de error, usar fallback
      const principio = getPrincipio(oportunidad.principio.id)
      
      recomendaciones.push({
        id: oportunidad.id,
        prioridad: oportunidad.prioridad,
        titulo: generarTitulo(oportunidad),
        mensaje: aplicarPlantillaFallback(oportunidad),
        producto: oportunidad.producto.nombre,
        datosReales: {
          ventas: oportunidad.producto.ventas,
          mediaVentas: oportunidad.contexto.mediaVentas,
          tendencia: oportunidad.producto.tendencia,
          ingresos: oportunidad.producto.ingresos
        },
        principio: {
          id: oportunidad.principio.id,
          nombre: oportunidad.principio.nombre,
          autor: oportunidad.principio.autor,
          anio: oportunidad.principio.anio,
          publicacion: principio?.publicacion || ''
        },
        sector: oportunidad.contexto.sector,
        fechaGeneracion: new Date().toISOString()
      })
    }
  }

  return recomendaciones
}

// --------------------------------------------------------
// FUNCIÓN: Generar mensaje con IA (Claude)
// --------------------------------------------------------
async function generarMensajeConIA(oportunidad: OportunidadDetectada): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const userPrompt = generarPromptUsuario(oportunidad)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
    system: SYSTEM_PROMPT
  })

  // Extraer texto de la respuesta
  const content = response.content[0]
  if (content.type === 'text') {
    return content.text.trim()
  }

  throw new Error('Respuesta de IA no contiene texto')
}

// --------------------------------------------------------
// FUNCIÓN: Validar que el mensaje no inventa
// --------------------------------------------------------
function validarMensaje(mensaje: string, oportunidad: OportunidadDetectada): boolean {
  const mensajeLower = mensaje.toLowerCase()

  // 1. Verificar que menciona el producto
  if (!mensajeLower.includes(oportunidad.producto.nombre.toLowerCase())) {
    console.warn('Validación fallida: No menciona el producto')
    return false
  }

  // 2. Verificar que no usa frases prohibidas
  const frasesProhibidas = [
    'también podrías',
    'otra opción',
    'podrías considerar',
    'te recomiendo además',
    'generalmente',
    'normalmente',
    'suele ocurrir',
    'en mi experiencia',
    'estudios demuestran',
    'se ha comprobado',
    'aumentará un',
    'incrementará un',
    'mejorará un',
    '% de éxito',
    '% de mejora',
    '% más de'
  ]

  for (const frase of frasesProhibidas) {
    if (mensajeLower.includes(frase)) {
      console.warn(`Validación fallida: Contiene frase prohibida "${frase}"`)
      return false
    }
  }

  // 3. Verificar longitud razonable (no muy largo)
  if (mensaje.length > 600) {
    console.warn('Validación fallida: Mensaje demasiado largo')
    return false
  }

  // 4. Verificar que no inventa porcentajes no proporcionados
  const porcentajesEnMensaje = mensaje.match(/\d+%/g) || []
  const porcentajesPermitidos = [
    `${oportunidad.producto.tendencia}%`,
    `${Math.abs(oportunidad.producto.tendencia)}%`,
    '5%', '10%', '5-10%' // Estos son estándar para subida de precio
  ]

  for (const pct of porcentajesEnMensaje) {
    const esPermitido = porcentajesPermitidos.some(p => 
      pct === p || pct === `+${p}` || pct === `-${p}`
    )
    if (!esPermitido) {
      console.warn(`Validación fallida: Porcentaje inventado "${pct}"`)
      return false
    }
  }

  // 5. Verificar que no es el mensaje de error
  if (mensajeLower.includes('no es posible generar')) {
    console.warn('Validación fallida: IA no pudo generar mensaje')
    return false
  }

  return true
}

// --------------------------------------------------------
// FUNCIÓN: Generar sin IA (solo plantillas)
// --------------------------------------------------------
export function generarRecomendacionesSinIA(
  oportunidades: OportunidadDetectada[]
): Recomendacion[] {
  return oportunidades.map(oportunidad => {
    const principio = getPrincipio(oportunidad.principio.id)

    return {
      id: oportunidad.id,
      prioridad: oportunidad.prioridad,
      titulo: generarTitulo(oportunidad),
      mensaje: aplicarPlantillaFallback(oportunidad),
      producto: oportunidad.producto.nombre,
      datosReales: {
        ventas: oportunidad.producto.ventas,
        mediaVentas: oportunidad.contexto.mediaVentas,
        tendencia: oportunidad.producto.tendencia,
        ingresos: oportunidad.producto.ingresos
      },
      principio: {
        id: oportunidad.principio.id,
        nombre: oportunidad.principio.nombre,
        autor: oportunidad.principio.autor,
        anio: oportunidad.principio.anio,
        publicacion: principio?.publicacion || ''
      },
      sector: oportunidad.contexto.sector,
      fechaGeneracion: new Date().toISOString()
    }
  })
}