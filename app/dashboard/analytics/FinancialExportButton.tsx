'use client'

import ExportPDFButton from '@/components/ExportPDFButton'
import { generateFinancialPDF } from '@/lib/pdf-generator'

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
  periodo: string
}

export default function FinancialExportButton({ data, periodo }: Props) {
  const handleExport = () => {
    generateFinancialPDF(data, periodo)
  }

  return (
    <ExportPDFButton 
      onClick={handleExport} 
      label="Exportar PDF"
    />
  )
}
