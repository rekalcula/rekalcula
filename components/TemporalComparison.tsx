'use client'

import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { IconBarChart, IconTrendingUp, IconTrendingDown, IconAlertTriangle, IconCheckCircle } from './Icons'

interface Invoice {
  invoice_date: string | null
  created_at: string
  total_amount: number | null
  category: string | null
}

interface TemporalComparisonProps {
  invoices: Invoice[]
}

export default function TemporalComparison({ invoices }: TemporalComparisonProps) {
  // Agrupar por mes
  const monthlyData = useMemo(() => {
    const grouped: { [key: string]: { total: number; count: number; categories: { [key: string]: number } } } = {}

    invoices.forEach(invoice => {
      const date = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(invoice.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!grouped[monthKey]) {
        grouped[monthKey] = { total: 0, count: 0, categories: {} }
      }

      grouped[monthKey].total += invoice.total_amount || 0
      grouped[monthKey].count += 1

      const category = invoice.category || 'Sin categoria'
      grouped[monthKey].categories[category] = (grouped[monthKey].categories[category] || 0) + (invoice.total_amount || 0)
    })

    // Convertir a array y ordenar
    return Object.entries(grouped)
      .map(([month, data]) => ({
        month,
        monthName: new Date(month + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }),
        total: Number(data.total.toFixed(2)),
        count: data.count,
        average: Number((data.total / data.count).toFixed(2)),
        categories: data.categories
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [invoices])

  // Calcular comparacion mes actual vs anterior
  const comparison = useMemo(() => {
    if (monthlyData.length < 2) return null

    const current = monthlyData[monthlyData.length - 1]
    const previous = monthlyData[monthlyData.length - 2]

    const totalChange = ((current.total - previous.total) / previous.total) * 100
    const countChange = ((current.count - previous.count) / previous.count) * 100

    return {
      current,
      previous,
      totalChange: Number(totalChange.toFixed(1)),
      countChange: Number(countChange.toFixed(1))
    }
  }, [monthlyData])

  if (monthlyData.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Comparacion Mes Actual vs Anterior */}
      {comparison && (
        <div className="bg-gray-200 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Comparativa Mensual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mes Actual */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Mes Actual ({comparison.current.monthName})</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {comparison.current.total.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {comparison.current.count} facturas
              </div>
            </div>

            {/* Mes Anterior */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Mes Anterior ({comparison.previous.monthName})</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {comparison.previous.total.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {comparison.previous.count} facturas
              </div>
            </div>

            {/* Cambio */}
            <div className={`rounded-lg p-4 ${comparison.totalChange > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="text-sm text-gray-600">Variacion</div>
              <div className={`text-2xl font-bold mt-1 ${comparison.totalChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {comparison.totalChange > 0 ? '+' : ''}{comparison.totalChange}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {comparison.countChange > 0 ? '+' : ''}{comparison.countChange}% facturas
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grafica de Evolucion Temporal */}
      <div className="bg-gray-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Evolucion de Gastos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toFixed(2)}€`} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total" />
            <Line type="monotone" dataKey="average" stroke="#10B981" strokeWidth={2} name="Promedio" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Grafica de Cantidad de Facturas */}
      <div className="bg-gray-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cantidad de Facturas por Mes
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8B5CF6" name="Facturas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tendencias y Predicciones */}
      {monthlyData.length >= 3 && (
        <div className="bg-gray-200 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IconBarChart size={24} color="#3B82F6" />
            Analisis de Tendencias
          </h3>
          <div className="space-y-3">
            {(() => {
              const recent3 = monthlyData.slice(-3)
              const avgRecent = recent3.reduce((sum, m) => sum + m.total, 0) / 3
              const trend = recent3[2].total > recent3[0].total ? 'ascendente' : 'descendente'
              const trendColor = trend === 'ascendente' ? 'text-red-600' : 'text-green-600'

              return (
                <>
                  <div className="flex items-start space-x-3">
                    {trend === 'ascendente' ? (
                      <IconTrendingUp size={24} color="#DC2626" />
                    ) : (
                      <IconTrendingDown size={24} color="#10B981" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Tendencia <span className={trendColor}>{trend}</span> en los ultimos 3 meses
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Promedio: {avgRecent.toFixed(2)}€/mes
                      </p>
                    </div>
                  </div>

                  {trend === 'ascendente' && (
                    <div className="flex items-start space-x-3">
                      <IconAlertTriangle size={24} color="#F59E0B" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Alerta: Gastos en aumento
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Considera revisar tus gastos recurrentes
                        </p>
                      </div>
                    </div>
                  )}

                  {trend === 'descendente' && (
                    <div className="flex items-start space-x-3">
                      <IconCheckCircle size={24} color="#10B981" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Bien hecho! Gastos en reduccion
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Manten el control de tus gastos
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
