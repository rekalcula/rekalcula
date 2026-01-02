import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data: stats, error: statsError } = await supabase
      .from('ai_usage_stats_30d')
      .select('*')

    if (statsError) throw statsError

    const { data: trend, error: trendError } = await supabase
      .from('ai_usage_daily_trend')
      .select('*')
      .order('date', { ascending: false })
      .limit(7)

    if (trendError) throw trendError

    const totals = {
      totalOperations: 0,
      totalSpent: 0,
      byOperationType: {} as Record<string, any>
    }

    stats?.forEach((stat: any) => {
      totals.totalOperations += stat.total_operations || 0
      totals.totalSpent += stat.total_spent_eur || 0

      const avgCost = stat.avg_cost_eur || 0
      const recommendedPrice = Math.ceil(avgCost * 1.2 * 1000) / 1000

      totals.byOperationType[stat.operation_type] = {
        operations: stat.total_operations,
        avgCost: avgCost,
        totalSpent: stat.total_spent_eur || 0,
        recommendedPrice: recommendedPrice
      }
    })

    const trendByType: Record<string, any[]> = {}
    trend?.forEach((item: any) => {
      if (!trendByType[item.operation_type]) {
        trendByType[item.operation_type] = []
      }
      trendByType[item.operation_type].push({
        date: item.date,
        operations: item.operations,
        dailyCost: item.daily_cost_eur,
        avgCost: item.avg_cost_eur
      })
    })

    return NextResponse.json({
      success: true,
      stats: stats || [],
      trend: trendByType,
      totals,
      recommendations: {
        invoice: totals.byOperationType['invoice']?.recommendedPrice || 0.017,
        ticket: totals.byOperationType['ticket']?.recommendedPrice || 0.011,
        analysis: totals.byOperationType['analysis']?.recommendedPrice || 0.006,
      }
    })
  } catch (error) {
    console.error('Error fetching AI usage stats:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
