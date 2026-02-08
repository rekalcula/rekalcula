import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { FiscalConfig } from '@/lib/fiscal/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// VALIDACIÓN DE VALORES PERMITIDOS
// ============================================================
const VALORES_PERMITIDOS = {
  tipo_entidad: ['autonomo', 'sl', 'sa'],
  regimen_fiscal: ['general', 'simplificado', 'recargo_equivalencia', 'modulos'],
  tipo_iva: ['general', 'reducido', 'superreducido', 'exento'],
}

const RANGOS_NUMERICOS = {
  retencion_irpf: { min: 0, max: 30 },
  porcentaje_iva: { min: 0, max: 21 },
  tipo_impuesto_sociedades: { min: 0, max: 30 },
  umbral_alerta_1: { min: 0, max: 1000000 },
  umbral_alerta_2: { min: 0, max: 1000000 },
  facturacion_estimada_anual: { min: 0, max: 99999999 },
  gastos_estimados_anual: { min: 0, max: 99999999 },
}

function validarConfig(config: any): string | null {
  // Validar tipo_entidad
  if (!VALORES_PERMITIDOS.tipo_entidad.includes(config.tipo_entidad)) {
    return 'Tipo de entidad no válido'
  }

  // Validar regimen_fiscal
  if (!VALORES_PERMITIDOS.regimen_fiscal.includes(config.regimen_fiscal)) {
    return 'Régimen fiscal no válido'
  }

  // Validar tipo_iva
  if (config.tipo_iva && !VALORES_PERMITIDOS.tipo_iva.includes(config.tipo_iva)) {
    return 'Tipo de IVA no válido'
  }

  // Validar rangos numéricos
  for (const [campo, rango] of Object.entries(RANGOS_NUMERICOS)) {
    const valor = config[campo]
    if (valor !== null && valor !== undefined) {
      if (typeof valor !== 'number' || isNaN(valor)) {
        return `${campo} debe ser un número válido`
      }
      if (valor < rango.min || valor > rango.max) {
        return `${campo} debe estar entre ${rango.min} y ${rango.max}`
      }
    }
  }

  return null // Sin errores
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ success: true, config: data || null })
  } catch (error) {
    console.error('Error obteniendo config fiscal:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const config: FiscalConfig = await request.json()

    // 🔒 VALIDACIÓN DE VALORES PERMITIDOS Y RANGOS
    const errorValidacion = validarConfig(config)
    if (errorValidacion) {
      return NextResponse.json(
        { success: false, error: errorValidacion },
        { status: 400 }
      )
    }

    // 🔥 VALIDACIÓN: SL/SA solo pueden tener régimen general
    if ((config.tipo_entidad === 'sl' || config.tipo_entidad === 'sa') && config.regimen_fiscal !== 'general') {
      config.regimen_fiscal = 'general'
    }

    // 🔥 FILTRAR SOLO CAMPOS VÁLIDOS
    const configData = {
      tipo_entidad: config.tipo_entidad,
      regimen_fiscal: config.regimen_fiscal,
      retencion_irpf: config.retencion_irpf || 0,
      tipo_iva: config.tipo_iva,
      porcentaje_iva: config.porcentaje_iva,
      tipo_impuesto_sociedades: config.tipo_impuesto_sociedades || 25,
      umbral_alerta_1: config.umbral_alerta_1,
      umbral_alerta_2: config.umbral_alerta_2,
      facturacion_estimada_anual: config.facturacion_estimada_anual || null,
      gastos_estimados_anual: config.gastos_estimados_anual || null
    }

    const { data: existing } = await supabase
      .from('fiscal_config')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result

    if (existing) {
      result = await supabase
        .from('fiscal_config')
        .update({ ...configData, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('fiscal_config')
        .insert({ ...configData, user_id: userId })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json({ success: true, config: result.data })
  } catch (error) {
    console.error('Error guardando config fiscal:', error)
    // 🔒 CORREGIDO: Eliminado campo 'details' que exponía errores internos
    return NextResponse.json({ 
      success: false, 
      error: 'Error guardando configuración'
    }, { status: 500 })
  }
}