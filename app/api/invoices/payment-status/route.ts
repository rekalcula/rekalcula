// app/api/invoices/payment-status/route.ts
// API para actualizar la forma de pago de facturas

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/**
 * PUT - Actualizar forma de pago de una factura
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      invoiceId, 
      paymentMethod, 
      paymentTerms,
      paymentDueDate 
    } = body

    // Validaciones
    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId requerido' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'paymentMethod requerido' },
        { status: 400 }
      )
    }

    if (!paymentTerms) {
      return NextResponse.json(
        { success: false, error: 'paymentTerms requerido' },
        { status: 400 }
      )
    }

    // Validar que el método de pago sea válido
    const validMethods = ['cash', 'transfer', 'card', 'check', 'deferred']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Método de pago inválido' },
        { status: 400 }
      )
    }

    // Validar que los términos sean válidos
    const validTerms = ['immediate', '30_days', '60_days', '90_days', 'custom']
    if (!validTerms.includes(paymentTerms)) {
      return NextResponse.json(
        { success: false, error: 'Términos de pago inválidos' },
        { status: 400 }
      )
    }

    // Verificar que la factura pertenece al usuario
    const { data: invoice, error: checkError } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id')
      .eq('id', invoiceId)
      .single()

    if (checkError || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (invoice.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para modificar esta factura' },
        { status: 403 }
      )
    }

    // Actualizar la factura con la información de pago
    const { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        payment_method: paymentMethod,
        payment_terms: paymentTerms,
        payment_due_date: paymentDueDate || null,
        payment_confirmed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating invoice payment status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar la factura' },
        { status: 500 }
      )
    }

    console.log(`✅ Payment status updated for invoice ${invoiceId}`)

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice
    })

  } catch (error) {
    console.error('Exception in payment-status PUT:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtener estado de pago de una factura
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'invoiceId requerido' },
        { status: 400 }
      )
    }

    // Obtener información de pago de la factura
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('id, payment_method, payment_terms, payment_due_date, payment_confirmed')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (error || !invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentStatus: {
        method: invoice.payment_method,
        terms: invoice.payment_terms,
        dueDate: invoice.payment_due_date,
        confirmed: invoice.payment_confirmed
      }
    })

  } catch (error) {
    console.error('Exception in payment-status GET:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Actualizar solo la fecha de vencimiento
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { invoiceId, paymentDueDate } = body

    if (!invoiceId || !paymentDueDate) {
      return NextResponse.json(
        { success: false, error: 'invoiceId y paymentDueDate requeridos' },
        { status: 400 }
      )
    }

    // Verificar propiedad de la factura
    const { data: invoice, error: checkError } = await supabaseAdmin
      .from('invoices')
      .select('id, user_id')
      .eq('id', invoiceId)
      .single()

    if (checkError || !invoice || invoice.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada o no autorizado' },
        { status: 404 }
      )
    }

    // Actualizar solo la fecha de vencimiento
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({
        payment_due_date: paymentDueDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating due date:', error)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar fecha de vencimiento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice: data
    })

  } catch (error) {
    console.error('Exception in payment-status PATCH:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    )
  }
}