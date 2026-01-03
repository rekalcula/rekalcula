'use client'

import { useState, useEffect } from 'react'
import DashboardNav from '@/components/DashboardNav'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  RefreshCw,
  Banknote,
  Receipt
} from 'lucide-react'

interface CashflowData {
  totalInbound: number
  totalOutbound: number
  netCashflow: number
  inboundCompleted: number
  inboundPending: number
  outboundCompleted: number
  outboundPending: number
  fixedCostsMonthly: number
  overdueInbound: number
  overdueOutbound: number
  overdueInboundCount: number
  overdueOutboundCount: number
  byPeriod: {
    date: string
    inbound: number
    outbound: number
    net: number
    cumulative: number
  }[]
  upcomingInbound: any[]
  upcomingOutbound: any[]
}

export default function CashflowPage() {
  const [data, setData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | '3months' | '6months'>('month')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchCashflow()
  }, [period, groupBy])

  const fetchCashflow = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange(period)
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy
      })

      const res = await fetch(`/api/cashflow?${params}`)
      const result = await res.json()

      if (result.success) {
        setData(result.cashflow)
      }
    } catch (error) {
      console.error('Error fetching cashflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = (p: string) => {
    const startDate = new Date()
    const endDate = new Date()

    switch (p) {
      case 'month':
        startDate.setDate(1)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0)
        break
      case '3months':
        startDate.setMonth(startDate.getMonth() - 1)
        endDate.setMonth(endDate.getMonth() + 2)
        break
      case '6months':
        startDate.setMonth(startDate.getMonth() - 2)
        endDate.setMonth(endDate.getMonth() + 4)
        break
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const markAsPaid = async (type: 'invoice' | 'sale', id: string) => {
    try {
      await fetch('/api/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action: 'mark_paid' })
      })
      fetchCashflow()
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64">
        <div className="space-y-6">
          {/* Header con filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flujo de Caja</h1>
              <p className="text-gray-500 mt-1">Controla tus cobros y pagos en tiempo real</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'month', label: 'Este mes' },
                  { value: '3months', label: '3 meses' },
                  { value: '6months', label: '6 meses' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value as any)}
                    className={`px-3 py-1.5 text-sm rounded-md transition ${
                      period === opt.value
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchCashflow}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-black transition"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Alertas de vencidos */}
              {data && (data.overdueInboundCount > 0 || data.overdueOutboundCount > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800">Atención: Pagos vencidos</h3>
                      <div className="mt-1 text-sm text-red-700 space-y-1">
                        {data.overdueInboundCount > 0 && (
                          <p>
                            {data.overdueInboundCount} cobro{data.overdueInboundCount > 1 ? 's' : ''} pendiente{data.overdueInboundCount > 1 ? 's' : ''} por {formatCurrency(data.overdueInbound)}
                          </p>
                        )}
                        {data.overdueOutboundCount > 0 && (
                          <p>
                            {data.overdueOutboundCount} pago{data.overdueOutboundCount > 1 ? 's' : ''} vencido{data.overdueOutboundCount > 1 ? 's' : ''} por {formatCurrency(data.overdueOutbound)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Entradas */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm">Entradas (Cobros)</span>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ArrowDownRight className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(data?.totalInbound || 0)}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Cobrado: {formatCurrency(data?.inboundCompleted || 0)}</span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600">Pendiente: {formatCurrency(data?.inboundPending || 0)}</span>
                  </div>
                </div>

                {/* Salidas */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm">Salidas (Pagos)</span>
                    <div className="p-2 bg-red-100 rounded-lg">
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(data?.totalOutbound || 0)}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">Pagado: {formatCurrency(data?.outboundCompleted || 0)}</span>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600">Pendiente: {formatCurrency(data?.outboundPending || 0)}</span>
                  </div>
                  {data?.fixedCostsMonthly && data.fixedCostsMonthly > 0 && (
                    <div className="mt-1 text-xs text-gray-400">
                      Incluye {formatCurrency(data.fixedCostsMonthly)}/mes en costos fijos
                    </div>
                  )}
                </div>

                {/* Balance */}
                <div className={`rounded-xl border p-6 ${
                  (data?.netCashflow || 0) >= 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 text-sm">Balance Neto</span>
                    <div className={`p-2 rounded-lg ${
                      (data?.netCashflow || 0) >= 0 ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {(data?.netCashflow || 0) >= 0 
                        ? <TrendingUp className="w-5 h-5 text-green-700" />
                        : <TrendingDown className="w-5 h-5 text-red-700" />
                      }
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${
                    (data?.netCashflow || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {(data?.netCashflow || 0) >= 0 ? '+' : ''}{formatCurrency(data?.netCashflow || 0)}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {(data?.netCashflow || 0) >= 0 
                      ? 'Flujo de caja positivo' 
                      : 'Flujo de caja negativo'
                    }
                  </p>
                </div>
              </div>

              {/* Gráfico de evolución */}
              {data?.byPeriod && data.byPeriod.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Evolución del Flujo de Caja</h2>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {[
                        { value: 'day', label: 'Día' },
                        { value: 'week', label: 'Semana' },
                        { value: 'month', label: 'Mes' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setGroupBy(opt.value as any)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            groupBy === opt.value
                              ? 'bg-white text-black shadow-sm'
                              : 'text-gray-600 hover:text-black'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-3 font-medium">Período</th>
                          <th className="pb-3 font-medium text-right">Entradas</th>
                          <th className="pb-3 font-medium text-right">Salidas</th>
                          <th className="pb-3 font-medium text-right">Neto</th>
                          <th className="pb-3 font-medium text-right">Acumulado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byPeriod.map((period) => (
                          <tr key={period.date} className="border-b border-gray-100">
                            <td className="py-3 text-gray-900">{formatDate(period.date)}</td>
                            <td className="py-3 text-right text-green-600">
                              {period.inbound > 0 ? `+${formatCurrency(period.inbound)}` : '-'}
                            </td>
                            <td className="py-3 text-right text-red-600">
                              {period.outbound > 0 ? `-${formatCurrency(period.outbound)}` : '-'}
                            </td>
                            <td className={`py-3 text-right font-medium ${
                              period.net >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {period.net >= 0 ? '+' : ''}{formatCurrency(period.net)}
                            </td>
                            <td className={`py-3 text-right ${
                              period.cumulative >= 0 ? 'text-gray-900' : 'text-red-600'
                            }`}>
                              {formatCurrency(period.cumulative)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Próximos vencimientos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Próximos cobros */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-green-500" />
                      Próximos Cobros
                    </h2>
                    <span className="text-sm text-gray-500">30 días</span>
                  </div>

                  {data?.upcomingInbound && data.upcomingInbound.length > 0 ? (
                    <div className="space-y-3">
                      {data.upcomingInbound.map((item: any) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.customer_name || 'Cliente'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Vence: {formatDate(item.payment_due_date)}
                              {item.payment_methods?.name && ` • ${item.payment_methods.name}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(item.total)}
                            </span>
                            <button
                              onClick={() => markAsPaid('sale', item.id)}
                              className="text-xs text-gray-500 hover:text-green-600 transition"
                              title="Marcar como cobrado"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No hay cobros pendientes en los próximos 30 días
                    </p>
                  )}
                </div>

                {/* Próximos pagos */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-red-500" />
                      Próximos Pagos
                    </h2>
                    <span className="text-sm text-gray-500">30 días</span>
                  </div>

                  {data?.upcomingOutbound && data.upcomingOutbound.length > 0 ? (
                    <div className="space-y-3">
                      {data.upcomingOutbound.map((item: any) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.supplier || 'Proveedor'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Vence: {formatDate(item.payment_due_date)}
                              {item.payment_methods?.name && ` • ${item.payment_methods.name}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-red-600">
                              {formatCurrency(item.total || item.total_amount)}
                            </span>
                            <button
                              onClick={() => markAsPaid('invoice', item.id)}
                              className="text-xs text-gray-500 hover:text-green-600 transition"
                              title="Marcar como pagado"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No hay pagos pendientes en los próximos 30 días
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}