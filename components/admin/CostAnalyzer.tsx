'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Receipt,
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Package,
  Percent,
  Euro,
  Save
} from 'lucide-react'

// Costos por defecto (en euros)
const DEFAULT_COSTS = {
  invoice: 0.017,
  ticket: 0.011,
  analysis: 0.006,
}

interface Plan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  invoices_limit: number
  tickets_limit: number
  analyses_limit: number
  is_active: boolean
}

interface CreditPackage {
  id: string
  name: string
  credit_type: 'invoices' | 'tickets' | 'analyses'
  credits_amount: number
  price: number
  is_active: boolean
}

interface CostAnalysis {
  aiCost: number
  price: number
  profit: number
  margin: number
  isProfitable: boolean
}

interface CostsConfig {
  invoice_cost: number
  ticket_cost: number
  analysis_cost: number
  description: string
  updated_at?: string
}

export default function CostAnalyzer() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [packages, setPackages] = useState<CreditPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [savingCosts, setSavingCosts] = useState(false)
  const [activeView, setActiveView] = useState<'plans' | 'packages'>('plans')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Custom costs (editable and persistent)
  const [customCosts, setCustomCosts] = useState({
    invoice: DEFAULT_COSTS.invoice,
    ticket: DEFAULT_COSTS.ticket,
    analysis: DEFAULT_COSTS.analysis
  })
  const [costsDescription, setCostsDescription] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch costs config
      const costsRes = await fetch('/api/admin/costs-config')
      const costsData = await costsRes.json()
      if (costsData.success && costsData.config) {
        setCustomCosts({
          invoice: costsData.config.invoice_cost,
          ticket: costsData.config.ticket_cost,
          analysis: costsData.config.analysis_cost
        })
        setCostsDescription(costsData.config.description || '')
        setLastUpdated(costsData.config.updated_at || null)
      }

      // Fetch plans
      const plansRes = await fetch('/api/admin/plans')
      const plansData = await plansRes.json()
      if (plansData.success) {
        setPlans(plansData.plans || [])
      }

      // Fetch packages
      const packagesRes = await fetch('/api/admin/packages')
      const packagesData = await packagesRes.json()
      if (packagesData.success) {
        setPackages(packagesData.packages || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCostsConfig = async () => {
    setSavingCosts(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/costs-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_cost: customCosts.invoice,
          ticket_cost: customCosts.ticket,
          analysis_cost: customCosts.analysis,
          description: costsDescription
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setLastUpdated(data.config.updated_at)
        setMessage({ type: 'success', text: 'Configuración de costos guardada' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' })
      }
    } catch (error) {
      console.error('Error saving costs config:', error)
      setMessage({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setSavingCosts(false)
    }
  }

  // Calculate plan cost analysis
  const analyzePlan = (plan: Plan): CostAnalysis => {
    const aiCost = 
      (plan.invoices_limit * customCosts.invoice) +
      (plan.tickets_limit * customCosts.ticket) +
      (plan.analyses_limit * customCosts.analysis)
    
    const price = plan.price_monthly
    const profit = price - aiCost
    const margin = price > 0 ? (profit / price) * 100 : 0

    return {
      aiCost,
      price,
      profit,
      margin,
      isProfitable: profit > 0
    }
  }

  // Calculate package cost analysis
  const analyzePackage = (pkg: CreditPackage): CostAnalysis => {
    const costPerCredit = customCosts[pkg.credit_type === 'invoices' ? 'invoice' : 
                                       pkg.credit_type === 'tickets' ? 'ticket' : 'analysis']
    const aiCost = pkg.credits_amount * costPerCredit
    const price = pkg.price
    const profit = price - aiCost
    const margin = price > 0 ? (profit / price) * 100 : 0

    return {
      aiCost,
      price,
      profit,
      margin,
      isProfitable: profit > 0
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const activePlans = plans.filter(p => p.is_active)
    const activePackages = packages.filter(p => p.is_active)

    const planStats = activePlans.map(p => analyzePlan(p))
    const packageStats = activePackages.map(p => analyzePackage(p))

    const avgPlanMargin = planStats.length > 0 
      ? planStats.reduce((acc, s) => acc + s.margin, 0) / planStats.length 
      : 0

    const avgPackageMargin = packageStats.length > 0
      ? packageStats.reduce((acc, s) => acc + s.margin, 0) / packageStats.length
      : 0

    const unprofitablePlans = planStats.filter(s => !s.isProfitable).length
    const unprofitablePackages = packageStats.filter(s => !s.isProfitable).length

    return {
      avgPlanMargin,
      avgPackageMargin,
      unprofitablePlans,
      unprofitablePackages,
      totalPlans: activePlans.length,
      totalPackages: activePackages.length
    }
  }

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-6 h-6 text-[#D98C21]" />
          <h2 className="text-xl font-bold text-white">Análisis de Costos y Rentabilidad</h2>
        </div>
        <p className="text-gray-400">
          Calcula el costo real de IA y la rentabilidad de cada plan y paquete.
          Los costos se guardan en la base de datos para referencia futura.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-700' 
            : 'bg-red-900/20 border border-red-700'
        }`}>
          {message.type === 'success' 
            ? <CheckCircle className="w-5 h-5 text-green-500" />
            : <AlertTriangle className="w-5 h-5 text-red-500" />
          }
          <span className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Margen Promedio Planes"
          value={`${totals.avgPlanMargin.toFixed(1)}%`}
          icon={TrendingUp}
          color={totals.avgPlanMargin > 50 ? 'green' : totals.avgPlanMargin > 20 ? 'yellow' : 'red'}
        />
        <SummaryCard
          title="Margen Promedio Paquetes"
          value={`${totals.avgPackageMargin.toFixed(1)}%`}
          icon={Package}
          color={totals.avgPackageMargin > 50 ? 'green' : totals.avgPackageMargin > 20 ? 'yellow' : 'red'}
        />
        <SummaryCard
          title="Planes No Rentables"
          value={`${totals.unprofitablePlans}/${totals.totalPlans}`}
          icon={AlertTriangle}
          color={totals.unprofitablePlans > 0 ? 'red' : 'green'}
        />
        <SummaryCard
          title="Paquetes No Rentables"
          value={`${totals.unprofitablePackages}/${totals.totalPackages}`}
          icon={AlertTriangle}
          color={totals.unprofitablePackages > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Cost Configuration */}
      <div className="bg-[#262626] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Euro className="w-5 h-5 text-[#D98C21]" />
            Costos de IA por Operación
          </h3>
          <button
            onClick={saveCostsConfig}
            disabled={savingCosts}
            className="flex items-center gap-2 bg-[#D98C21] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#c47d1d] transition disabled:opacity-50"
          >
            {savingCosts ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Costos
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm">
              <FileText className="w-4 h-4 text-purple-400" />
              Costo Factura (€)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={customCosts.invoice}
              onChange={(e) => setCustomCosts(prev => ({ ...prev, invoice: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm">
              <Receipt className="w-4 h-4 text-orange-400" />
              Costo Ticket (€)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={customCosts.ticket}
              onChange={(e) => setCustomCosts(prev => ({ ...prev, ticket: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-300 mb-2 text-sm">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Costo Análisis (€)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={customCosts.analysis}
              onChange={(e) => setCustomCosts(prev => ({ ...prev, analysis: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-gray-300 mb-2 block text-sm">Notas/Descripción</label>
          <input
            type="text"
            value={costsDescription}
            onChange={(e) => setCostsDescription(e.target.value)}
            placeholder="Ej: Claude 3.5 Haiku - Enero 2025"
            className="w-full bg-[#333] border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500"
          />
        </div>

        {lastUpdated && (
          <p className="text-gray-500 text-xs mt-3">
            Última actualización: {new Date(lastUpdated).toLocaleString('es-ES')}
          </p>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('plans')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeView === 'plans'
              ? 'bg-[#D98C21] text-black'
              : 'bg-[#333] text-gray-300 hover:bg-[#444]'
          }`}
        >
          Planes ({plans.length})
        </button>
        <button
          onClick={() => setActiveView('packages')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeView === 'packages'
              ? 'bg-[#D98C21] text-black'
              : 'bg-[#333] text-gray-300 hover:bg-[#444]'
          }`}
        >
          Paquetes Extra ({packages.length})
        </button>
      </div>

      {/* Plans Analysis */}
      {activeView === 'plans' && (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="bg-[#262626] rounded-xl p-8 text-center border border-gray-700">
              <p className="text-gray-400">No hay planes configurados</p>
            </div>
          ) : (
            plans.map(plan => {
              const analysis = analyzePlan(plan)
              return (
                <PlanCostCard key={plan.id} plan={plan} analysis={analysis} costs={customCosts} />
              )
            })
          )}
        </div>
      )}

      {/* Packages Analysis */}
      {activeView === 'packages' && (
        <div className="space-y-4">
          {packages.length === 0 ? (
            <div className="bg-[#262626] rounded-xl p-8 text-center border border-gray-700">
              <p className="text-gray-400">No hay paquetes configurados</p>
            </div>
          ) : (
            packages.map(pkg => {
              const analysis = analyzePackage(pkg)
              return (
                <PackageCostCard key={pkg.id} pkg={pkg} analysis={analysis} costs={customCosts} />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// Summary Card Component
function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string
  icon: any
  color: 'green' | 'yellow' | 'red'
}) {
  const colors = {
    green: 'bg-green-500/20 text-green-400 border-green-700',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-700',
    red: 'bg-red-500/20 text-red-400 border-red-700',
  }

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// Plan Cost Card Component
function PlanCostCard({ 
  plan, 
  analysis,
  costs
}: { 
  plan: Plan
  analysis: CostAnalysis
  costs: { invoice: number, ticket: number, analysis: number }
}) {
  return (
    <div className={`bg-[#262626] rounded-xl p-6 border ${
      !plan.is_active ? 'border-gray-700 opacity-60' : 
      analysis.isProfitable ? 'border-green-700' : 'border-red-700'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            {!plan.is_active && (
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Inactivo</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{plan.slug}</p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          analysis.isProfitable 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {analysis.isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {analysis.margin.toFixed(1)}%
        </div>
      </div>

      {/* Credits breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#333] rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-xs">Facturas</span>
          </div>
          <p className="text-white font-semibold">{plan.invoices_limit}</p>
          <p className="text-gray-500 text-xs">€{(plan.invoices_limit * costs.invoice).toFixed(3)}</p>
        </div>
        <div className="bg-[#333] rounded-lg p-3">
          <div className="flex items-center gap-2 text-orange-400 mb-1">
            <Receipt className="w-4 h-4" />
            <span className="text-xs">Tickets</span>
          </div>
          <p className="text-white font-semibold">{plan.tickets_limit}</p>
          <p className="text-gray-500 text-xs">€{(plan.tickets_limit * costs.ticket).toFixed(3)}</p>
        </div>
        <div className="bg-[#333] rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs">Análisis</span>
          </div>
          <p className="text-white font-semibold">{plan.analyses_limit}</p>
          <p className="text-gray-500 text-xs">€{(plan.analyses_limit * costs.analysis).toFixed(3)}</p>
        </div>
      </div>

      {/* Financial summary */}
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-gray-500 text-xs mb-1">Precio/mes</p>
            <p className="text-white font-bold">€{plan.price_monthly}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Costo IA</p>
            <p className="text-red-400 font-bold">€{analysis.aiCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Beneficio</p>
            <p className={`font-bold ${analysis.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              €{analysis.profit.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Margen</p>
            <p className={`font-bold ${analysis.margin >= 50 ? 'text-green-400' : analysis.margin >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
              {analysis.margin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Yearly info */}
      {plan.price_yearly > 0 && (
        <div className="mt-3 text-sm text-gray-400 flex justify-between">
          <span>Precio anual: €{plan.price_yearly}</span>
          <span>Ahorro anual: €{((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

// Package Cost Card Component
function PackageCostCard({ 
  pkg, 
  analysis,
  costs
}: { 
  pkg: CreditPackage
  analysis: CostAnalysis
  costs: { invoice: number, ticket: number, analysis: number }
}) {
  const typeConfig = {
    invoices: { icon: FileText, color: 'purple', label: 'Facturas' },
    tickets: { icon: Receipt, color: 'orange', label: 'Tickets' },
    analyses: { icon: Lightbulb, color: 'yellow', label: 'Análisis' },
  }

  const config = typeConfig[pkg.credit_type]
  const Icon = config.icon
  const costPerCredit = costs[pkg.credit_type === 'invoices' ? 'invoice' : 
                              pkg.credit_type === 'tickets' ? 'ticket' : 'analysis']

  return (
    <div className={`bg-[#262626] rounded-xl p-6 border ${
      !pkg.is_active ? 'border-gray-700 opacity-60' : 
      analysis.isProfitable ? 'border-green-700' : 'border-red-700'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${config.color}-500/20`}>
            <Icon className={`w-5 h-5 text-${config.color}-400`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
              {!pkg.is_active && (
                <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Inactivo</span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{config.label} • {pkg.credits_amount} créditos</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          analysis.isProfitable 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {analysis.isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {analysis.margin.toFixed(1)}%
        </div>
      </div>

      {/* Financial summary */}
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-gray-500 text-xs mb-1">Precio</p>
            <p className="text-white font-bold">€{pkg.price}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Costo IA</p>
            <p className="text-red-400 font-bold">€{analysis.aiCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Beneficio</p>
            <p className={`font-bold ${analysis.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              €{analysis.profit.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">€/crédito</p>
            <p className="text-blue-400 font-bold">€{(pkg.price / pkg.credits_amount).toFixed(3)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Costo/crédito</p>
            <p className="text-gray-400 font-bold">€{costPerCredit.toFixed(3)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}