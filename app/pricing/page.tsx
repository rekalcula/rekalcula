'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const plans = [
    {
      id: 'monthly',
      name: 'Mensual',
      price: 9.99,
      period: '/mes',
      pricePerMonth: 9.99,
      savings: null,
      popular: false,
      description: 'Flexibilidad total'
    },
    {
      id: 'semiannual',
      name: 'Semestral',
      price: 49.99,
      period: '/6 meses',
      pricePerMonth: 8.33,
      savings: 17,
      popular: false,
      description: 'Compromiso medio'
    },
    {
      id: 'yearly',
      name: 'Anual',
      price: 79.99,
      period: '/año',
      pricePerMonth: 6.67,
      savings: 33,
      popular: true,
      description: 'Mejor valor'
    }
  ]

  const features = [
    'Facturas ilimitadas',
    'Análisis con IA avanzada',
    'Extracción automática de datos',
    'Gráficas y reportes detallados',
    'Alertas de gastos inteligentes',
    'Exportación a CSV/Excel',
    'Soporte prioritario'
  ]

  const handleCheckout = async (planId: string) => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setLoading(planId)
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle: planId })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
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
        <p className="text-xl text-gray-300">
          Elige el plan que mejor se adapte a tu negocio
        </p>
        <div className="mt-4 inline-flex items-center bg-green-900/30 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
          🎁 7 días de prueba gratis en todos los planes
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-[#1a1a1a] rounded-2xl overflow-hidden transition-transform hover:scale-105 ${
                plan.popular ? 'ring-2 ring-[#D98C21] shadow-xl shadow-[#D98C21]/20' : 'border border-gray-700'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-[#D98C21] text-center py-2">
                  <span className="text-sm font-bold text-black">⭐ MÁS POPULAR</span>
                </div>
              )}

              <div className={`px-6 py-8 ${plan.popular ? 'pt-14' : ''}`}>
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold text-white">€{plan.price}</span>
                    <span className="text-gray-400 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    €{plan.pricePerMonth.toFixed(2)}/mes
                  </p>
                </div>

                {/* Savings Badge */}
                {plan.savings && (
                  <div className="mb-6">
                    <span className="inline-block bg-green-900/30 text-green-400 text-sm font-semibold px-3 py-1 rounded-full">
                      Ahorras {plan.savings}%
                    </span>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-[#D98C21] text-black hover:bg-[#c47d1d]'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {loading === plan.id ? 'Procesando...' : 'Comenzar ahora'}
                </button>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-[#D98C21] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            🔒 Pago seguro con Stripe · Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  )
}