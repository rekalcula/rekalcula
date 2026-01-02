import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET: Obtener configuración actual de costos
export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('ai_costs_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Si no existe configuración, devolver valores por defecto
    if (!data) {
      return NextResponse.json({
        success: true,
        config: {
          invoice_cost: 0.017,
          ticket_cost: 0.011,
          analysis_cost: 0.006,
        }
      })
    }

    return NextResponse.json({
      success: true,
      config: data
    })
  } catch (error) {
    console.error('Error fetching costs config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración de costos' },
      { status: 500 }
    )
  }
}

// POST: Actualizar configuración de costos
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { invoice_cost, ticket_cost, analysis_cost } = body

    // Validar que los valores sean números positivos
    if (
      typeof invoice_cost !== 'number' || invoice_cost < 0 ||
      typeof ticket_cost !== 'number' || ticket_cost < 0 ||
      typeof analysis_cost !== 'number' || analysis_cost < 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Valores de costos inválidos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe configuración
    const { data: existing } = await supabase
      .from('ai_costs_config')
      .select('id')
      .single()

    let result

    if (existing) {
      // Actualizar existente
      result = await supabase
        .from('ai_costs_config')
        .update({
          invoice_cost,
          ticket_cost,
          analysis_cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Crear nuevo
      result = await supabase
        .from('ai_costs_config')
        .insert({
          invoice_cost,
          ticket_cost,
          analysis_cost
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      config: result.data
    })
  } catch (error) {
    console.error('Error updating costs config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración de costos' },
      { status: 500 }
    )
  }
}