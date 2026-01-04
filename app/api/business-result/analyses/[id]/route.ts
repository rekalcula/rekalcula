import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener detalle completo de un análisis específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from('business_result_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Análisis no encontrado' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, analysis: data })
  } catch (error: any) {
    console.error('Error en GET /api/business-result/analyses/[id]:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}