import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔒 VALIDACIONES
function isValidUUID(value: any): boolean {
  if (!value || typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function isValidDate(dateString: any): boolean {
  if (!dateString || typeof dateString !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, status, actualPaymentDate, notes } = body

    if (!invoiceId || !isValidUUID(invoiceId)) {
      return NextResponse.json({ success: false, error: 'ID de factura no válido' }, { status: 400 })
    }

    // 🔒 Validar status
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 })
    }

    // 🔒 Validar fecha
    if (actualPaymentDate && !isValidDate(actualPaymentDate)) {
      return NextResponse.json({ success: false, error: 'Fecha no válida (formato: YYYY-MM-DD)' }, { status: 400 })
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
      console.error('Error actualizando factura')
      return NextResponse.json({ success: false, error: 'Error al actualizar estado de pago' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en POST payment-status')
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

    if (!invoiceId || !isValidUUID(invoiceId)) {
      return NextResponse.json({ success: false, error: 'ID de factura no válido' }, { status: 400 })
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
    console.error('Error en GET payment-status')
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}