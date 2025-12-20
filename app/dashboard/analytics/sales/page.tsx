import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import SalesAnalyticsChart from '@/components/SalesAnalyticsChart'
import Link from 'next/link'

export default async function SalesAnalyticsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Análisis de Ventas</h1>
              <p className="mt-2 text-gray-600">
                Visualiza el rendimiento de tus productos por día, semana o mes
              </p>
            </div>
            <Link
              href="/dashboard/sales/upload"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
            >
              📤 Subir Ticket
            </Link>
          </div>

          {/* Componente de análisis */}
          <SalesAnalyticsChart />
        </div>
      </div>
    </>
  )
}