'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SubscriptionData {
  subscription: {
    status: string
    trial_end: string | null
  } | null
  trialDaysRemaining: number
  isActive: boolean
}

export default function TrialBanner() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null

  if (!data?.subscription) return null

  // Si ya es usuario activo (pagó), no mostrar banner
  if (data.subscription.status === 'active') return null

  // Si está en trial
  if (data.subscription.status === 'trialing') {
    const days = data.trialDaysRemaining

    // Colores según urgencia
    let bgColor = 'bg-transparent border-blue-200'
    let textColor = 'text-blue-800'
    let icon = 'ℹ️'

    if (days <= 3) {
      bgColor = 'bg-red-50 border-red-200'
      textColor = 'text-red-800'
      icon = '⚠️'
    } else if (days <= 7) {
      bgColor = 'bg-yellow-50 border-yellow-200'
      textColor = 'text-yellow-800'
      icon = '⏰'
    }

    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-6 flex items-center justify-between`}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">{icon}</span>
          <div>
            <p className={`font-semibold ${textColor}`}>
              {days > 0 
                ? `Te quedan ${days} día${days !== 1 ? 's' : ''} de prueba gratis`
                : 'Tu período de prueba ha expirado'
              }
            </p>
            <p className={`text-sm ${textColor} opacity-75`}>
              {days > 0 
                ? 'Suscríbete para no perder acceso a tus datos'
                : 'Suscríbete ahora para continuar usando reKalcula'
              }
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{ backgroundColor: '#D98C21' }}
        >
          {days > 0 ? 'Ver planes' : 'Suscribirse ahora'}
        </Link>
      </div>
    )
  }

  // Si expiró o está cancelado
  if (data.subscription.status === 'expired' || data.subscription.status === 'canceled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-3">🚫</span>
          <div>
            <p className="font-semibold text-red-800">Tu suscripción ha expirado</p>
            <p className="text-sm text-red-700">Renueva para continuar usando reKalcula</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="text-white px-4 py-2 rounded-lg font-semibold"
          style={{ backgroundColor: '#D98C21' }}
        >
          Renovar suscripción
        </Link>
      </div>
    )
  }

  return null
}