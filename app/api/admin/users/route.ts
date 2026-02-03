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
    const limit = parseInt(searchParams.get('limit') || '200')
    const offset = (page - 1) * limit

    // 1. Obtener usuarios con suscripciones
    const { data: subscriptions, error, count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // 2. Obtener usuarios con tokens push activos
    const { data: pushTokenUsers } = await supabase
      .from('push_tokens')
      .select('user_id, device_type, device_name, created_at')
      .eq('is_active', true)

    // 3. Crear un Set de todos los user_ids únicos
    const allUserIds = new Set<string>()
    
    // Agregar usuarios con suscripción
    subscriptions?.forEach(sub => allUserIds.add(sub.user_id))
    
    // Agregar usuarios con tokens push
    pushTokenUsers?.forEach(token => allUserIds.add(token.user_id))

    const userIdsArray = Array.from(allUserIds)

    if (userIdsArray.length === 0) {
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

    // 4. Obtener créditos por separado
    const { data: allCredits } = await supabase
      .from('user_credits')
      .select('*')
      .in('user_id', userIdsArray)

    // 5. Obtener conteo de facturas
    const { data: invoiceCounts } = await supabase
      .from('invoices')
      .select('user_id')
      .in('user_id', userIdsArray)

    // 6. Obtener conteo de tickets
    const { data: ticketCounts } = await supabase
      .from('sales')
      .select('user_id')
      .in('user_id', userIdsArray)

    // 7. Combinar datos de todos los usuarios
    const usersMap = new Map()

    // Primero agregar usuarios con suscripción
    subscriptions?.forEach(sub => {
      usersMap.set(sub.user_id, {
        ...sub,
        user_credits: [],
        total_invoices: 0,
        total_tickets: 0,
        has_push: false,
        push_devices: []
      })
    })

    // Luego agregar usuarios que solo tienen tokens push (sin suscripción)
    pushTokenUsers?.forEach(token => {
      if (!usersMap.has(token.user_id)) {
        // Usuario sin suscripción pero con notificaciones activas
        usersMap.set(token.user_id, {
          user_id: token.user_id,
          status: 'active',
          plan: 'free',
          created_at: token.created_at,
          user_credits: [],
          total_invoices: 0,
          total_tickets: 0,
          has_push: true,
          push_devices: []
        })
      }
    })

    // Agregar información de push tokens a todos los usuarios
    pushTokenUsers?.forEach(token => {
      const user = usersMap.get(token.user_id)
      if (user) {
        user.has_push = true
        if (!user.push_devices.includes(token.device_type)) {
          user.push_devices.push(token.device_type)
        }
      }
    })

    // Agregar créditos, facturas y tickets
    const usersArray = Array.from(usersMap.values())
    
    usersArray.forEach(user => {
      const credits = allCredits?.find(c => c.user_id === user.user_id)
      const invoices = invoiceCounts?.filter(i => i.user_id === user.user_id).length || 0
      const tickets = ticketCounts?.filter(t => t.user_id === user.user_id).length || 0

      user.user_credits = credits ? [credits] : []
      user.total_invoices = invoices
      user.total_tickets = tickets
    })

    // Ordenar por fecha de creación (más recientes primero)
    usersArray.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({
      success: true,
      users: usersArray,
      pagination: {
        page,
        limit,
        total: usersArray.length,
        totalPages: Math.ceil(usersArray.length / limit)
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
    await supabase.from('push_tokens').delete().eq('user_id', userIdToDelete)
    
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