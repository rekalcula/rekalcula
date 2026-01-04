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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { invoiceId, paymentStatus, paymentTerm, dueDate } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'ID de factura requerido' }, { status: 400 })
    }

    // Verificar que la factura pertenece al usuario
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    // Actualizar estado de pago
    const { error } = await supabase
      .from('invoices')
      .update({
        payment_status: paymentStatus,
        payment_term: paymentTerm,
        due_date: dueDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error actualizando factura:', error)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error en API payment-status:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}