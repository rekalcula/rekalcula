import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔒 VALIDACIÓN de period_type
const PERIOD_TYPES_VALIDOS = ['monthly', 'weekly']

// 🔒 VALIDACIÓN de fecha ISO
function isValidDate(dateStr: any): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

// 🔒 VALIDACIÓN de UUID
function isValidUUID(value: any): boolean {
  if (!value || typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// 🔒 VALIDACIÓN de forecast_data
function isValidForecastData(data: any): boolean {
  if (!Array.isArray(data) || data.length === 0 || data.length > 52) return false
  return data.every((period: any) =>
    typeof period.period_date === 'string' &&
    typeof period.initial_balance === 'number' &&
    typeof period.planned_income === 'number' &&
    typeof period.planned_expenses === 'number' &&
    typeof period.final_balance === 'number' &&
    period.planned_income >= 0 &&
    period.planned_expenses >= 0
  )
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('treasury_forecasts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo previsión:', error)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    return NextResponse.json({ data: data || null })
  } catch (error) {
    console.error('Error en GET treasury-forecast:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { period_type, start_date, forecast_data } = body

    // 🔒 Validaciones
    if (!period_type || !PERIOD_TYPES_VALIDOS.includes(period_type)) {
      return NextResponse.json({ error: 'Tipo de período no válido' }, { status: 400 })
    }

    if (!isValidDate(start_date)) {
      return NextResponse.json({ error: 'Fecha de inicio no válida' }, { status: 400 })
    }

    if (!forecast_data || !isValidForecastData(forecast_data)) {
      return NextResponse.json({ error: 'Datos de previsión no válidos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('treasury_forecasts')
      .insert({
        user_id: userId,
        period_type,
        start_date,
        forecast_data
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando previsión:', error)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error en POST treasury-forecast:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, period_type, start_date, forecast_data } = body

    // 🔒 Validaciones
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    }

    if (!period_type || !PERIOD_TYPES_VALIDOS.includes(period_type)) {
      return NextResponse.json({ error: 'Tipo de período no válido' }, { status: 400 })
    }

    if (!isValidDate(start_date)) {
      return NextResponse.json({ error: 'Fecha de inicio no válida' }, { status: 400 })
    }

    if (!forecast_data || !isValidForecastData(forecast_data)) {
      return NextResponse.json({ error: 'Datos de previsión no válidos' }, { status: 400 })
    }

    // 🔒 eq('user_id', userId) asegura que solo puedes editar tus propias previsiones
    const { data, error } = await supabase
      .from('treasury_forecasts')
      .update({
        period_type,
        start_date,
        forecast_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando previsión:', error)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error en PUT treasury-forecast:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}