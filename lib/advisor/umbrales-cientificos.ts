// ============================================================
// UMBRALES CIENTÍFICOS - ReKalcula
// ============================================================
//
// Umbrales basados en estudios científicos de análisis retail
// y significancia estadística.
//
// Fuentes:
// - Análisis de tendencias requiere mínimo 8-10 observaciones
// - Retail normal crece ~3-5% anual, significancia requiere 3x
// - Impacto económico debe ser >2% para ser relevante
//
// ============================================================

export const UMBRALES_CIENTIFICOS = {
  // Participación mínima en el negocio
  PARTICIPACION_VENTAS_MINIMA: 0.05,      // 5% de ventas totales
  PARTICIPACION_INGRESOS_MINIMA: 0.05,    // 5% de ingresos totales
  
  // Tendencia significativa (3x el crecimiento normal retail ~5%)
  TENDENCIA_CRECIMIENTO_ALTA: 0.15,       // +15% = Crecimiento significativo
  TENDENCIA_CRECIMIENTO_MEDIA: 0.10,      // +10% = Crecimiento moderado
  TENDENCIA_DECLIVE_MODERADO: -0.10,      // -10% = Declive que requiere atención
  TENDENCIA_DECLIVE_ALTO: -0.15,          // -15% = Declive grave
  
  // Impacto económico
  IMPACTO_ECONOMICO_MINIMO: 0.02,         // 2% del ingreso total
  IMPACTO_ECONOMICO_SIGNIFICATIVO: 0.05,  // 5% del ingreso total
  
  // Volumen mínimo por período
  VENTAS_MINIMAS_POR_PERIODO: 3,          // 3 ventas mínimo en cada período de 15 días
  
  // Productos destacados
  PRODUCTO_ESTRELLA_MULTIPLICADOR: 2,     // 2x la media = producto estrella
  PRODUCTO_BAJO_MULTIPLICADOR: 0.2,       // 20% de la media = producto bajo
  
  // Precio
  PRECIO_PREMIUM_MULTIPLICADOR: 1.5,      // 1.5x la media = premium
  PRECIO_ECONOMICO_MULTIPLICADOR: 0.3     // 30% de la media = económico
} as const

// Función auxiliar: validar que un producto cumple umbrales mínimos
export function cumpleUmbralesMinimos(
  ventasProducto: number,
  ventasAnterioresProducto: number,
  porcentajeVentasTotal: number,
  impactoEconomicoRelativo: number
): boolean {
  // 1. Debe tener mínimo 3 ventas en cada período
  if (ventasProducto < UMBRALES_CIENTIFICOS.VENTAS_MINIMAS_POR_PERIODO) {
    return false
  }
  
  if (ventasAnterioresProducto < UMBRALES_CIENTIFICOS.VENTAS_MINIMAS_POR_PERIODO) {
    return false
  }
  
  // 2. Debe representar al menos 5% de las ventas totales
  if (porcentajeVentasTotal < UMBRALES_CIENTIFICOS.PARTICIPACION_VENTAS_MINIMA) {
    return false
  }
  
  // 3. Su impacto económico debe ser al menos 2% del total
  if (Math.abs(impactoEconomicoRelativo) < UMBRALES_CIENTIFICOS.IMPACTO_ECONOMICO_MINIMO) {
    return false
  }
  
  return true
}

// Función auxiliar: verificar si tendencia es estadísticamente significativa
export function esTendenciaSignificativa(
  tendencia: number,
  tipoTendencia: 'crecimiento' | 'declive'
): boolean {
  if (tipoTendencia === 'crecimiento') {
    return tendencia >= UMBRALES_CIENTIFICOS.TENDENCIA_CRECIMIENTO_MEDIA
  } else {
    return tendencia <= UMBRALES_CIENTIFICOS.TENDENCIA_DECLIVE_MODERADO
  }
}