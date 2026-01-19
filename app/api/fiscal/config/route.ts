import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { FiscalConfig } from '@/lib/fiscal/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // 🔥 VALIDACIÓN: SL/SA solo pueden tener régimen general
    if ((config.tipo_entidad === 'sl' || config.tipo_entidad === 'sa') && config.regimen_fiscal !== 'general') {
      config.regimen_fiscal = 'general' // Corregir automáticamente
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
    return NextResponse.json({ 
      success: false, 
      error: 'Error guardando configuración', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}