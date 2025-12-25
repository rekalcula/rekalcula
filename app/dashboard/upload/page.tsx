import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import UploadInvoiceTicket from '@/components/UploadInvoiceTicket'

export default async function UploadPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#d98c21]">Subir Facturas de Compra</h1>
            <p className="mt-2 text-[#FFFCFF] text-[20px]">
              Sube una carpeta completa o selecciona archivos específicos. La IA extraerá los datos automáticamente.
            </p>
          </div>

          <UploadInvoiceTicket />
        </div>
      </div>
    </>
  )
}