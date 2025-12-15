'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

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
  // Generar datos para el gráfico
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Gráfico de Punto de Equilibrio
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="sales" 
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            formatter={(value: number) => `€${value.toFixed(0)}`}
            labelFormatter={(label) => `Ventas: €${label}`}
          />
          <Legend />
          <ReferenceLine 
            x={Math.round(data.breakEvenPoint)} 
            stroke="#EF4444" 
            strokeDasharray="5 5"
            label={{ value: 'Punto de Equilibrio', position: 'top' }}
          />
          <Line 
            type="monotone" 
            dataKey="ingresos" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Ingresos"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="costosTotales" 
            stroke="#EF4444" 
            strokeWidth={2}
            name="Costos Totales"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="costosFijos" 
            stroke="#F59E0B" 
            strokeWidth={1}
            strokeDasharray="5 5"
            name="Costos Fijos"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Interpretación:</strong> El punto donde la línea verde (ingresos) cruza 
          la línea roja (costos) es tu punto de equilibrio. Por encima de ese punto, 
          estás generando beneficios.
        </p>
      </div>
    </div>
  )
}