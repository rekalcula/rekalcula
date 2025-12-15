import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import QuickSaleForm from '@/components/QuickSaleForm'

export default async function NewSalePage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener productos del usuario
  const { data: products } = await supabase
    .from('products')
    .select('*, product_categories(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order, name')

  // Obtener categorías
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order, name')

  if (!products || products.length === 0) {
    redirect('/dashboard/catalog')
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Registrar Ventas
            </h1>
            <p className="mt-2 text-gray-600">
              Añade las ventas del día de forma rápida
            </p>
          </div>

          <QuickSaleForm 
            products={products || []} 
            categories={categories || []} 
          />
        </div>
      </div>
    </>
  )
}