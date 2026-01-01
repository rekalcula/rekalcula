'use client'

import { IconMoney, IconBarChart, IconWallet, IconTrendingUp, IconTrendingDown, IconLineChart, IconCheckCircle } from './Icons'

interface FinancialData {
  totalSales: number
  totalVariableCosts: number
  totalFixedCosts: number
  grossProfit: number
  netProfit: number
  contributionMargin: number
  breakEvenPoint: number
  salesAboveBreakEven: number
}

interface Props {
  data: FinancialData
}

export default function FinancialSummary({ data }: Props) {
  const isProfit = data.netProfit >= 0
  
  const progressToBreakEven = data.breakEvenPoint > 0
    ? Math.min((data.totalSales / data.breakEvenPoint) * 100, 100)
    : 100

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Ventas */}
      <div className="bg-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <IconMoney size={28} color="#D98C21" />
          <span className="text-xs text-gray-500">Este mes</span>
        </div>
        <p className="text-sm text-gray-500">Ventas Totales</p>
        <p className="text-2xl font-bold text-gray-900">
          €{data.totalSales.toFixed(2)}
        </p>
      </div>

      {/* Costos */}
      <div className="bg-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <IconBarChart size={28} color="#3B82F6" />
        </div>
        <p className="text-sm text-gray-500">Costos Totales</p>
        <p className="text-2xl font-bold text-gray-900">
          €{(data.totalVariableCosts + data.totalFixedCosts).toFixed(2)}
        </p>
        <div className="text-xs text-gray-400 mt-1">
          Fijos: €{data.totalFixedCosts.toFixed(0)} | Variables: €{data.totalVariableCosts.toFixed(0)}
        </div>
      </div>

      {/* Beneficio */}
      <div className={`rounded-xl shadow-sm p-6 ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center justify-between mb-2">
          {isProfit ? (
            <IconTrendingUp size={28} color="#10B981" />
          ) : (
            <IconTrendingDown size={28} color="#EF4444" />
          )}
        </div>
        <p className={`text-sm ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          Beneficio Bruto
        </p>
        <p className={`text-2xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
          €{data.netProfit.toFixed(2)}
        </p>
        <div className={`text-xs mt-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
          Margen: {data.contributionMargin.toFixed(1)}%
        </div>
      </div>

      {/* Punto de Equilibrio */}
      <div className="bg-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <IconLineChart size={28} color="#10B981" />
        </div>
        <p className="text-sm text-gray-500">Punto de Equilibrio</p>
        <p className="text-2xl font-bold text-gray-900">
          €{data.breakEvenPoint.toFixed(2)}
        </p>
        <div className="mt-2">
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progressToBreakEven >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressToBreakEven}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            {progressToBreakEven >= 100 ? (
              <>
                <IconCheckCircle size={14} color="#10B981" />
                Superado por €{data.salesAboveBreakEven.toFixed(0)}
              </>
            ) : (
              `${progressToBreakEven.toFixed(0)}% alcanzado`
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
