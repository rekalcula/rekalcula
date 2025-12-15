import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// GET - Obtener ventas
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit') || '50'

    let query = supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('user_id', userId)
      .order('sale_date', { ascending: false })
      .limit(parseInt(limit))

    if (startDate) {
      query = query.gte('sale_date', startDate)
    }
    if (endDate) {
      query = query.lte('sale_date', endDate)
    }

    const { data: sales, error } = await query

    if (error) throw error

    // Calcular totales
    const totalSales = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)
    const totalCost = (sales || []).reduce((sum, sale) => {
      return sum + (sale.sale_items || []).reduce((itemSum: number, item: any) => 
        itemSum + ((item.cost_price || 0) * (item.quantity || 0)), 0)
    }, 0)

    return NextResponse.json({ 
      sales: sales || [], 
      totalSales,
      totalCost,
      grossProfit: totalSales - totalCost
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear venta
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { sale_date, items, payment_method, notes, source } = body

    // Calcular totales
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.unit_price * item.quantity), 0)
    const totalCost = items.reduce((sum: number, item: any) => 
      sum + ((item.cost_price || 0) * item.quantity), 0)

    // Crear venta
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        sale_date: sale_date || new Date().toISOString().split('T')[0],
        subtotal,
        total: subtotal,
        payment_method,
        notes,
        source: source || 'manual'
      })
      .select()
      .single()

    if (saleError) throw saleError

    // Crear items de la venta
    const saleItems = items.map((item: any) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: item.cost_price || 0,
      total: item.unit_price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems)

    if (itemsError) throw itemsError

    return NextResponse.json({ success: true, sale })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al guardar venta' }, { status: 500 })
  }
}

// DELETE - Eliminar venta
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Los items se eliminan automáticamente por CASCADE
    await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}