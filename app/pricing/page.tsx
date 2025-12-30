'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  const prices = { monthly: 9.99, yearly: 79.99 }
  const savings = 33

  const handleCheckout = async () => {
    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Facturas ilimitadas',
    'Análisis con IA avanzada',
    'Extracción automática de datos',
    'Gráficas y reportes detallados',
    'Alertas de gastos inteligentes',
    'Exportación a CSV/Excel',
    'Soporte prioritario'
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#b1ada1' }}>
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-800">re</span>
            <span className="text-2xl font-bold" style={{ color: '#D98C21' }}>K</span>
            <span className="text-2xl font-bold text-gray-800">alcula</span>
          </Link>
          {isSignedIn ? (
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          ) : (
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900">
              Iniciar sesión
            </Link>
          )}
        </div>
      </nav>

      <div className="text-center pt-16 pb-8 px-4">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Planes y Precios
        </h1>
        <p className="text-xl text-gray-600">
          Un solo plan con todo incluido. Empieza con 28 días gratis.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-full p-1 shadow-sm inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={billingCycle === 'monthly' ? { backgroundColor: '#D98C21' } : {}}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={billingCycle === 'yearly' ? { backgroundColor: '#D98C21' } : {}}
          >
            Anual
            <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              -{savings}%
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div 
            className="px-8 py-6"
            style={{ backgroundColor: '#D98C21' }}
          >
            <h2 className="text-2xl font-bold" style={{ color: '#262626' }}>reKalcula Pro</h2>
            <p className="mt-1" style={{ color: '#262626' }}>Todo lo que necesitas para tu negocio</p>
          </div>

          <div className="px-8 py-8">
            <div className="flex items-baseline">
              <span className="text-5xl font-extrabold text-gray-900">
                €{billingCycle === 'yearly' ? prices.yearly : prices.monthly}
              </span>
              <span className="text-gray-500 ml-2">/{billingCycle === 'yearly' ? 'año' : 'mes'}</span>
            </div>
            
            {billingCycle === 'yearly' && (
              <p className="text-green-600 font-medium mt-2">
                Ahorras €{(prices.monthly * 12 - prices.yearly).toFixed(2)} al año
              </p>
            )}

            <div className="mt-4 inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              ✓ 28 días de prueba gratis
            </div>

            <ul className="mt-8 space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-3" style={{ color: '#D98C21' }}>✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-8 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#D98C21' }}
            >
              {loading ? 'Procesando...' : '💳 Comenzar ahora'}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              🔒 Pago seguro con Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}