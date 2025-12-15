import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json({ error: 'ID de factura requerido' }, { status: 400 })
    }

    console.log('Eliminando factura:', invoiceId, 'para usuario:', userId)

    // Primero obtener la factura para verificar propiedad y obtener file_url
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !invoice) {
      console.error('Error obteniendo factura:', fetchError)
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    console.log('Factura encontrada:', invoice.file_name)

    // Eliminar archivo de Storage
    if (invoice.file_url) {
      const filePath = invoice.file_url.split('/').slice(-2).join('/')
      console.log('Eliminando archivo de storage:', filePath)
      const { error: storageError } = await supabase.storage
        .from('invoices')
        .remove([filePath])
      
      if (storageError) {
        console.error('Error eliminando de storage:', storageError)
      }
    }

    // Eliminar registro de la base de datos
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error eliminando factura de BD:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar factura' }, { status: 500 })
    }

    console.log('Factura eliminada exitosamente')
    return NextResponse.json({ success: true, message: 'Factura eliminada correctamente' })

  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}