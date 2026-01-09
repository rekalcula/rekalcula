import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { useCredits } from '@/lib/credits'
import { createInvoiceBackup, InvoiceBackupData } from '@/lib/invoice-backups'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// PASO 2: GUARDAR FACTURA CON FORMA DE PAGO
// (Solo se llama DESPUÉS de confirmar forma de pago)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      // Datos del análisis (de analyze-invoice)
      analysis,
      // Datos del archivo
      fileData,
      // Datos de forma de pago (OBLIGATORIOS)
      paymentMethod,
      paymentTerms,
      paymentDueDate
    } = body

    // ========================================
    // VALIDACIÓN: Forma de pago es OBLIGATORIA
    // ========================================
    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'La forma de pago es obligatoria',
        code: 'PAYMENT_METHOD_REQUIRED'
      }, { status: 400 })
    }

    if (!analysis || !fileData) {
      return NextResponse.json({ 
        error: 'Datos de análisis incompletos',
        code: 'MISSING_DATA'
      }, { status: 400 })
    }

    // Determinar estado de pago inicial
    // Si es pago inmediato (efectivo, tarjeta), marcar como pagado
    const isImmediatePayment = paymentMethod === 'cash' || paymentMethod === 'card'
    const paymentStatus = isImmediatePayment ? 'paid' : 'pending'

    // ========================================
    // GUARDAR FACTURA EN BD
    // ========================================
    const { data: invoiceData, error: dbError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        file_url: fileData.filePath,
        file_name: fileData.fileName,
        total_amount: analysis.total_amount,
        tax_amount: analysis.tax_amount || 0,
        invoice_date: analysis.invoice_date,
        invoice_number: analysis.invoice_number || null,
        category: analysis.category,
        items: analysis.items,
        analysis: analysis.analysis,
        // ⭐ FORMA DE PAGO (ya confirmada)
        payment_method: paymentMethod,
        payment_terms: paymentTerms || 'immediate',
        payment_due_date: paymentDueDate || null,
        payment_status: paymentStatus,
        payment_confirmed: true, // ✅ Siempre true porque pasó por el modal
        actual_payment_date: isImmediatePayment ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (dbError) {
      console.error('[save-invoice] Error guardando en BD:', dbError)
      return NextResponse.json({ error: 'Error guardando los datos' }, { status: 500 })
    }

    // ========================================
    // CREAR BACKUP CON DATOS DEL PROVEEDOR
    // ========================================
    const backupData: InvoiceBackupData = {
      supplier_name: analysis.supplier,
      supplier_address: analysis.supplier_address,
      supplier_nif: analysis.supplier_nif,
      supplier_email: analysis.supplier_email,
      supplier_phone: analysis.supplier_phone,
      items: analysis.items,
      payment_conditions: analysis.payment_conditions,
      bank_account: analysis.bank_account,
      notes: analysis.notes,
      file_name: fileData.fileName,
      file_size: fileData.fileSize,
      invoice_number: analysis.invoice_number,
    }

    const backupResult = await createInvoiceBackup(userId, invoiceData.id, backupData)
    if (!backupResult.success) {
      console.warn('[save-invoice] Error creando backup:', backupResult.error)
    }

    // ========================================
    // DESCONTAR CRÉDITO
    // ========================================
    const creditResult = await useCredits(userId, 'invoices')
    if (!creditResult.success) {
      console.warn('[save-invoice] Error descontando crédito:', creditResult.error)
    }

    // ========================================
    // RETORNAR ÉXITO
    // ========================================
    return NextResponse.json({
      success: true,
      data: {
        invoice: invoiceData,
        analysis: analysis
      },
      creditsRemaining: creditResult.remaining
    })

  } catch (error) {
    console.error('[save-invoice] Error general:', error)
    return NextResponse.json({ error: 'Error guardando la factura' }, { status: 500 })
  }
}