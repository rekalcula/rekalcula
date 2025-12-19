import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
    const id = searchParams.get('id')
    const ids = searchParams.get('ids') // Para eliminación múltiple

    if (ids) {
      // Eliminación múltiple
      const idsArray = ids.split(',')
      
      // Eliminar archivos de Storage
      for (const invoiceId of idsArray) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('file_url')
          .eq('id', invoiceId)
          .eq('user_id', userId)
          .single()

        if (invoice?.file_url) {
          const fileName = invoice.file_url.split('/').pop()
          if (fileName) {
            await supabase.storage
              .from('invoices')
              .remove([`${userId}/${fileName}`])
          }
        }
      }

      // Eliminar las facturas de la base de datos
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', idsArray)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted: idsArray.length })
    } else if (id) {
      // Eliminación individual
      // Obtener la factura para eliminar el archivo
      const { data: invoice } = await supabase
        .from('invoices')
        .select('file_url')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (invoice?.file_url) {
        const fileName = invoice.file_url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('invoices')
            .remove([`${userId}/${fileName}`])
        }
      }

      // Eliminar la factura
      const { error } = await supabase
        .from('invoices')
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
    console.error('Error eliminando factura:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}