'use client'

import { useState } from 'react'
import FixedCostsManager from '@/components/FixedCostsManager'
import CostsExportButton from './CostsExportButton'

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
  categories: Category[]
  costs: FixedCost[]
  monthlyTotal: number
}

export default function CostsPageClient({ categories, costs, monthlyTotal }: Props) {
  const [addTrigger, setAddTrigger] = useState(0)

  const handleAddClick = () => {
    setAddTrigger(prev => prev + 1)
  }

  return (
    <>
      {/* ========================================
          VERSIÓN MÓVIL (sin cambios)
          Se muestra solo en pantallas < md
          ======================================== */}
      <div className="md:hidden">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#d98c21]">Costes Fijos</h1>
            <p className="mt-2 text-[#FFFCFF] text-[20px]">Gestiona tus gastos fijos mensuales</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-6 text-center">
            <p className="text-xl text-gray-400">Total Mensual</p>
            <p className="text-3xl font-bold text-red-400">
              €{monthlyTotal.toFixed(2)}
            </p>
          </div>
          
          <CostsExportButton 
            costs={costs} 
            categories={categories} 
            monthlyTotal={monthlyTotal} 
          />
        </div>

        {/* FixedCostsManager para móvil - muestra su propio botón */}
        <FixedCostsManager 
          initialCategories={categories} 
          initialCosts={costs}
        />
      </div>

      {/* ========================================
          VERSIÓN DESKTOP (reorganizada)
          Se muestra solo en pantallas >= md
          ======================================== */}
      <div className="hidden md:block">
        {/* Fila 1: Título y subtítulo */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#d98c21]">Costes Fijos</h1>
          <p className="mt-2 text-[#FFFCFF] text-[20px]">Gestiona tus gastos fijos mensuales</p>
        </div>
        
        {/* Fila 2: Botones a la izquierda + Total Mensual a la derecha */}
        <div className="flex justify-between items-center mb-8">
          {/* Botones a la izquierda */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAddClick}
              className="bg-[#0d0d0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d2d2d]"
            >
              + Anadir Costo Fijo
            </button>
            <CostsExportButton 
              costs={costs} 
              categories={categories} 
              monthlyTotal={monthlyTotal} 
            />
          </div>
          
          {/* Total Mensual a la derecha - en una línea */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] px-6 py-3 flex items-center gap-3">
            <span className="text-lg text-gray-400">Total Mensual</span>
            <span className="text-2xl font-bold text-red-400">
              €{monthlyTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* FixedCostsManager para desktop - oculta su botón interno */}
        <FixedCostsManager 
          initialCategories={categories} 
          initialCosts={costs}
          hideAddButton={true}
          externalAddTrigger={addTrigger}
        />
      </div>
    </>
  )
}