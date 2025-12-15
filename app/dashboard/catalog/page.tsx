import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import ProductsManager from '@/components/ProductsManager'

export default async function CatalogPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Verificar si tiene configuración
  const { data: config } = await supabase
    .from('business_config')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!config) {
    redirect('/dashboard/setup')
  }

  // Obtener categorías y productos
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order, name')

  const { data: products } = await supabase
    .from('products')
    .select('*, product_categories(*)')
    .eq('user_id', userId)
    .order('sort_order, name')

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Catálogo de Productos/Servicios
            </h1>
            <p className="mt-2 text-gray-600">
              Gestiona los productos o servicios que vendes
            </p>
          </div>

          <ProductsManager 
            initialCategories={categories || []} 
            initialProducts={products || []} 
          />
        </div>
      </div>
    </>
  )
}