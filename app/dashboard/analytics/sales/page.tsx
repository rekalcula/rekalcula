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
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#d98c21]">Analisis de Ventas</h1>
              <p className="mt-1 text-xl sm:text-xl text-[#FFFCFF]">Visualiza el rendimiento de tus productos</p>
            </div>
            <Link
              href="/dashboard/sales/upload"
              className="bg-[#0d0d0d] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium hover:bg-[#2d2d2d] text-center text-xl sm:text-base"
            >
              Subir Ticket
            </Link>
          </div>

          <SalesAnalyticsChart />
        </div>
      </div>
    </>
  )
}
