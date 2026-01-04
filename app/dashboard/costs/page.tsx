import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import CostsPageClient from './CostsPageClient'

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
          <CostsPageClient 
            categories={categories}
            costs={costs || []}
            monthlyTotal={monthlyTotal}
          />
        </div>
      </div>
    </>
  )
}