// ============================================================
// PRINCIPIOS PSICOLÃ“GICOS CON BASE CIENTÃFICA VERIFICABLE
// ============================================================
// 
// IMPORTANTE: Estos 10 principios son INMUTABLES.
// Cada uno tiene autor, estudio, aÃ±o y publicaciÃ³n verificables.
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
    aÃ±o: 1984,
    publicacion: 'Harper Business',
    hallazgo: 'Las personas siguen recomendaciones de figuras percibidas como expertas o con autoridad en la materia.',
    aplicacionComercial: 'Destacar productos como "Recomendado" o "SelecciÃ³n del experto" aumenta su elecciÃ³n.',
    adaptaciones: {
      cafeteria: 'RecomendaciÃ³n del barista',
      restaurante: 'Recomendado del chef',
      peluqueria: 'Favorito del estilista',
      tienda: 'SelecciÃ³n del experto',
      taller: 'Lo que yo harÃ­a con mi coche'
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
    aÃ±o: 1975,
    publicacion: 'Journal of Personality and Social Psychology',
    hallazgo: 'Los objetos escasos se perciben como mÃ¡s valiosos. En el experimento de las galletas, las que estaban en menor cantidad fueron valoradas como mÃ¡s deseables.',
    aplicacionComercial: 'Indicar disponibilidad limitada o tiempo limitado aumenta el valor percibido y la urgencia de compra.',
    adaptaciones: {
      cafeteria: 'Solo hoy, Ãšltimas unidades',
      restaurante: 'Plato del dÃ­a, Solo quedan X',
      peluqueria: 'Ãšltimas citas disponibles',
      tienda: 'Ãšltimas tallas, Stock limitado',
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
    aÃ±o: 1974,
    publicacion: 'Science, Vol. 185, Issue 4157',
    hallazgo: 'El primer nÃºmero que vemos (ancla) influye desproporcionadamente en nuestras estimaciones posteriores, incluso cuando es arbitrario.',
    aplicacionComercial: 'Mostrar primero un precio alto hace que los siguientes parezcan mÃ¡s razonables.',
    adaptaciones: {
      cafeteria: 'Mostrar primero el desayuno premium',
      restaurante: 'Colocar el plato mÃ¡s caro primero en la secciÃ³n',
      peluqueria: 'Listar primero el tratamiento completo',
      tienda: 'Mostrar primero la versiÃ³n premium',
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
    aÃ±o: 1969,
    publicacion: 'Journal of Personality and Social Psychology',
    hallazgo: 'Las personas imitan el comportamiento de otros, especialmente en situaciones de incertidumbre. Una multitud mirando al cielo hace que otros miren tambiÃ©n.',
    aplicacionComercial: 'Indicar que un producto es "el mÃ¡s vendido" o "elegido por X clientes" aumenta su atractivo.',
    adaptaciones: {
      cafeteria: 'El mÃ¡s pedido, Favorito de nuestros clientes',
      restaurante: 'El mÃ¡s vendido, La elecciÃ³n de la mesa de al lado',
      peluqueria: 'El tratamiento mÃ¡s solicitado',
      tienda: 'MÃ¡s vendido, Lo que eligen nuestros clientes',
      taller: 'El servicio mÃ¡s solicitado'
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
    aÃ±o: 1971,
    publicacion: 'Journal of Experimental Social Psychology',
    hallazgo: 'Recibir algo, incluso no solicitado, genera una sensaciÃ³n de obligaciÃ³n de devolver el favor.',
    aplicacionComercial: 'Ofrecer algo gratis (muestra, tapa, detalle) predispone al cliente a gastar mÃ¡s o volver.',
    adaptaciones: {
      cafeteria: 'CafÃ© de cortesÃ­a, Tapa con la bebida',
      restaurante: 'Aperitivo de la casa, Postre invitaciÃ³n',
      peluqueria: 'Masaje capilar de cortesÃ­a, Muestra de producto',
      tienda: 'Envoltorio regalo gratis, Detalle sorpresa',
      taller: 'RevisiÃ³n de niveles gratis, Lavado cortesÃ­a'
    }
  },

  // --------------------------------------------------------
  // 6. PARADOJA DE LA ELECCIÃ“N
  // --------------------------------------------------------
  {
    id: 'paradoja_eleccion',
    nombre: 'Paradoja de la ElecciÃ³n (Choice Overload)',
    autor: 'Sheena Iyengar & Mark Lepper',
    estudio: 'When Choice is Demotivating',
    aÃ±o: 2000,
    publicacion: 'Journal of Personality and Social Psychology, Vol. 79, No. 6',
    hallazgo: 'Demasiadas opciones paralizan la decisiÃ³n. Con 24 mermeladas, solo 3% comprÃ³. Con 6 opciones, 30% comprÃ³.',
    aplicacionComercial: 'Reducir opciones y destacar 3-4 productos principales facilita la decisiÃ³n y aumenta ventas.',
    adaptaciones: {
      cafeteria: 'Nuestros 3 desayunos estrella',
      restaurante: 'MenÃº del dÃ­a con 3 opciones',
      peluqueria: 'Nuestros 3 servicios mÃ¡s populares',
      tienda: 'Nuestra selecciÃ³n destacada',
      taller: 'Packs de mantenimiento recomendados'
    }
  },

  // --------------------------------------------------------
  // 7. EFECTO SEÃ‘UELO
  // --------------------------------------------------------
  {
    id: 'efecto_senuelo',
    nombre: 'Efecto SeÃ±uelo (Decoy Effect)',
    autor: 'Joel Huber, John Payne & Christopher Puto',
    estudio: 'Adding Asymmetrically Dominated Alternatives',
    aÃ±o: 1982,
    publicacion: 'Journal of Consumer Research, Vol. 9, No. 1',
    hallazgo: 'AÃ±adir una tercera opciÃ³n inferior a una de las dos principales hace que esa opciÃ³n parezca mejor en comparaciÃ³n.',
    aplicacionComercial: 'Crear tres versiones (pequeÃ±o/mediano/grande) donde la mediana sea la mÃ¡s rentable.',
    adaptaciones: {
      cafeteria: 'CafÃ© pequeÃ±o / mediano / grande',
      restaurante: 'RaciÃ³n / Media raciÃ³n / Tapa',
      peluqueria: 'Corte bÃ¡sico / completo / premium',
      tienda: 'BÃ¡sico / EstÃ¡ndar / Premium',
      taller: 'RevisiÃ³n bÃ¡sica / completa / premium'
    }
  },

  // --------------------------------------------------------
  // 8. AVERSIÃ“N A LA PÃ‰RDIDA
  // --------------------------------------------------------
  {
    id: 'aversion_perdida',
    nombre: 'AversiÃ³n a la PÃ©rdida (Loss Aversion)',
    autor: 'Daniel Kahneman & Amos Tversky',
    estudio: 'Prospect Theory: An Analysis of Decision under Risk',
    aÃ±o: 1979,
    publicacion: 'Econometrica, Vol. 47, No. 2',
    hallazgo: 'El dolor de perder es aproximadamente el doble de intenso que el placer de ganar la misma cantidad. Kahneman recibiÃ³ el Nobel de EconomÃ­a en 2002.',
    aplicacionComercial: 'Enmarcar el mensaje en tÃ©rminos de lo que el cliente podrÃ­a perder si no actÃºa.',
    adaptaciones: {
      cafeteria: 'No te quedes sin probar...',
      restaurante: 'Ãšltima oportunidad para...',
      peluqueria: 'No dejes escapar esta promociÃ³n',
      tienda: 'No te pierdas esta oferta',
      taller: 'Evita averÃ­as costosas con...'
    }
  },

  // --------------------------------------------------------
  // 9. EFECTO PRIMACÃA Y RECENCIA
  // --------------------------------------------------------
  {
    id: 'primacia_recencia',
    nombre: 'Efecto PrimacÃ­a y Recencia',
    autor: 'Hermann Ebbinghaus',
    estudio: 'Memory: A Contribution to Experimental Psychology',
    aÃ±o: 1885,
    publicacion: 'PublicaciÃ³n original en alemÃ¡n, traducida en 1913',
    hallazgo: 'Recordamos mejor los elementos al principio (primacÃ­a) y al final (recencia) de una lista que los del medio.',
    aplicacionComercial: 'Colocar los productos mÃ¡s rentables al inicio y al final de la carta o lista.',
    adaptaciones: {
      cafeteria: 'Destacar al inicio y final de la pizarra',
      restaurante: 'Primer y Ãºltimo plato de cada secciÃ³n',
      peluqueria: 'Primero y Ãºltimo servicio del listado',
      tienda: 'Primera y Ãºltima estanterÃ­a',
      taller: 'Primer y Ãºltimo servicio del presupuesto'
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
    aÃ±o: 1989,
    publicacion: 'Journal of Consumer Research, Vol. 16, No. 2',
    hallazgo: 'Cuando hay tres opciones, la mayorÃ­a de personas elige la intermedia como "punto medio seguro".',
    aplicacionComercial: 'DiseÃ±ar tres opciones donde la intermedia sea la mÃ¡s rentable para el negocio.',
    adaptaciones: {
      cafeteria: 'DiseÃ±ar el menÃº mediano como el mÃ¡s rentable',
      restaurante: 'El menÃº de precio medio como estrella',
      peluqueria: 'El pack intermedio como el mÃ¡s completo',
      tienda: 'La opciÃ³n media con mejor margen',
      taller: 'El pack de mantenimiento intermedio'
    }
  }
]

// --------------------------------------------------------
// FUNCIÃ“N AUXILIAR: Obtener principio por ID
// --------------------------------------------------------
export function getPrincipio(id: string): PrincipioPsicologico | undefined {
  return PRINCIPIOS.find(p => p.id === id)
}

// --------------------------------------------------------
// FUNCIÃ“N AUXILIAR: Obtener adaptaciÃ³n por sector
// --------------------------------------------------------
export function getAdaptacion(principioId: string, sector: string): string {
  const principio = getPrincipio(principioId)
  if (!principio) return ''
  
  return principio.adaptaciones[sector as keyof typeof principio.adaptaciones] 
    || principio.aplicacionComercial
}
