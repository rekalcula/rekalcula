import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener todas las fechas unicas de ventas
    const { data: sales, error } = await supabase
      .from('sales')
      .select('sale_date')
      .eq('user_id', userId)
      .order('sale_date', { ascending: true })

    if (error) {
      console.error('Error fetching sales dates:', error)
      return NextResponse.json({ error: 'Error al obtener fechas' }, { status: 500 })
    }

    // Extraer fechas unicas (formato YYYY-MM-DD)
    const uniqueDates = [...new Set(
      sales
        .map(s => s.sale_date)
        .filter(d => d != null)
    )].sort()

    return NextResponse.json({
      success: true,
      dates: uniqueDates
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}