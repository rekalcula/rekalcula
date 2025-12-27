// ============================================================
// GET /api/sales/available-dates
// Retorna los dias con ventas para sombrear en el calendario
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener todas las fechas unicas con ventas
    const { data: sales, error } = await supabase
      .from('sales')
      .select('sale_date')
      .eq('user_id', userId)
      .order('sale_date', { ascending: true })

    if (error) {
      console.error('Error obteniendo fechas:', error)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo fechas' },
        { status: 500 }
      )
    }

    // Extraer fechas unicas (formato YYYY-MM-DD)
    const uniqueDates = [...new Set(sales.map(s => s.sale_date))]

    return NextResponse.json({
      success: true,
      dates: uniqueDates
    })

  } catch (error) {
    console.error('Error en available-dates:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}