'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { IconBarChart, IconLightbulb } from './Icons'

interface FinancialData {
  totalSales: number
  totalVariableCosts: number
  totalFixedCosts: number
  breakEvenPoint: number
  contributionMargin: number
}

interface Props {
  data: FinancialData
}

export default function BreakEvenChart({ data }: Props) {
  // Generar datos para el grafico
  const maxSales = Math.max(data.breakEvenPoint * 1.5, data.totalSales * 1.2, 1000)
  const steps = 10
  const stepSize = maxSales / steps

  const chartData = Array.from({ length: steps + 1 }, (_, i) => {
    const sales = stepSize * i
    const variableCostRatio = data.totalSales > 0
      ? data.totalVariableCosts / data.totalSales
      : 0.3
    const variableCosts = sales * variableCostRatio
    const totalCosts = data.totalFixedCosts + variableCosts
    const profit = sales - totalCosts

    return {
      sales: Math.round(sales),
      ingresos: Math.round(sales),
      costosTotales: Math.round(totalCosts),
      costosFijos: Math.round(data.totalFixedCosts),
      beneficio: Math.round(profit)
    }
  })

  // Formatter inteligente para los ejes
  const formatAxisValue = (value: number) => {
    if (value === 0) return '0'
    if (value >= 1000) {
      const thousands = value / 1000
      return `${thousands.toFixed(thousands % 1 === 0 ? 0 : 1)}k`
    }
    return value.toFixed(0)
  }

  // Calcular ticks personalizados para mejor distribucion
  const maxValue = Math.max(...chartData.map(d => Math.max(d.ingresos, d.costosTotales)))
  const tickCount = 6
  const tickInterval = Math.ceil(maxValue / tickCount / 100) * 100
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval)

  return (
    <div className="bg-gray-200 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <IconBarChart size={24} color="#3B82F6" />
        Grafico de Punto de Equilibrio
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="sales"
            tickFormatter={formatAxisValue}
            tick={{ fontSize: 12 }}
            label={{ value: 'Ventas (€)', position: 'insideBottom', offset: -5, style: { fontSize: 12, fill: '#6b7280' } }}
            tickCount={6}
          />

          <YAxis
            tickFormatter={formatAxisValue}
            tick={{ fontSize: 12 }}
            label={{ value: 'Importe (€)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6b7280' } }}
            ticks={yTicks}
          />

          <Tooltip
            formatter={(value) => typeof value === 'number' ? `€${value.toFixed(0)}` : ''}
            labelFormatter={(label) => `Ventas: €${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />

          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            iconType="line"
          />

          <ReferenceLine
            x={Math.round(data.breakEvenPoint)}
            stroke="#EF4444"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Punto de Equilibrio',
              position: 'top',
              fill: '#EF4444',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          />

          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="#10B981"
            strokeWidth={3}
            name="Ingresos"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="costosTotales"
            stroke="#EF4444"
            strokeWidth={3}
            name="Costos Totales"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="costosFijos"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Costos Fijos"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <IconLightbulb size={20} color="#1E40AF" className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Interpretacion:</strong> El punto donde la linea verde (ingresos) cruza
            la linea roja (costos) es tu punto de equilibrio. Por encima de ese punto,
            estas generando beneficios.
          </span>
        </p>
      </div>
    </div>
  )
}
