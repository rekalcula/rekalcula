'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Check, FileText, Receipt, Brain } from 'lucide-react'

interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  invoices_limit: number
  tickets_limit: number
  analyses_limit: number
  is_featured: boolean
  display_order: number
}

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans')
      const data = await res.json()
      if (data.success) {
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleCheckout = async (planSlug: string) => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setLoading(planSlug)
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle, planSlug })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Error al procesar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
  }

  const getPrice = (plan: Plan) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
  }

  const getPricePerMonth = (plan: Plan) => {
    if (billingCycle === 'monthly') return plan.price_monthly
    return plan.price_yearly / 12
  }

  const getSavings = (plan: Plan) => {
    if (billingCycle === 'monthly') return 0
    const yearlyTotal = plan.price_yearly
    const monthlyTotal = plan.price_monthly * 12
    return Math.round((1 - yearlyTotal / monthlyTotal) * 100)
  }

  return (
    <div className="min-h-screen bg-[#262626]">
      {/* Nav */}
      <nav className="bg-[#1a1a1a] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-white">re</span>
            <span className="text-2xl font-bold text-[#D98C21]">K</span>
            <span className="text-2xl font-bold text-white">alcula</span>
          </Link>
          {isSignedIn ? (
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
          ) : (
            <Link href="/sign-in" className="text-gray-300 hover:text-white">
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-4">
        <h1 className="text-4xl font-extrabold text-white mb-4">
          Planes y Precios
        </h1>
        <p className="text-xl text-gray-300 mb-6">
          Elige el plan que mejor se adapte a tu negocio
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-[#1a1a1a] rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingCycle === 'monthly'
                ? 'bg-[#D98C21] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              billingCycle === 'yearly'
                ? 'bg-[#D98C21] text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anual
            <span className="ml-2 text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">
              -33%
            </span>
          </button>
        </div>

        <div className="mt-4 inline-flex items-center bg-green-900/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
          🎁 7 días de prueba gratis en todos los planes
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D98C21]"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-[#1a1a1a] rounded-2xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.is_featured 
                    ? 'ring-2 ring-[#D98C21] shadow-xl shadow-[#D98C21]/20' 
                    : 'border border-gray-700'
                }`}
              >
                {/* Popular Badge */}
                {plan.is_featured && (
                  <div className="absolute top-0 left-0 right-0 bg-[#D98C21] text-center py-2">
                    <span className="text-sm font-bold text-black">⭐ MÁS POPULAR</span>
                  </div>
                )}

                <div className={`px-6 py-8 ${plan.is_featured ? 'pt-14' : ''}`}>
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-white">
                        €{getPrice(plan).toFixed(2)}
                      </span>
                      <span className="text-gray-400 ml-2">
                        /{billingCycle === 'monthly' ? 'mes' : 'año'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-gray-400 mt-1">
                        €{getPricePerMonth(plan).toFixed(2)}/mes
                      </p>
                    )}
                  </div>

                  {/* Savings Badge */}
                  {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                    <div className="mb-6">
                      <span className="inline-block bg-green-900/30 text-green-400 text-sm font-semibold px-3 py-1 rounded-full">
                        Ahorras {getSavings(plan)}%
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button
                    onClick={() => handleCheckout(plan.slug)}
                    disabled={loading === plan.slug}
                    className={`w-full py-3 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 ${
                      plan.is_featured
                        ? 'bg-[#D98C21] text-black hover:bg-[#c47d1d]'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {loading === plan.slug ? 'Procesando...' : 'Comenzar ahora'}
                  </button>

                  {/* Limits */}
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      Incluye cada mes:
                    </p>
                    
                    <div className="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300 text-sm">Facturas</span>
                      </div>
                      <span className="text-white font-bold">{plan.invoices_limit}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-300 text-sm">Tickets</span>
                      </div>
                      <span className="text-white font-bold">{plan.tickets_limit.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#262626] rounded-lg">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300 text-sm">Análisis IA</span>
                      </div>
                      <span className="text-white font-bold">{plan.analyses_limit}</span>
                    </div>
                  </div>

                  {/* Additional Features */}
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-[#D98C21] mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-xs">Créditos acumulables (x2)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-[#D98C21] mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-xs">Exportación CSV/Excel/Pdf</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="w-4 h-4 text-[#D98C21] mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-xs">Soporte por email</span>
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            🔒 Pago seguro con Stripe · Cancela cuando quieras · Créditos no usados se acumulan
          </p>
        </div>
      </div>
    </div>
  )
}