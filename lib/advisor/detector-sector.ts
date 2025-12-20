// ============================================================
// DETECTOR DE SECTOR - ANALIZA PRODUCTOS PARA DETECTAR TIPO DE NEGOCIO
// ============================================================
//
// Este módulo analiza los nombres de productos vendidos para
// determinar automáticamente el sector del negocio.
//
// NO usa IA para esto - usa coincidencia de palabras clave.
//
// ============================================================

import { Sector } from './types'

// Palabras clave por sector
const KEYWORDS: Record<Sector, string[]> = {
  cafeteria: [
    'café', 'cafe', 'cortado', 'capuchino', 'cappuccino', 'espresso',
    'americano', 'latte', 'moca', 'mocha', 'descafeinado',
    'té', 'te', 'infusion', 'infusión', 'manzanilla', 'poleo',
    'tostada', 'croissant', 'cruasan', 'napolitana', 'palmera',
    'magdalena', 'muffin', 'donut', 'churro', 'porra',
    'zumo', 'batido', 'smoothie',
    'bocadillo', 'sandwich', 'sándwich',
    'desayuno', 'merienda', 'almuerzo',
    'caña', 'cerveza', 'refresco', 'agua',
    'pincho', 'tapa', 'montadito'
  ],
  
  restaurante: [
    'menú', 'menu', 'plato', 'entrante', 'principal', 'postre',
    'ensalada', 'sopa', 'crema', 'gazpacho',
    'carne', 'pescado', 'marisco', 'pollo', 'ternera', 'cerdo',
    'cordero', 'solomillo', 'entrecot', 'chuleta',
    'merluza', 'lubina', 'dorada', 'bacalao', 'atún', 'salmon',
    'paella', 'arroz', 'pasta', 'risotto',
    'guarnición', 'patatas', 'verduras',
    'vino', 'copa', 'botella', 'tinto', 'blanco', 'rosado',
    'croqueta', 'fritura', 'plancha', 'horno',
    'tarta', 'flan', 'helado', 'coulant'
  ],
  
  peluqueria: [
    'corte', 'peinado', 'secado', 'brushing',
    'tinte', 'color', 'mechas', 'balayage', 'highlights',
    'permanente', 'alisado', 'keratina', 'botox capilar',
    'lavado', 'mascarilla', 'tratamiento capilar',
    'barba', 'afeitado', 'arreglo barba',
    'cejas', 'depilación', 'manicura', 'pedicura',
    'recogido', 'moño', 'trenza',
    'caballero', 'señora', 'niño', 'infantil'
  ],
  
  tienda: [
    'camiseta', 'pantalón', 'pantalon', 'vestido', 'falda',
    'chaqueta', 'abrigo', 'jersey', 'sudadera', 'camisa',
    'zapato', 'zapatilla', 'bota', 'sandalia', 'tacón',
    'bolso', 'mochila', 'cartera', 'cinturón', 'cinturon',
    'gorra', 'sombrero', 'bufanda', 'guante', 'pañuelo',
    'gafa', 'reloj', 'collar', 'pulsera', 'pendiente', 'anillo',
    'talla', 'unidad', 'par', 'pack',
    'regalo', 'envoltorio'
  ],
  
  taller: [
    'aceite', 'filtro', 'cambio aceite',
    'freno', 'pastilla', 'disco', 'líquido frenos',
    'neumático', 'neumatico', 'rueda', 'equilibrado', 'alineación',
    'batería', 'bateria', 'alternador', 'arranque',
    'embrague', 'caja cambios', 'transmisión',
    'amortiguador', 'suspensión', 'dirección',
    'escape', 'catalizador', 'silenciador',
    'refrigerante', 'radiador', 'termostato',
    'bujía', 'bujia', 'correa', 'distribución',
    'diagnosis', 'revisión', 'revision', 'itv', 'pre-itv',
    'mano de obra', 'hora trabajo'
  ],
  
  desconocido: []
}

// --------------------------------------------------------
// FUNCIÓN PRINCIPAL: Detectar sector basándose en productos
// --------------------------------------------------------
export function detectarSector(productos: string[]): { sector: Sector; confianza: number } {
  if (!productos || productos.length === 0) {
    return { sector: 'desconocido', confianza: 0 }
  }

  // Normalizar productos a minúsculas
  const productosNormalizados = productos.map(p => p.toLowerCase().trim())
  
  // Contar coincidencias por sector
  const puntuaciones: Record<Sector, number> = {
    cafeteria: 0,
    restaurante: 0,
    peluqueria: 0,
    tienda: 0,
    taller: 0,
    desconocido: 0
  }

  // Evaluar cada producto contra cada sector
  for (const producto of productosNormalizados) {
    for (const [sector, keywords] of Object.entries(KEYWORDS)) {
      if (sector === 'desconocido') continue
      
      for (const keyword of keywords) {
        if (producto.includes(keyword)) {
          puntuaciones[sector as Sector]++
          break // Un producto solo suma una vez por sector
        }
      }
    }
  }

  // Encontrar el sector con mayor puntuación
  let maxPuntuacion = 0
  let sectorDetectado: Sector = 'desconocido'
  
  for (const [sector, puntuacion] of Object.entries(puntuaciones)) {
    if (sector !== 'desconocido' && puntuacion > maxPuntuacion) {
      maxPuntuacion = puntuacion
      sectorDetectado = sector as Sector
    }
  }

  // Calcular confianza (porcentaje de productos que coinciden)
  const confianza = productos.length > 0 
    ? Math.round((maxPuntuacion / productos.length) * 100)
    : 0

  // Si la confianza es muy baja, marcar como desconocido
  if (confianza < 20) {
    return { sector: 'desconocido', confianza }
  }

  return { sector: sectorDetectado, confianza }
}

// --------------------------------------------------------
// FUNCIÓN AUXILIAR: Obtener keywords de un sector
// --------------------------------------------------------
export function getKeywordsSector(sector: Sector): string[] {
  return KEYWORDS[sector] || []
}