'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, Brain, AlertTriangle, Zap } from 'lucide-react'
import Link from 'next/link'

interface Credits {
  invoices: { available: number; limit: number; used: number }
  tickets: { available: number; limit: number; used: number }
  analyses: { available: number; limit: number; used: number }
  plan: string
  status: string
}

export default function CreditsDisplay({ compact = false }: { compact?: boolean }) {
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits')
      const data = await res.json()
      if (data.success) {
        setCredits(data.credits)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg p-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
      </div>
    )
  }

  if (!credits) {
    return null
  }

  const getPercentage = (available: number, limit: number) => {
    if (limit === 0) return 0
    return Math.round((available / limit) * 100)
  }

  const getBarColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const isLow = (available: number, limit: number) => {
    return limit > 0 && available / limit < 0.2
  }

  // Version compacta para sidebar
  if (compact) {
    return (
      <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Creditos</span>
          <span className="capitalize">{credits.plan}</span>
        </div>
        
        {/* Facturas */}
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-purple-400" />
          <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: '#333' }}>
            <div 
              className={`h-1.5 rounded-full ${getBarColor(getPercentage(credits.invoices.available, credits.invoices.limit))}`}
              style={{ width: `${Math.min(getPercentage(credits.invoices.available, credits.invoices.limit), 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 w-8 text-right">{credits.invoices.available}</span>
        </div>

        {/* Tickets */}
        <div className="flex items-center gap-2">
          <Receipt className="w-3 h-3 text-orange-400" />
          <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: '#333' }}>
            <div 
              className={`h-1.5 rounded-full ${getBarColor(getPercentage(credits.tickets.available, credits.tickets.limit))}`}
              style={{ width: `${Math.min(getPercentage(credits.tickets.available, credits.tickets.limit), 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 w-8 text-right">{credits.tickets.available}</span>
        </div>

        {/* Analisis */}
        <div className="flex items-center gap-2">
          <Brain className="w-3 h-3 text-blue-400" />
          <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: '#333' }}>
            <div 
              className={`h-1.5 rounded-full ${getBarColor(getPercentage(credits.analyses.available, credits.analyses.limit))}`}
              style={{ width: `${Math.min(getPercentage(credits.analyses.available, credits.analyses.limit), 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 w-8 text-right">{credits.analyses.available}</span>
        </div>

        {/* Alerta si esta bajo */}
        {(isLow(credits.invoices.available, credits.invoices.limit) ||
          isLow(credits.tickets.available, credits.tickets.limit)) && (
          <Link 
            href="/pricing"
            className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 mt-2"
          >
            <AlertTriangle className="w-3 h-3" />
            Creditos bajos
          </Link>
        )}
      </div>
    )
  }

  // Version completa para dashboard
  return (
    <div className="rounded-xl border border-gray-700 p-6" style={{ backgroundColor: '#262626' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Tus Creditos</h3>
        <span className="px-3 py-1 bg-[#D98C21]/20 text-[#D98C21] rounded-full text-sm font-medium capitalize">
          {credits.plan}
        </span>
      </div>

      <div className="space-y-6">
        {/* Facturas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300">Facturas</span>
            </div>
            <span className="text-white font-semibold">
              {credits.invoices.available} <span className="text-gray-500 font-normal">/ {credits.invoices.limit}</span>
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#444' }}>
            <div 
              className={`h-2 rounded-full transition-all ${getBarColor(getPercentage(credits.invoices.available, credits.invoices.limit))}`}
              style={{ width: `${Math.min(getPercentage(credits.invoices.available, credits.invoices.limit), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Usadas este mes: {credits.invoices.used}
          </p>
        </div>

        {/* Tickets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-400" />
              <span className="text-gray-300">Tickets de venta</span>
            </div>
            <span className="text-white font-semibold">
              {credits.tickets.available} <span className="text-gray-500 font-normal">/ {credits.tickets.limit}</span>
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#444' }}>
            <div 
              className={`h-2 rounded-full transition-all ${getBarColor(getPercentage(credits.tickets.available, credits.tickets.limit))}`}
              style={{ width: `${Math.min(getPercentage(credits.tickets.available, credits.tickets.limit), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Usados este mes: {credits.tickets.used}
          </p>
        </div>

        {/* Analisis */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">Analisis IA</span>
            </div>
            <span className="text-white font-semibold">
              {credits.analyses.available} <span className="text-gray-500 font-normal">/ {credits.analyses.limit}</span>
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#444' }}>
            <div 
              className={`h-2 rounded-full transition-all ${getBarColor(getPercentage(credits.analyses.available, credits.analyses.limit))}`}
              style={{ width: `${Math.min(getPercentage(credits.analyses.available, credits.analyses.limit), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Usados este mes: {credits.analyses.used}
          </p>
        </div>
      </div>

      {/* Boton de comprar mas */}
      {(isLow(credits.invoices.available, credits.invoices.limit) ||
        isLow(credits.tickets.available, credits.tickets.limit) ||
        isLow(credits.analyses.available, credits.analyses.limit)) && (
        <Link
          href="/pricing"
          className="mt-6 w-full flex items-center justify-center gap-2 bg-[#D98C21] text-black py-3 rounded-lg font-semibold hover:bg-[#c47d1d] transition"
        >
          <Zap className="w-4 h-4" />
          Obtener mas creditos
        </Link>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        Los creditos no usados se acumulan hasta x2 del limite mensual
      </p>
    </div>
  )
}