// ============================================================
// TIPOS FISCALES - ESPANA
// ============================================================

export type TipoEntidad = 'autonomo' | 'sl' | 'sa'
export type RegimenFiscal = 'general' | 'simplificado' | 'modulos' | 'recargo'
export type TipoIVA = 'general' | 'reducido' | 'superreducido' | 'exento'

export interface FiscalConfig {
  id?: string
  user_id?: string
  tipo_entidad: TipoEntidad
  regimen_fiscal: RegimenFiscal
  retencion_irpf: number
  tipo_iva: TipoIVA
  porcentaje_iva: number
  tipo_impuesto_sociedades: number
  umbral_alerta_1: number
  umbral_alerta_2: number
  facturacion_estimada_anual?: number
  gastos_estimados_anual?: number
  created_at?: string
  updated_at?: string
}

export interface SemaforoFiscal {
  estado: 'verde' | 'amarillo' | 'rojo'
  mensaje: string
  facturacion_actual: number
  facturacion_segura: number
  umbral_critico: number
  ahorro_potencial?: number
  recomendaciones: string[]
}