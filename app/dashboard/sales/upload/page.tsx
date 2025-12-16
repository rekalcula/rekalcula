import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import UploadSalesForm from '@/components/UploadSalesForm'

export default async function UploadSalesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Subir Ticket de Venta</h1>
            <p className="mt-2 text-gray-600">
              Sube una foto o PDF de tu ticket y la IA extraerá los datos automáticamente
            </p>
          </div>

          <UploadSalesForm />
        </div>
      </div>
    </>
  )
}