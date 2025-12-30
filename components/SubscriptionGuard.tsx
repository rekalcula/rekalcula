'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
}

export default function SubscriptionGuard({ children }: Props) {
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => {
        setIsActive(data.isActive)
        setLoading(false)
      })
      .catch(() => {
        setIsActive(false)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#b1ada1' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#b1ada1' }}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏰</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tu período de prueba ha terminado
          </h1>
          
          <p className="text-gray-600 mb-6">
            Suscríbete a reKalcula Pro para continuar analizando tus facturas y acceder a todas las funcionalidades.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="font-medium text-gray-900 mb-2">Con reKalcula Pro tienes:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Facturas ilimitadas</li>
              <li>✓ Análisis con IA avanzada</li>
              <li>✓ Reportes y gráficas</li>
              <li>✓ Exportación a CSV/Excel</li>
            </ul>
          </div>

          <Link
            href="/pricing"
            className="block w-full text-white py-3 rounded-lg font-semibold transition-colors mb-3"
            style={{ backgroundColor: '#D98C21' }}
          >
            Ver planes y precios
          </Link>
          
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}