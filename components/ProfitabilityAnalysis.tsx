'use client'

import { IconTrendingUp, IconAlertTriangle, IconXCircle, IconMoney, IconCheckCircle } from './Icons'

interface FinancialData {
  totalSales: number
  totalVariableCosts: number
  totalFixedCosts: number
  grossProfit: number
  netProfit: number
  contributionMargin: number
  breakEvenPoint: number
}

interface Props {
  data: FinancialData
}

export default function ProfitabilityAnalysis({ data }: Props) {
  const dailyBreakEven = data.breakEvenPoint / 30
  const averageDailySales = data.totalSales / new Date().getDate()
  const daysToBreakEven = averageDailySales > 0
    ? Math.ceil(data.breakEvenPoint / averageDailySales)
    : 30

  const recommendations = []

  if (data.contributionMargin < 30) {
    recommendations.push({
      icon: 'warning',
      title: 'Margen bajo',
      text: 'Tu margen de contribucion es bajo. Considera aumentar precios o reducir costos variables.'
    })
  }

  if (data.netProfit < 0) {
    recommendations.push({
      icon: 'loss',
      title: 'Perdidas',
      text: `Necesitas aumentar ventas en €${Math.abs(data.netProfit).toFixed(0)} o reducir costos para alcanzar el equilibrio.`
    })
  }

  if (data.totalFixedCosts > data.totalSales * 0.5) {
    recommendations.push({
      icon: 'money',
      title: 'Costos fijos altos',
      text: 'Tus costos fijos representan mas del 50% de tus ventas. Revisa si puedes optimizarlos.'
    })
  }

  if (data.netProfit > 0 && data.contributionMargin >= 30) {
    recommendations.push({
      icon: 'success',
      title: 'Buen trabajo!',
      text: 'Tu negocio esta siendo rentable. Manten el control de costos y busca oportunidades de crecimiento.'
    })
  }

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'warning':
        return <IconAlertTriangle size={24} color="#F59E0B" />
      case 'loss':
        return <IconXCircle size={24} color="#EF4444" />
      case 'money':
        return <IconMoney size={24} color="#D98C21" />
      case 'success':
        return <IconCheckCircle size={24} color="#10B981" />
      default:
        return <IconAlertTriangle size={24} color="#6B7280" />
    }
  }

  return (
    <div className="bg-gray-200 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <IconTrendingUp size={24} color="#10B981" />
        Analisis de Rentabilidad
      </h3>

      {/* Metricas clave */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Venta diaria necesaria</span>
          <span className="font-semibold">€{dailyBreakEven.toFixed(2)}/dia</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Venta diaria actual (promedio)</span>
          <span className="font-semibold">€{averageDailySales.toFixed(2)}/dia</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Dias estimados para equilibrio</span>
          <span className={`font-semibold ${daysToBreakEven <= 30 ? 'text-green-600' : 'text-red-600'}`}>
            {daysToBreakEven} dias
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Margen de contribucion</span>
          <span className={`font-semibold ${data.contributionMargin >= 30 ? 'text-green-600' : 'text-yellow-600'}`}>
            {data.contributionMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Recomendaciones</h4>
        {recommendations.map((rec, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              {getIcon(rec.icon)}
              <div>
                <p className="font-medium text-gray-900">{rec.title}</p>
                <p className="text-sm text-gray-600">{rec.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
