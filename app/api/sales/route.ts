import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener ventas
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: sales, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('user_id', userId)
      .order('sale_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(sales)
  } catch (error) {
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

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        sale_date: body.sale_date,
        total: body.total,
        payment_method: body.payment_method,
        notes: body.notes,
        source: 'manual'
      })
      .select()
      .single()

    if (saleError) {
      return NextResponse.json({ error: saleError.message }, { status: 500 })
    }

    // Insertar items si existen
    if (body.items && body.items.length > 0) {
      const saleItems = body.items.map((item: any) => ({
        sale_id: sale.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      }))

      await supabase.from('sale_items').insert(saleItems)
    }

    return NextResponse.json({ success: true, sale })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar venta(s)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids') // Para eliminación múltiple

    if (ids) {
      // Eliminación múltiple
      const idsArray = ids.split(',')
      
      // Primero eliminar los items
      for (const saleId of idsArray) {
        await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', saleId)
      }

      // Luego eliminar las ventas
      const { error } = await supabase
        .from('sales')
        .delete()
        .in('id', idsArray)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: idsArray.length })
    } else if (id) {
      // Eliminación individual
      // Primero eliminar los items
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id)

      // Luego eliminar la venta
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}