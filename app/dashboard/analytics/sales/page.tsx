import OpportunityAnalysis from '@/components/OpportunityAnalysis'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'
import SalesAnalyticsChart from '@/components/SalesAnalyticsChart'
import Link from 'next/link'
import { BarChart3, Upload } from 'lucide-react'

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
          
          {/* Header estilo estándar */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#D98C21] flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              Análisis de Ventas
            </h1>
            <p className="text-white mt-1">Visualiza el rendimiento de tus productos</p>
          </div>

          {/* Barra de acciones estilo estándar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/sales/upload"
                className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] text-white rounded-lg hover:bg-[#2d2d2d] transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                Subir Ticket
              </Link>
            </div>
          </div>

          {/* Contenido principal */}
          <SalesAnalyticsChart />
          
        </div>
      </div>
    </>
  )
}