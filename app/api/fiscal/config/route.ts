import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import type { FiscalConfig } from '@/lib/fiscal/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('fiscal_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ success: true, config: data || null })
  } catch (error) {
    console.error('Error obteniendo config fiscal:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const config: FiscalConfig = await request.json()

    const { data: existing } = await supabase
      .from('fiscal_config')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result

    if (existing) {
      result = await supabase
        .from('fiscal_config')
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single()
    } else {
      result = await supabase
        .from('fiscal_config')
        .insert({ ...config, user_id: userId })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json({ success: true, config: result.data })
  } catch (error) {
    console.error('Error guardando config fiscal:', error)
    return NextResponse.json({ success: false, error: 'Error guardando' }, { status: 500 })
  }
}