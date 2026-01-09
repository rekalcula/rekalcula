'use client'

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

  // Ordenar de mayor a menor
  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({
      name,
      value: Number(value),
      percentage: total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0'
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return null
  }

  // Formatear números para mostrar
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k€`
    }
    return `${value.toFixed(0)}€`
  }

  return (
    <div className="bg-gray-200 rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Distribución de Gastos
      </h3>
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-700 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-gray-900 font-medium">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-gray-500 text-xs w-14 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
            {/* Barra de progreso */}
            <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Total */}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Gastos</span>
          <span className="text-gray-900 font-bold text-lg">
            {total.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  )
}