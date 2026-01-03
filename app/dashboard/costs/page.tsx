import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import FixedCostsManager from '@/components/FixedCostsManager'
import CostsExportButton from './CostsExportButton'

export default async function CostsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener categorías de costes fijos
  const { data: categoriesRaw } = await supabase
    .from('fixed_cost_categories')
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order('name')

  // Filtrar categorías únicas por ID
  const uniqueCategories = (categoriesRaw || []).filter((cat, index, self) => 
    index === self.findIndex((c) => c.id === cat.id)
  )

  // Separar "Otros Gastos Fijos" del resto (case-insensitive)
  const otrosGastosFijos = uniqueCategories.find(cat => 
    cat.name.toLowerCase() === 'otros gastos fijos'
  )
  const otherCategories = uniqueCategories.filter(cat => 
    cat.name.toLowerCase() !== 'otros gastos fijos'
  )

  // Ordenar alfabéticamente y poner "Otros gastos fijos" al final
  const categories = [
    ...otherCategories.sort((a, b) => a.name.localeCompare(b.name)),
    ...(otrosGastosFijos ? [otrosGastosFijos] : [])
  ]

  // Obtener costes fijos del usuario
  const { data: costs } = await supabase
    .from('fixed_costs')
    .select('*, fixed_cost_categories(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Calcular total mensual
  const monthlyTotal = (costs || []).reduce((sum, cost) => {
    if (!cost.is_active) return sum
    let monthly = cost.amount
    if (cost.frequency === 'quarterly') monthly = cost.amount / 3
    if (cost.frequency === 'yearly') monthly = cost.amount / 12
    return sum + monthly
  }, 0)

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">Costes Fijos</h1>
              <p className="mt-2 text-[#FFFCFF] text-[20px]">Gestiona tus gastos fijos mensuales</p>
            </div>
            
            <div className="bg-gray-200 rounded-xl shadow-sm p-6 border-2 border-[#979797] text-center md:text-right">
              <p className="text-xl text-gray-500">Total Mensual</p>
              <p className="text-3xl font-bold text-red-600">
                €{monthlyTotal.toFixed(2)}
              </p>
            </div>
            
            <CostsExportButton 
              costs={costs || []} 
              categories={categories} 
              monthlyTotal={monthlyTotal} 
            />
          </div>

          <FixedCostsManager 
            initialCategories={categories || []} 
            initialCosts={costs || []} 
          />
        </div>
      </div>
    </>
  )
}