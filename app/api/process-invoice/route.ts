import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Route: /api/process-invoice
 * Procesa facturas subidas por el usuario
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener datos del body
    const body = await request.json()
    const { invoiceData, fileUrl } = body

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Datos de factura requeridos' },
        { status: 400 }
      )
    }

    // Validar campos requeridos
    const requiredFields = ['fecha', 'total', 'empresa']
    const missingFields = requiredFields.filter(
      (field) => !invoiceData[field]
    )

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Campos requeridos faltantes',
          missingFields,
        },
        { status: 400 }
      )
    }

    // Insertar factura en la base de datos
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        fecha: invoiceData.fecha,
        empresa: invoiceData.empresa,
        concepto: invoiceData.concepto || '',
        base_imponible: invoiceData.baseImponible || 0,
        iva: invoiceData.iva || 0,
        total: invoiceData.total,
        tipo: invoiceData.tipo || 'gasto',
        categoria: invoiceData.categoria || 'otros',
        file_url: fileUrl || null,
        metadata: invoiceData.metadata || {},
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error insertando factura:', insertError)
      return NextResponse.json(
        { error: 'Error al guardar factura' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        invoice,
        message: 'Factura procesada correctamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error procesando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (invoiceId) {
      // Obtener una factura específica
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single()

      if (error || !invoice) {
        return NextResponse.json(
          { error: 'Factura no encontrada' },
          { status: 404 }
        )
      }

      return NextResponse.json({ invoice })
    }

    // Obtener todas las facturas del usuario
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('Error obteniendo facturas:', error)
      return NextResponse.json(
        { error: 'Error al obtener facturas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      invoices,
      count: invoices.length,
    })
  } catch (error) {
    console.error('Error obteniendo facturas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Actualizar factura (solo si pertenece al usuario)
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando factura:', error)
      return NextResponse.json(
        { error: 'Error al actualizar factura' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: 'Factura actualizada correctamente',
    })
  } catch (error) {
    console.error('Error actualizando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      )
    }

    // Eliminar factura (solo si pertenece al usuario)
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error eliminando factura:', error)
      return NextResponse.json(
        { error: 'Error al eliminar factura' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Factura eliminada correctamente',
    })
  } catch (error) {
    console.error('Error eliminando factura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}