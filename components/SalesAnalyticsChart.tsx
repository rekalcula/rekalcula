'use client'

import { useState, useEffect } from 'react'
import { IconBarChart } from './Icons'
import ExportPDFButton from './ExportPDFButton'
import { generateSalesPDF } from '@/lib/pdf-generator'

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
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all')
  const [compare, setCompare] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'quantity' | 'revenue'>('quantity')

  useEffect(() => {
    fetchData()
  }, [period, compare])

  useEffect(() => {
    if (period === 'all' && compare) {
      setCompare(false)
    }
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const compareParam = period === 'all' ? false : compare
      const response = await fetch(`/api/analytics/sales?period=${period}&compare=${compareParam}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!data) return
    generateSalesPDF({
      period: data.period,
      totalQuantity: data.totalQuantity,
      totalRevenue: data.totalRevenue,
      totalSales: data.totalSales,
      topProduct: data.topProduct,
      products: data.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue,
        percentage: p.percentage,
        revenuePercentage: p.revenuePercentage
      }))
    })
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'Hoy'
      case 'week': return 'Esta semana'
      case 'month': return 'Este mes'
      case 'all': return 'Todo el período'
    }
  }

  const getCompareLabel = () => {
    switch (period) {
      case 'day': return 'vs Ayer'
      case 'week': return 'vs Semana anterior'
      case 'month': return 'vs Mes anterior'
      case 'all': return ''
    }
  }

  const formatChange = (change: number) => {
    if (change > 0) return `↑ +${change}%`
    if (change < 0) return `↓ ${change}%`
    return '→ 0%'
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D98C21]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros - LAYOUT VERTICAL APLICADO */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start gap-6">
          
          {/* Período - CAMBIO 1: LAYOUT VERTICAL */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-400">Período:</span>
            <div className="flex bg-[#0d0d0d] rounded-lg p-1 border border-[#3a3a3a]">
              <button
                onClick={() => setPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === 'all' 
                    ? 'bg-[#D98C21] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Todo
              </button>
              <button
                onClick={() => setPeriod('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === 'day' 
                    ? 'bg-[#D98C21] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === 'week' 
                    ? 'bg-[#D98C21] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === 'month' 
                    ? 'bg-[#D98C21] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Comparativa */}
          {period !== 'all' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-[#2a2a2a] text-[#D98C21] focus:ring-[#D98C21]"
              />
              <span className="text-sm font-medium text-gray-300">
                Comparar {getCompareLabel()}
              </span>
            </label>
          )}

          {/* Ver - CAMBIO 1: LAYOUT VERTICAL */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-400">Ver:</span>
            <div className="flex bg-[#0d0d0d] rounded-lg p-1 border border-[#3a3a3a]">
              <button
                onClick={() => setViewMode('quantity')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'quantity' 
                    ? 'bg-[#D98C21] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Cantidad
              </button>
              <button
                onClick={() => setViewMode('revenue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'revenue' 
                    ? 'bg-[#D98C21] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                Ingresos
              </button>
            </div>
          </div>

          {/* Botón Exportar PDF */}
          {data && data.products.length > 0 && (
            <div className="sm:ml-auto">
              <ExportPDFButton onClick={handleExportPDF} label="Exportar PDF" />
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
          <p className="text-sm text-gray-400">Total Productos Vendidos</p>
          <p className="text-2xl font-bold text-white mt-2">{data?.totalQuantity || 0}</p>
          {compare && data?.comparison && (
            <p className={`text-sm mt-2 font-medium ${getChangeColor(data.comparison.quantityChange)}`}>
              {formatChange(data.comparison.quantityChange)}
            </p>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
          <p className="text-sm text-gray-400">Ingresos Totales</p>
          <p className="text-2xl font-bold text-green-400 mt-2">€{data?.totalRevenue?.toFixed(2) || '0.00'}</p>
          {compare && data?.comparison && (
            <p className={`text-sm mt-2 font-medium ${getChangeColor(data.comparison.revenueChange)}`}>
              {formatChange(data.comparison.revenueChange)}
            </p>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
          <p className="text-sm text-gray-400">Número de Ventas</p>
          <p className="text-2xl font-bold text-white mt-2">{data?.totalSales || 0}</p>
          {compare && data?.comparison && (
            <p className="text-sm mt-2 text-gray-400">
              Anterior: {data.comparison.prevTotalSales}
            </p>
          )}
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
          <p className="text-sm text-gray-400">Producto Más Vendido</p>
          <p className="text-2xl font-bold text-[#D98C21] mt-2">{data?.topProduct?.name || '-'}</p>
          {data?.topProduct && (
            <p className="text-sm mt-2 text-green-400">
              {data.topProduct.quantity} uds · €{data.topProduct.revenue.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-6">
        <h3 className="text-lg font-bold text-white mb-6">
          {viewMode === 'quantity' ? 'Productos por Cantidad Vendida' : 'Productos por Ingresos'} - {getPeriodLabel()}
        </h3>

        {!data || data.products.length === 0 ? (
          <div className="text-center py-12">
            <IconBarChart size={48} color="#6B7280" className="mx-auto mb-2" />
            <p className="text-gray-400">No hay datos para el período seleccionado</p>
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
                    <span className="font-medium text-white">{product.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400 font-medium">
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
                  <div className="h-6 bg-[#0d0d0d] rounded-full overflow-hidden relative border border-[#3a3a3a]">
                    <div
                      className="h-full bg-[#D98C21] rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                    {/* Barra anterior (comparativa) */}
                    {compare && prevValue > 0 && (
                      <div
                        className="absolute top-0 h-full border-r-2 border-dashed border-gray-500"
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
      <div className="bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#3a3a3a]">
          <h3 className="text-lg font-bold text-white">Detalle por Producto</h3>
        </div>

        {!data || data.products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No hay datos disponibles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0d0d0d]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Producto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">% Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">% Ingresos</th>
                  {compare && (
                    <>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Var. Cantidad</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Var. Ingresos</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3a3a3a]">
                {data.products.map((product, index) => (
                  <tr key={product.name} className="hover:bg-[#2a2a2a] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                    <td className="px-6 py-4 text-right text-white">{product.quantity}</td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">€{product.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-400">{product.percentage.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right text-gray-400">{product.revenuePercentage.toFixed(1)}%</td>
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