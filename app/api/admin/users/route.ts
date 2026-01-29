import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 1. Obtener suscripciones (sin JOIN)
    const { data: subscriptions, error, count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    const userIds = subscriptions.map(s => s.user_id)

    // 2. Obtener créditos por separado
    const { data: allCredits } = await supabase
      .from('user_credits')
      .select('*')
      .in('user_id', userIds)

    // 3. Obtener conteo de facturas
    const { data: invoiceCounts } = await supabase
      .from('invoices')
      .select('user_id')
      .in('user_id', userIds)

    // 4. Obtener conteo de tickets
    const { data: ticketCounts } = await supabase
      .from('sales')
      .select('user_id')
      .in('user_id', userIds)

    // 5. Combinar datos
    const usersWithCounts = subscriptions.map(sub => {
      const credits = allCredits?.find(c => c.user_id === sub.user_id)
      const invoices = invoiceCounts?.filter(i => i.user_id === sub.user_id).length || 0
      const tickets = ticketCounts?.filter(t => t.user_id === sub.user_id).length || 0

      return {
        ...sub,
        user_credits: credits ? [credits] : [],
        total_invoices: invoices,
        total_tickets: tickets
      }
    })

    return NextResponse.json({
      success: true,
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userIdToDelete = searchParams.get('userId')

    if (!userIdToDelete) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    // Eliminar en orden para evitar errores de FK
    await supabase.from('credit_transactions').delete().eq('user_id', userIdToDelete)
    await supabase.from('user_credits').delete().eq('user_id', userIdToDelete)
    await supabase.from('invoices').delete().eq('user_id', userIdToDelete)
    await supabase.from('sales').delete().eq('user_id', userIdToDelete)
    await supabase.from('terms_acceptance_log').delete().eq('user_id', userIdToDelete)
    
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userIdToDelete)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}