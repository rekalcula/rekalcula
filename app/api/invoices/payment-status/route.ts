import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, status, actualPaymentDate, notes } = body

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'ID de factura requerido' }, { status: 400 })
    }

    // Verificar que la factura pertenece al usuario
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, user_id')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !invoice) {
      return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
    }

    // Actualizar el estado de pago
    const updateData: any = {
      payment_status: status || 'paid',
      updated_at: new Date().toISOString()
    }

    if (actualPaymentDate) {
      updateData.actual_payment_date = actualPaymentDate
    }

    if (notes) {
      updateData.payment_notes = notes
    }

    const { error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error actualizando factura:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en payment-status:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'ID de factura requerido' }, { status: 400 })
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, payment_status, actual_payment_date, payment_notes, payment_due_date')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: invoice })

  } catch (error) {
    console.error('Error obteniendo estado de pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}