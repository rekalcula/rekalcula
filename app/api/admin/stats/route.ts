import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { count: totalUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing'])

    const { count: totalInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    const { count: totalTickets } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })

    const { data: usersByPlan } = await supabase
      .from('subscriptions')
      .select('plan')
      .not('plan', 'is', null)

    const planCounts = usersByPlan?.reduce((acc: any, sub) => {
      acc[sub.plan] = (acc[sub.plan] || 0) + 1
      return acc
    }, {}) || {}

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    const { count: recentTickets } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalInvoices: totalInvoices || 0,
        totalTickets: totalTickets || 0,
        usersByPlan: planCounts,
        recentActivity: {
          invoices: recentInvoices || 0,
          tickets: recentTickets || 0
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}