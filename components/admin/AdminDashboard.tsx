'use client'

import TypographyManager from './TypographyManager'
import BetaTestersManager from './BetaTestersManager'
import { useState, useEffect } from 'react'
import {
  Users,
  FileText,
  Receipt,
  TrendingUp,
  Package,
  Settings,
  BarChart3,
  RefreshCw,
  Clock,
  DollarSign,
  Type,
  Sparkles
} from 'lucide-react'
import PlansManager from './PlansManager'
import PackagesManager from './PackagesManager'
import UsersTable from './UsersTable'
import TrialConfigManager from './TrialConfigManager'
import CostAnalyzer from './CostAnalyzer'

interface Stats {
  totalUsers: number
  activeUsers: number
  totalInvoices: number
  totalTickets: number
  usersByPlan: Record<string, number>
  recentActivity: {
    invoices: number
    tickets: number
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'packages' | 'trial' | 'costs' | 'users' | 'typography' | 'beta-testers'>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'plans', label: 'Planes', icon: Package },
    { id: 'packages', label: 'Paquetes Extra', icon: Settings },
    { id: 'trial', label: 'Config Trial', icon: Clock },
    { id: 'costs', label: 'Análisis Costos', icon: DollarSign },
    { id: 'beta-testers', label: 'Beta Testers', icon: Sparkles },
    { id: 'typography', label: 'Tipografía', icon: Type },
    { id: 'users', label: 'Usuarios', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="bg-[#262626] border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
              <p className="text-gray-400 mt-1">Gestiona planes, paquetes y usuarios</p>
            </div>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 bg-[#D98C21] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c47d1d] transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-[#D98C21] text-black'
                    : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Usuarios"
                value={stats?.totalUsers || 0}
                icon={Users}
                color="blue"
                loading={loading}
              />
              <StatsCard
                title="Usuarios Activos"
                value={stats?.activeUsers || 0}
                icon={TrendingUp}
                color="green"
                loading={loading}
              />
              <StatsCard
                title="Facturas Procesadas"
                value={stats?.totalInvoices || 0}
                icon={FileText}
                color="purple"
                loading={loading}
              />
              <StatsCard
                title="Tickets Procesados"
                value={stats?.totalTickets || 0}
                icon={Receipt}
                color="orange"
                loading={loading}
              />
            </div>

            {/* Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Actividad Últimos 7 días</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#333] rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Facturas procesadas</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {stats?.recentActivity.invoices || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#333] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-orange-400" />
                      <span className="text-gray-300">Tickets procesados</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {stats?.recentActivity.tickets || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Users by Plan */}
              <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Usuarios por Plan</h3>
                <div className="space-y-3">
                  {stats?.usersByPlan && Object.entries(stats.usersByPlan).length > 0 ? (
                    Object.entries(stats.usersByPlan).map(([plan, count]) => (
                      <div key={plan} className="flex items-center justify-between p-3 bg-[#333] rounded-lg">
                        <span className="text-gray-300 capitalize">{plan}</span>
                        <span className="text-lg font-semibold text-white">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No hay datos de planes</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plans' && <PlansManager />}
        {activeTab === 'packages' && <PackagesManager />}
        {activeTab === 'trial' && <TrialConfigManager />}
        {activeTab === 'costs' && <CostAnalyzer />}
        {activeTab === 'beta-testers' && <BetaTestersManager />}
        {activeTab === 'typography' && <TypographyManager />}
        {activeTab === 'users' && <UsersTable />}
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  loading
}: {
  title: string
  value: number
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
  loading: boolean
}) {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
  }

  return (
    <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{title}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 bg-gray-700 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      )}
    </div>
  )
}