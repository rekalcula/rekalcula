'use client'

import SalesAnalysisWithHours from '@/components/SalesAnalysisWithHours'

export default function SalesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Análisis de Ventas</h1>
      <SalesAnalysisWithHours />
    </div>
  )
}