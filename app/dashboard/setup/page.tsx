import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import BusinessSetupForm from '@/components/BusinessSetupForm'

export default async function SetupPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Verificar si ya tiene configuración
  const { data: config } = await supabase
    .from('business_config')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Obtener tipos de negocio
  const { data: businessTypes } = await supabase
    .from('business_types')
    .select('*')
    .order('name')

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {config ? 'Configuración del Negocio' : '¡Bienvenido a reKalcula!'}
            </h1>
            <p className="mt-2 text-gray-600">
              {config 
                ? 'Actualiza la información de tu negocio'
                : 'Configura tu negocio para empezar a analizar tus finanzas'}
            </p>
          </div>

          <BusinessSetupForm 
            existingConfig={config} 
            businessTypes={businessTypes || []} 
          />
        </div>
      </div>
    </>
  )
}