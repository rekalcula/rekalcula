'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { IconBarChart, IconLightbulb } from './Icons'

interface WaterfallDataItem {
  name: string
  value: number
  type: 'income' | 'expense' | 'subtotal' | 'total'
  cumulative: number
}

interface Props {
  data: WaterfallDataItem[]
  loading?: boolean
}

export default function WaterfallChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Preparar datos para el gráfico waterfall
  // En un waterfall, cada barra muestra el cambio respecto al anterior
  const chartData = data.map((item, index) => {
    const prevCumulative = index > 0 ? data[index - 1].cumulative : 0
    
    // Para subtotales y totales, mostramos desde 0
    if (item.type === 'subtotal' || item.type === 'total') {
      return {
        name: item.name,
        value: item.cumulative,
        start: 0,
        end: item.cumulative,
        type: item.type,
        displayValue: item.cumulative
      }
    }
    
    // Para ingresos y gastos, mostramos el cambio
    const start = item.type === 'income' ? 0 : prevCumulative
    const end = item.cumulative
    
    return {
      name: item.name,
      value: Math.abs(item.value),
      start: Math.min(start, end),
      end: Math.max(start, end),
      type: item.type,
      displayValue: item.value
    }
  })

  // Colores por tipo
  const getColor = (type: string) => {
    switch (type) {
      case 'income': return '#10B981' // Verde
      case 'expense': return '#EF4444' // Rojo
      case 'subtotal': return '#3B82F6' // Azul
      case 'total': return '#d98c21' // Naranja (color de la marca)
      default: return '#6B7280'
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `€${(value / 1000).toFixed(1)}k`
    }
    return `€${value.toFixed(0)}`
  }

  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calcular el rango del eje Y
  const allValues = chartData.flatMap(d => [d.start, d.end])
  const minValue = Math.min(0, ...allValues)
  const maxValue = Math.max(...allValues)
  const padding = (maxValue - minValue) * 0.1

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const isPositive = item.displayValue >= 0
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-1">{item.name}</p>
          <p className={`text-lg font-bold ${
            item.type === 'expense' ? 'text-red-600' : 
            item.type === 'income' ? 'text-green-600' :
            item.displayValue >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {item.type === 'expense' ? '-' : item.type === 'income' ? '+' : ''}
            {formatTooltipValue(Math.abs(item.displayValue))}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <IconBarChart size={24} color="#d98c21" />
        Grafico de Cascada - De Ingresos a Beneficio Neto
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={[minValue - padding, maxValue + padding]}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />

          {/* Barra invisible para el inicio (espacio) */}
          <Bar 
            dataKey="start" 
            stackId="stack" 
            fill="transparent"
          />
          
          {/* Barra visible con el valor */}
          <Bar 
            dataKey={(d) => d.end - d.start} 
            stackId="stack"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(entry.type)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded"></span>
          <span className="text-gray-600">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-500 rounded"></span>
          <span className="text-gray-600">Gastos/Impuestos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-500 rounded"></span>
          <span className="text-gray-600">Subtotales</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-[#d98c21] rounded"></span>
          <span className="text-gray-600">Resultado Final</span>
        </div>
      </div>

      {/* Interpretación */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <IconLightbulb size={20} color="#1E40AF" className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Interpretacion:</strong> Este grafico muestra como se transforma cada euro 
            de ingreso en beneficio neto. Las barras verdes suman, las rojas restan. 
            La barra naranja final es lo que realmente te queda despues de todos los gastos e impuestos.
          </span>
        </p>
      </div>
    </div>
  )
}