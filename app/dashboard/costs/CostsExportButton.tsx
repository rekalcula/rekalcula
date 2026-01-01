'use client'

import ExportPDFButton from '@/components/ExportPDFButton'
import { generateCostsPDF } from '@/lib/pdf-generator'

interface Category {
  id: string
  name: string
  icon: string
  is_system: boolean
}

interface FixedCost {
  id: string
  name: string
  description?: string
  amount: number
  frequency: string
  category_id: string
  is_active: boolean
  fixed_cost_categories?: Category
}

interface Props {
  costs: FixedCost[]
  categories: Category[]
  monthlyTotal: number
}

export default function CostsExportButton({ costs, categories, monthlyTotal }: Props) {
  const handleExport = () => {
    generateCostsPDF(costs, categories, monthlyTotal)
  }

  if (costs.length === 0) return null

  return (
    <ExportPDFButton 
      onClick={handleExport} 
      label="Exportar PDF"
    />
  )
}
