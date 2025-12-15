import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import UploadForm from '@/components/UploadForm'
import DashboardNav from '@/components/DashboardNav'

export default async function UploadPage() {
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
            <h1 className="text-3xl font-bold text-gray-900">
              Subir Factura
            </h1>
            <p className="mt-2 text-gray-600">
              Sube una imagen o PDF de tu factura para analizarla con IA
            </p>
          </div>

          <UploadForm userId={userId} />
        </div>
      </div>
    </>
  )
}