'use client'

import { useState, useEffect } from 'react'

interface Product {
  name: string
  quantity: number
  revenue: number
  percentage: number
  revenuePercentage: number
  prevQuantity: number
  prevRevenue: number
  quantityChange: number
  revenueChange: number
}

interface AnalyticsData {
  period: string
  startDate: string
  endDate: string
  totalQuantity: number
  totalRevenue: number
  totalSales: number
  topProduct: Product | null
  products: Product[]
  comparison: {
    prevStartDate: string
    prevEndDate: string
    prevTotalQuantity: number
    prevTotalRevenue: number
    prevTotalSales: number
    quantityChange: number
    revenueChange: number
  } | null
}

export default function SalesAnalyticsChart() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month')
  const [compare, setCompare] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'quantity' | 'revenue'>('quantity')

  useEffect(() => {
    fetchData()
  }, [period, compare])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/sales?period=${period}&compare=${compare}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Hoy'
      case 'week': return 'Esta semana'
      case 'month': return 'Este mes'
    }
  }

  const getCompareLabel = () => {
    switch (period) {
      case 'day': return 'vs Ayer'
      case 'week': return 'vs Semana anterior'
      case 'month': return 'vs Mes anterior'
    }
  }

  const formatChange = (change: number) => {
    if (change > 0) return `↑ +${change}%`
    if (change < 0) return `↓ ${change}%`
    return '→ 0%'
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-[#D98C21]'
    return 'text-gray-500'
  }

  const getMaxValue = () => {
    if (!data || data.products.length === 0) return 100
    if (viewMode === 'quantity') {
      return Math.max(...data.products.map(p => p.quantity))
    }
    return Math.max(...data.products.map(p => p.revenue))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c15f3c]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-[#0D0D0D] rounded-xl shadow-sm p-4 text-[#FFFFFF]">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4">
          {/* Período */}
          <div className="flex items-center space-x-2">
            <span className="text-[20px] font-medium text-gray-700">Período:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPeriod('day')}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[20px] font-medium transition-colors ${
                  period === 'day' ? 'bg-[#0D0D0D] text-[#D98C21]' : 'text-[#FFFFFF] hover:text-gray-300'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg text-[20px] font-medium transition-colors ${
                  period === 'week' ? 'bg-[#0D0D0D] text-[#D98C21]' : 'text-[#FFFFFF] hover:text-gray-300'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg text-[20px] font-medium transition-colors ${
                  period === 'month' ? 'bg-[#0D0D0D] text-[#D98C21]' : 'text-[#FFFFFF] hover:text-gray-300'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Comparativa */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#c15f3c] focus:ring-[#c15f3c]"
            />
            <span className="text-[20px] font-medium text-gray-700">
              Comparar {getCompareLabel()}
            </span>
          </label>

          {/* Vista */}
          <div className="flex items-center space-x-2">
            <span className="text-[20px] font-medium text-gray-700">Ver:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('quantity')}
                className={`px-4 py-2 rounded-lg text-[20px] font-medium transition-colors ${
                  viewMode === 'quantity' ? 'bg-[#0D0D0D] text-[#D98C21]' : 'text-[#FFFFFF] hover:text-gray-300'
                }`}
              >
                Cantidad
              </button>
              <button
                onClick={() => setViewMode('revenue')}
                className={`px-4 py-2 rounded-lg text-[20px] font-medium transition-colors ${
                  viewMode === 'revenue' ? 'bg-[#0D0D0D] text-[#D98C21]' : 'text-[#FFFFFF] hover:text-gray-300'
                }`}
              >
                Ingresos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-[20px] text-gray-500">Total Productos Vendidos</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalQuantity || 0}</p>
          {compare && data?.comparison && (
            <p className={`text-[20px] mt-1 ${getChangeColor(data.comparison.quantityChange)}`}>
              {formatChange(data.comparison.quantityChange)}
            </p>
          )}
        </div>

        <div className="bg-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-[20px] text-gray-500">Ingresos Totales</p>
          <p className="text-2xl font-bold text-green-600">€{data?.totalRevenue?.toFixed(2) || '0.00'}</p>
          {compare && data?.comparison && (
            <p className={`text-[20px] mt-1 ${getChangeColor(data.comparison.revenueChange)}`}>
              {formatChange(data.comparison.revenueChange)}
            </p>
          )}
        </div>

        <div className="bg-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-[20px] text-gray-500">Número de Ventas</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalSales || 0}</p>
          {compare && data?.comparison && (
            <p className="text-[20px] mt-1 text-gray-500">
              Anterior: {data.comparison.prevTotalSales}
            </p>
          )}
        </div>

        <div className="bg-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-[20px] text-gray-500">Producto Más Vendido</p>
          <p className="text-2xl font-bold text-[#c15f3c]">{data?.topProduct?.name || '-'}</p>
          {data?.topProduct && (
            <p className="text-[20px] mt-1 text-gray-500">
              {data.topProduct.quantity} uds · €{data.topProduct.revenue.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          {viewMode === 'quantity' ? 'Productos por Cantidad Vendida' : 'Productos por Ingresos'} - {getPeriodLabel()}
        </h3>

        {!data || data.products.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">📊</span>
            <p className="text-gray-500">No hay datos para el período seleccionado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.products.map((product, index) => {
              const maxValue = getMaxValue()
              const currentValue = viewMode === 'quantity' ? product.quantity : product.revenue
              const barWidth = maxValue > 0 ? (currentValue / maxValue) * 100 : 0
              const prevValue = viewMode === 'quantity' ? product.prevQuantity : product.prevRevenue
              const prevBarWidth = maxValue > 0 ? (prevValue / maxValue) * 100 : 0
              const change = viewMode === 'quantity' ? product.quantityChange : product.revenueChange

              return (
                <div key={product.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">
                        {viewMode === 'quantity'
                          ? `${product.quantity} uds`
                          : `€${product.revenue.toFixed(2)}`
                        }
                      </span>
                      <span className="text-sm text-gray-400">
                        ({viewMode === 'quantity'
                          ? product.percentage.toFixed(1)
                          : product.revenuePercentage.toFixed(1)
                        }%)
                      </span>
                      {compare && (
                        <span className={`text-sm font-medium ${getChangeColor(change)}`}>
                          {formatChange(change)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra actual */}
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-[#c15f3c] rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                    {/* Barra anterior (comparativa) */}
                    {compare && prevValue > 0 && (
                      <div
                        className="absolute top-0 h-full border-r-2 border-dashed border-gray-400"
                        style={{ left: `${prevBarWidth}%` }}
                        title={`Anterior: ${viewMode === 'quantity' ? prevValue : `€${prevValue.toFixed(2)}`}`}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabla detallada */}
      <div className="bg-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Detalle por Producto</h3>
        </div>

        {!data || data.products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datos disponibles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% Ingresos</th>
                  {compare && (
                    <>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Var. Cantidad</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Var. Ingresos</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.products.map((product, index) => (
                  <tr key={product.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-right text-gray-900">{product.quantity}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">€{product.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{product.percentage.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right text-gray-500">{product.revenuePercentage.toFixed(1)}%</td>
                    {compare && (
                      <>
                        <td className={`px-6 py-4 text-right font-medium ${getChangeColor(product.quantityChange)}`}>
                          {formatChange(product.quantityChange)}
                        </td>
                        <td className={`px-6 py-4 text-right font-medium ${getChangeColor(product.revenueChange)}`}>
                          {formatChange(product.revenueChange)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}