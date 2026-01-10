import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_PAGE_SIZE = 50
const DEFAULT_VAT_RATE = 0.21 // 21% IVA por defecto en España

// GET - Obtener ventas con paginación
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE))
    const offset = (page - 1) * limit

    // Consulta 1: Obtener totales (COUNT y SUM de TODAS las ventas)
    const { count, error: countError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    // Consulta 2: Obtener suma total de todas las ventas
    const { data: sumData, error: sumError } = await supabase
      .from('sales')
      .select('total')
      .eq('user_id', userId)

    if (sumError) {
      return NextResponse.json({ error: sumError.message }, { status: 500 })
    }

    const totalAmount = sumData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0

    // Consulta 3: Obtener ventas paginadas con sus items
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('user_id', userId)
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (salesError) {
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      sales: sales || [],
      total,
      totalAmount,
      page,
      limit,
      totalPages,
      hasMore
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear venta (manual o desde ticket)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // ========================================
    // ⭐ CÁLCULO CONTABLE CRÍTICO
    // Si el importe incluye IVA, calcular base imponible
    // ========================================
    const inputAmount = parseFloat(body.total) || 0
    const includeVat = body.include_vat === true
    const vatRate = body.vat_rate || DEFAULT_VAT_RATE

    let baseAmount: number
    let taxAmount: number
    let grossTotal: number

    if (includeVat) {
      // El importe introducido INCLUYE IVA
      // Calcular base imponible: base = total / (1 + IVA)
      grossTotal = inputAmount
      baseAmount = inputAmount / (1 + vatRate)
      taxAmount = inputAmount - baseAmount
    } else {
      // El importe introducido es la base (SIN IVA)
      baseAmount = inputAmount
      taxAmount = 0
      grossTotal = inputAmount
    }

    // Redondear a 2 decimales
    baseAmount = Math.round(baseAmount * 100) / 100
    taxAmount = Math.round(taxAmount * 100) / 100
    grossTotal = Math.round(grossTotal * 100) / 100

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        sale_date: body.sale_date,
        sale_time: body.sale_time || null,
        // ⭐ CAMBIO CRÍTICO: Guardar base imponible para contabilidad
        subtotal: baseAmount,
        tax_amount: taxAmount,
        total: baseAmount, // Total contable = base imponible
        // ⭐ NUEVO: Almacenar importe bruto (con IVA) por referencia
        gross_total: grossTotal,
        payment_method: body.payment_method,
        notes: body.notes,
        source: 'manual',
        // ⭐ NUEVO: Flag para indicar si se incluyó IVA
        include_vat: includeVat
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