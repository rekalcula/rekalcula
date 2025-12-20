// ============================================================
// PRINCIPIOS PSICOLÓGICOS CON BASE CIENTÍFICA VERIFICABLE
// ============================================================
// 
// IMPORTANTE: Estos 10 principios son INMUTABLES.
// Cada uno tiene autor, estudio, año y publicación verificables.
// El sistema NO puede inventar principios nuevos.
//
// ============================================================

import { PrincipioPsicologico } from './types'

export const PRINCIPIOS: PrincipioPsicologico[] = [
  // --------------------------------------------------------
  // 1. AUTORIDAD
  // --------------------------------------------------------
  {
    id: 'autoridad',
    nombre: 'Autoridad',
    autor: 'Robert Cialdini',
    estudio: 'Influence: The Psychology of Persuasion',
    año: 1984,
    publicacion: 'Harper Business',
    hallazgo: 'Las personas siguen recomendaciones de figuras percibidas como expertas o con autoridad en la materia.',
    aplicacionComercial: 'Destacar productos como "Recomendado" o "Selección del experto" aumenta su elección.',
    adaptaciones: {
      cafeteria: 'Recomendación del barista',
      restaurante: 'Recomendado del chef',
      peluqueria: 'Favorito del estilista',
      tienda: 'Selección del experto',
      taller: 'Lo que yo haría con mi coche'
    }
  },

  // --------------------------------------------------------
  // 2. ESCASEZ
  // --------------------------------------------------------
  {
    id: 'escasez',
    nombre: 'Escasez',
    autor: 'Robert Cialdini / Worchel, Lee & Adewole',
    estudio: 'Effects of supply and demand on ratings of object value',
    año: 1975,
    publicacion: 'Journal of Personality and Social Psychology',
    hallazgo: 'Los objetos escasos se perciben como más valiosos. En el experimento de las galletas, las que estaban en menor cantidad fueron valoradas como más deseables.',
    aplicacionComercial: 'Indicar disponibilidad limitada o tiempo limitado aumenta el valor percibido y la urgencia de compra.',
    adaptaciones: {
      cafeteria: 'Solo hoy, Últimas unidades',
      restaurante: 'Plato del día, Solo quedan X',
      peluqueria: 'Últimas citas disponibles',
      tienda: 'Últimas tallas, Stock limitado',
      taller: 'Cita disponible solo hoy'
    }
  },

  // --------------------------------------------------------
  // 3. ANCLAJE
  // --------------------------------------------------------
  {
    id: 'anclaje',
    nombre: 'Anclaje (Anchoring Effect)',
    autor: 'Amos Tversky & Daniel Kahneman',
    estudio: 'Judgment under Uncertainty: Heuristics and Biases',
    año: 1974,
    publicacion: 'Science, Vol. 185, Issue 4157',
    hallazgo: 'El primer número que vemos (ancla) influye desproporcionadamente en nuestras estimaciones posteriores, incluso cuando es arbitrario.',
    aplicacionComercial: 'Mostrar primero un precio alto hace que los siguientes parezcan más razonables.',
    adaptaciones: {
      cafeteria: 'Mostrar primero el desayuno premium',
      restaurante: 'Colocar el plato más caro primero en la sección',
      peluqueria: 'Listar primero el tratamiento completo',
      tienda: 'Mostrar primero la versión premium',
      taller: 'Presentar primero el servicio completo'
    }
  },

  // --------------------------------------------------------
  // 4. PRUEBA SOCIAL
  // --------------------------------------------------------
  {
    id: 'prueba_social',
    nombre: 'Prueba Social (Social Proof)',
    autor: 'Robert Cialdini / Milgram, Bickman & Berkowitz',
    estudio: 'Note on the drawing power of crowds',
    año: 1969,
    publicacion: 'Journal of Personality and Social Psychology',
    hallazgo: 'Las personas imitan el comportamiento de otros, especialmente en situaciones de incertidumbre. Una multitud mirando al cielo hace que otros miren también.',
    aplicacionComercial: 'Indicar que un producto es "el más vendido" o "elegido por X clientes" aumenta su atractivo.',
    adaptaciones: {
      cafeteria: 'El más pedido, Favorito de nuestros clientes',
      restaurante: 'El más vendido, La elección de la mesa de al lado',
      peluqueria: 'El tratamiento más solicitado',
      tienda: 'Más vendido, Lo que eligen nuestros clientes',
      taller: 'El servicio más solicitado'
    }
  },

  // --------------------------------------------------------
  // 5. RECIPROCIDAD
  // --------------------------------------------------------
  {
    id: 'reciprocidad',
    nombre: 'Reciprocidad',
    autor: 'Robert Cialdini / Dennis Regan',
    estudio: 'Effects of a favor and liking on compliance',
    año: 1971,
    publicacion: 'Journal of Experimental Social Psychology',
    hallazgo: 'Recibir algo, incluso no solicitado, genera una sensación de obligación de devolver el favor.',
    aplicacionComercial: 'Ofrecer algo gratis (muestra, tapa, detalle) predispone al cliente a gastar más o volver.',
    adaptaciones: {
      cafeteria: 'Café de cortesía, Tapa con la bebida',
      restaurante: 'Aperitivo de la casa, Postre invitación',
      peluqueria: 'Masaje capilar de cortesía, Muestra de producto',
      tienda: 'Envoltorio regalo gratis, Detalle sorpresa',
      taller: 'Revisión de niveles gratis, Lavado cortesía'
    }
  },

  // --------------------------------------------------------
  // 6. PARADOJA DE LA ELECCIÓN
  // --------------------------------------------------------
  {
    id: 'paradoja_eleccion',
    nombre: 'Paradoja de la Elección (Choice Overload)',
    autor: 'Sheena Iyengar & Mark Lepper',
    estudio: 'When Choice is Demotivating',
    año: 2000,
    publicacion: 'Journal of Personality and Social Psychology, Vol. 79, No. 6',
    hallazgo: 'Demasiadas opciones paralizan la decisión. Con 24 mermeladas, solo 3% compró. Con 6 opciones, 30% compró.',
    aplicacionComercial: 'Reducir opciones y destacar 3-4 productos principales facilita la decisión y aumenta ventas.',
    adaptaciones: {
      cafeteria: 'Nuestros 3 desayunos estrella',
      restaurante: 'Menú del día con 3 opciones',
      peluqueria: 'Nuestros 3 servicios más populares',
      tienda: 'Nuestra selección destacada',
      taller: 'Packs de mantenimiento recomendados'
    }
  },

  // --------------------------------------------------------
  // 7. EFECTO SEÑUELO
  // --------------------------------------------------------
  {
    id: 'efecto_senuelo',
    nombre: 'Efecto Señuelo (Decoy Effect)',
    autor: 'Joel Huber, John Payne & Christopher Puto',
    estudio: 'Adding Asymmetrically Dominated Alternatives',
    año: 1982,
    publicacion: 'Journal of Consumer Research, Vol. 9, No. 1',
    hallazgo: 'Añadir una tercera opción inferior a una de las dos principales hace que esa opción parezca mejor en comparación.',
    aplicacionComercial: 'Crear tres versiones (pequeño/mediano/grande) donde la mediana sea la más rentable.',
    adaptaciones: {
      cafeteria: 'Café pequeño / mediano / grande',
      restaurante: 'Ración / Media ración / Tapa',
      peluqueria: 'Corte básico / completo / premium',
      tienda: 'Básico / Estándar / Premium',
      taller: 'Revisión básica / completa / premium'
    }
  },

  // --------------------------------------------------------
  // 8. AVERSIÓN A LA PÉRDIDA
  // --------------------------------------------------------
  {
    id: 'aversion_perdida',
    nombre: 'Aversión a la Pérdida (Loss Aversion)',
    autor: 'Daniel Kahneman & Amos Tversky',
    estudio: 'Prospect Theory: An Analysis of Decision under Risk',
    año: 1979,
    publicacion: 'Econometrica, Vol. 47, No. 2',
    hallazgo: 'El dolor de perder es aproximadamente el doble de intenso que el placer de ganar la misma cantidad. Kahneman recibió el Nobel de Economía en 2002.',
    aplicacionComercial: 'Enmarcar el mensaje en términos de lo que el cliente podría perder si no actúa.',
    adaptaciones: {
      cafeteria: 'No te quedes sin probar...',
      restaurante: 'Última oportunidad para...',
      peluqueria: 'No dejes escapar esta promoción',
      tienda: 'No te pierdas esta oferta',
      taller: 'Evita averías costosas con...'
    }
  },

  // --------------------------------------------------------
  // 9. EFECTO PRIMACÍA Y RECENCIA
  // --------------------------------------------------------
  {
    id: 'primacia_recencia',
    nombre: 'Efecto Primacía y Recencia',
    autor: 'Hermann Ebbinghaus',
    estudio: 'Memory: A Contribution to Experimental Psychology',
    año: 1885,
    publicacion: 'Publicación original en alemán, traducida en 1913',
    hallazgo: 'Recordamos mejor los elementos al principio (primacía) y al final (recencia) de una lista que los del medio.',
    aplicacionComercial: 'Colocar los productos más rentables al inicio y al final de la carta o lista.',
    adaptaciones: {
      cafeteria: 'Destacar al inicio y final de la pizarra',
      restaurante: 'Primer y último plato de cada sección',
      peluqueria: 'Primero y último servicio del listado',
      tienda: 'Primera y última estantería',
      taller: 'Primer y último servicio del presupuesto'
    }
  },

  // --------------------------------------------------------
  // 10. EFECTO COMPROMISO
  // --------------------------------------------------------
  {
    id: 'efecto_compromiso',
    nombre: 'Efecto Compromiso (Compromise Effect)',
    autor: 'Itamar Simonson',
    estudio: 'Choice Based on Reasons',
    año: 1989,
    publicacion: 'Journal of Consumer Research, Vol. 16, No. 2',
    hallazgo: 'Cuando hay tres opciones, la mayoría de personas elige la intermedia como "punto medio seguro".',
    aplicacionComercial: 'Diseñar tres opciones donde la intermedia sea la más rentable para el negocio.',
    adaptaciones: {
      cafeteria: 'Diseñar el menú mediano como el más rentable',
      restaurante: 'El menú de precio medio como estrella',
      peluqueria: 'El pack intermedio como el más completo',
      tienda: 'La opción media con mejor margen',
      taller: 'El pack de mantenimiento intermedio'
    }
  }
]

// --------------------------------------------------------
// FUNCIÓN AUXILIAR: Obtener principio por ID
// --------------------------------------------------------
export function getPrincipio(id: string): PrincipioPsicologico | undefined {
  return PRINCIPIOS.find(p => p.id === id)
}

// --------------------------------------------------------
// FUNCIÓN AUXILIAR: Obtener adaptación por sector
// --------------------------------------------------------
export function getAdaptacion(principioId: string, sector: string): string {
  const principio = getPrincipio(principioId)
  if (!principio) return ''
  
  return principio.adaptaciones[sector as keyof typeof principio.adaptaciones] 
    || principio.aplicacionComercial
}
