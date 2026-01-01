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
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { filePath, bucket } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path de archivo requerido' },
        { status: 400 }
      )
    }

    // Verificar que el archivo pertenece al usuario
    if (!filePath.startsWith(userId + '/')) {
      return NextResponse.json(
        { error: 'No autorizado para acceder a este archivo' },
        { status: 403 }
      )
    }

    // Determinar el bucket (por defecto 'invoices')
    const bucketName = bucket || 'invoices'
    
    // Validar que el bucket sea uno de los permitidos
    if (!['invoices', 'sales-tickets'].includes(bucketName)) {
      return NextResponse.json(
        { error: 'Bucket no valido' },
        { status: 400 }
      )
    }

    // Generar URL firmada (valida por 1 hora)
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600)

    if (error) {
      console.error('Error generando URL firmada:', error)
      return NextResponse.json(
        { error: 'Error generando URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: data.signedUrl })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}