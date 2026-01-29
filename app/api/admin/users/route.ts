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

    const { data: subscriptions, error, count } = await supabase
      .from('subscriptions')
      .select(`
        *,
        user_credits (
          invoices_available,
          tickets_available,
          analyses_available,
          invoices_used_this_month,
          tickets_used_this_month,
          analyses_used_this_month
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const userIds = subscriptions?.map(s => s.user_id) || []

    const { data: invoiceCounts } = await supabase
      .from('invoices')
      .select('user_id')
      .in('user_id', userIds)

    const { data: ticketCounts } = await supabase
      .from('sales')
      .select('user_id')
      .in('user_id', userIds)

    const usersWithCounts = subscriptions?.map(sub => {
      const invoices = invoiceCounts?.filter(i => i.user_id === sub.user_id).length || 0
      const tickets = ticketCounts?.filter(t => t.user_id === sub.user_id).length || 0

      return {
        ...sub,
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Añadir al final del archivo existente

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
    // 1. Eliminar créditos del usuario
    await supabase
      .from('user_credits')
      .delete()
      .eq('user_id', userIdToDelete)

    // 2. Eliminar facturas
    await supabase
      .from('invoices')
      .delete()
      .eq('user_id', userIdToDelete)

    // 3. Eliminar ventas/tickets
    await supabase
      .from('sales')
      .delete()
      .eq('user_id', userIdToDelete)

    // 4. Eliminar suscripción
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