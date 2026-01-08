'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Invoice {
  category: string | null
  total_amount: number | null
}

interface ExpenseChartProps {
  invoices: Invoice[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function ExpenseChart({ invoices }: ExpenseChartProps) {
  // Agrupar por categoría
  const categoryData = invoices.reduce((acc: any, invoice) => {
    const category = invoice.category || 'Sin categoría'
    const amount = invoice.total_amount || 0
    
    if (acc[category]) {
      acc[category] += amount
    } else {
      acc[category] = amount
    }
    
    return acc
  }, {})

  // Calcular total para porcentajes
  const total = Object.values(categoryData).reduce((sum: number, val: any) => sum + val, 0)

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: Number(value),
    percentage: total > 0 ? ((Number(value) / total) * 100).toFixed(0) : '0'
  }))

  if (chartData.length === 0) {
    return null
  }

  // Leyenda personalizada con porcentajes
  const renderLegend = (props: any) => {
    const { payload } = props
    
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
        {payload.map((entry: any, index: number) => {
          const dataItem = chartData.find(d => d.name === entry.value)
          return (
            <div 
              key={`legend-${index}`} 
              className="flex items-center gap-1.5 text-sm"
            >
              <span 
                className="w-3 h-3 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 truncate max-w-[120px] sm:max-w-[150px]">
                {entry.value}
              </span>
              <span className="text-gray-500 font-medium">
                {dataItem?.percentage}%
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfica de Barras */}
      <div className="bg-gray-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Gastos por Categoría
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `${Number(value).toFixed(2)}€`} />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de Pastel - SIN etiquetas internas */}
      <div className="bg-gray-200 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribución de Gastos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `${Number(value).toFixed(2)}€`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}