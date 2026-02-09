import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface BusinessHour {
  day_of_week: number
  is_closed: boolean
  morning_open: string | null
  morning_close: string | null
  afternoon_open: string | null
  afternoon_close: string | null
}

// 🔒 VALIDACIÓN: Formato HH:MM
function isValidTime(time: string | null): boolean {
  if (time === null) return true
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
}

// 🔒 VALIDACIÓN: Cada entrada de horario
function validarHorario(hour: BusinessHour): string | null {
  if (!Number.isInteger(hour.day_of_week) || hour.day_of_week < 0 || hour.day_of_week > 6) {
    return `day_of_week inválido: ${hour.day_of_week}. Debe ser 0-6`
  }
  if (!hour.is_closed) {
    if (!isValidTime(hour.morning_open) || !isValidTime(hour.morning_close) ||
        !isValidTime(hour.afternoon_open) || !isValidTime(hour.afternoon_close)) {
      return `Formato de hora inválido en día ${hour.day_of_week}. Usar HH:MM`
    }
  }
  return null
}

// GET: Obtener configuración de horarios

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: hours, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error al obtener horarios:', error)
      return NextResponse.json({ error: 'Error al cargar horarios' }, { status: 500 })
    }

    return NextResponse.json({
      configured: hours && hours.length > 0,
      hours: hours || []
    })

  } catch (error) {
    console.error('Error en GET business-hours:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST: Guardar configuración de horarios
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { hours } = body as { hours: BusinessHour[] }

    if (!hours || !Array.isArray(hours)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Validar que hay 7 días (0-6: Lunes a Domingo)
    if (hours.length !== 7) {
      return NextResponse.json({ error: 'Debe configurar los 7 días de la semana' }, { status: 400 })
    }

    // 🔒 VALIDACIÓN: Cada día debe ser válido y sin duplicados
    const diasVistos = new Set<number>()
    for (const hour of hours) {
      const errorHorario = validarHorario(hour)
      if (errorHorario) {
        return NextResponse.json({ error: errorHorario }, { status: 400 })
      }
      if (diasVistos.has(hour.day_of_week)) {
        return NextResponse.json({ error: `Día ${hour.day_of_week} duplicado` }, { status: 400 })
      }
      diasVistos.add(hour.day_of_week)
    }

    // Borrar horarios existentes del usuario
    await supabase
      .from('business_hours')
      .delete()
      .eq('user_id', userId)

    // Insertar nuevos horarios
    const hoursToInsert = hours.map(hour => ({
      user_id: userId,
      day_of_week: hour.day_of_week,
      is_closed: hour.is_closed,
      morning_open: hour.is_closed ? null : hour.morning_open,
      morning_close: hour.is_closed ? null : hour.morning_close,
      afternoon_open: hour.is_closed ? null : hour.afternoon_open,
      afternoon_close: hour.is_closed ? null : hour.afternoon_close
    }))

    const { data, error } = await supabase
      .from('business_hours')
      .insert(hoursToInsert)
      .select()

    if (error) {
      console.error('Error al guardar horarios:', error)
      return NextResponse.json({ error: 'Error al guardar horarios' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Horarios guardados correctamente',
      hours: data
    })

  } catch (error) {
    console.error('Error en POST business-hours:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}