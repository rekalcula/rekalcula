'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IconAlertTriangle, IconXCircle } from './Icons'

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

  // Si ya es usuario activo (pago), no mostrar banner
  if (data.subscription.status === 'active') return null

  // Si esta en trial
  if (data.subscription.status === 'trialing') {
    const days = data.trialDaysRemaining

    // Colores segun urgencia
    let bgColor = 'bg-blue-50 border-blue-200'
    let textColor = 'text-blue-800'
    let iconColor = '#1D4ED8'

    if (days <= 3) {
      bgColor = 'bg-red-50 border-red-200'
      textColor = 'text-red-800'
      iconColor = '#DC2626'
    } else if (days <= 7) {
      bgColor = 'bg-yellow-50 border-yellow-200'
      textColor = 'text-yellow-800'
      iconColor = '#D97706'
    }

    return (
      <div className={`${bgColor} border rounded-lg px-4 py-2 sm:py-4 mb-6 flex items-center justify-between`}>
        <div className="flex items-center">
          <span className="mr-3">
            <IconAlertTriangle size={28} color={iconColor} />
          </span>
          <div>
            <p className={`font-semibold ${textColor}`}>
              {days > 0
                ? `Te quedan ${days} dia${days !== 1 ? 's' : ''} de prueba gratis`
                : 'Tu periodo de prueba ha expirado'
              }
            </p>
            <p className={`text-sm ${textColor} opacity-75`}>
              {days > 0
                ? 'Suscribete para no perder acceso a tus datos'
                : 'Suscribete ahora para continuar usando reKalcula'
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

  // Si expiro o esta cancelado
  if (data.subscription.status === 'expired' || data.subscription.status === 'canceled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 sm:py-4 mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-3">
            <IconXCircle size={28} color="#DC2626" />
          </span>
          <div>
            <p className="font-semibold text-red-800">Tu suscripcion ha expirado</p>
            <p className="text-sm text-red-700">Renueva para continuar usando reKalcula</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="text-white px-4 py-2 rounded-lg font-semibold"
          style={{ backgroundColor: '#D98C21' }}
        >
          Renovar suscripcion
        </Link>
      </div>
    )
  }

  return null
}