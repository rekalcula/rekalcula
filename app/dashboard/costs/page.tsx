import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import FixedCostsManager from '@/components/FixedCostsManager'

export default async function CostsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener categorías de costos fijos
  const { data: categoriesRaw } = await supabase
    .from('fixed_cost_categories')
    .select('*')
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order('name')

  // Filtrar categorías únicas por ID y agregar "Otros"
  const uniqueCategories = (categoriesRaw || []).filter((cat, index, self) => 
    index === self.findIndex((c) => c.id === cat.id)
  )

  // Agregar categoría "Otros" al final
  const categories = [
    ...uniqueCategories,
    {
      id: 'otros',
      name: 'Otros',
      icon: '📦',
      is_system: true
    }
  ]

  // Obtener costos fijos del usuario
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">Costos Fijos
              </h1>
              <p className="mt-2 text-[#FFFCFF] text-[20px]">Gestiona tus gastos fijos mensuales
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-[#979797] text-right">
              <p className="text-xl text-gray-500">Total Mensual</p>
              <p className="text-3xl font-bold text-red-600">
                €{monthlyTotal.toFixed(2)}
              </p>
            </div>
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