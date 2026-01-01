'use client'

import { useState, useEffect } from 'react'
import { IconBell, IconMoney, IconBarChart, IconAlertTriangle, IconTrendingUp, IconSearch, IconX } from './Icons'

interface Invoice {
  id: number
  total_amount: number | null
  category: string | null
  supplier: string | null
  invoice_date: string | null
  created_at: string
}

interface Alert {
  id: string
  type: 'monthly_limit' | 'category_spike' | 'duplicate' | 'trend'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  iconType: 'money' | 'chart' | 'search' | 'trending'
}

interface AlertsPanelProps {
  invoices: Invoice[]
}

export default function AlertsPanel({ invoices }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(true)

  useEffect(() => {
    generateAlerts()
  }, [invoices])

  const generateAlerts = () => {
    const newAlerts: Alert[] = []

    // 1. Alerta de limite mensual
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyTotal = invoices
      .filter(inv => {
        const date = inv.invoice_date ? new Date(inv.invoice_date) : new Date(inv.created_at)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    const monthlyLimit = 5000
    if (monthlyTotal > monthlyLimit * 0.9) {
      newAlerts.push({
        id: 'monthly-limit',
        type: 'monthly_limit',
        severity: monthlyTotal > monthlyLimit ? 'critical' : 'warning',
        title: monthlyTotal > monthlyLimit ? 'Limite Mensual Superado' : 'Cerca del Limite Mensual',
        message: `Has gastado ${monthlyTotal.toFixed(2)}€ este mes. ${monthlyTotal > monthlyLimit ? `Superaste el limite de ${monthlyLimit}€` : `Te quedan ${(monthlyLimit - monthlyTotal).toFixed(2)}€`}`,
        iconType: 'money'
      })
    }

    // 2. Alerta de pico en categoria
    const categoryTotals = invoices.reduce((acc, inv) => {
      const category = inv.category || 'Sin categoria'
      acc[category] = (acc[category] || 0) + (inv.total_amount || 0)
      return acc
    }, {} as { [key: string]: number })

    Object.entries(categoryTotals).forEach(([category, total]) => {
      if (total > 2000) {
        newAlerts.push({
          id: `category-${category}`,
          type: 'category_spike',
          severity: 'warning',
          title: `Alto Gasto en ${category}`,
          message: `Has gastado ${total.toFixed(2)}€ en ${category}. Considera revisar esta categoria.`,
          iconType: 'chart'
        })
      }
    })

    // 3. Deteccion de posibles duplicados
    const recentInvoices = invoices.slice(0, 20)
    const possibleDuplicates = new Set<string>()

    recentInvoices.forEach((inv1, i) => {
      recentInvoices.slice(i + 1).forEach(inv2 => {
        if (
          inv1.supplier === inv2.supplier &&
          Math.abs((inv1.total_amount || 0) - (inv2.total_amount || 0)) < 1 &&
          !possibleDuplicates.has(`${inv1.id}-${inv2.id}`)
        ) {
          possibleDuplicates.add(`${inv1.id}-${inv2.id}`)
          newAlerts.push({
            id: `duplicate-${inv1.id}-${inv2.id}`,
            type: 'duplicate',
            severity: 'info',
            title: 'Posible Factura Duplicada',
            message: `Detectamos dos facturas similares de ${inv1.supplier} por ${inv1.total_amount?.toFixed(2)}€`,
            iconType: 'search'
          })
        }
      })
    })

    // 4. Tendencia de gastos
    if (invoices.length >= 6) {
      const last3Months = invoices.slice(0, Math.floor(invoices.length / 2))
      const prev3Months = invoices.slice(Math.floor(invoices.length / 2))

      const recentAvg = last3Months.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / last3Months.length
      const prevAvg = prev3Months.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) / prev3Months.length

      if (recentAvg > prevAvg * 1.3) {
        newAlerts.push({
          id: 'trend-increase',
          type: 'trend',
          severity: 'warning',
          title: 'Tendencia Creciente de Gastos',
          message: `Tus gastos promedio han aumentado un ${(((recentAvg - prevAvg) / prevAvg) * 100).toFixed(0)}% en comparacion con meses anteriores.`,
          iconType: 'trending'
        })
      }
    }

    setAlerts(newAlerts)
  }

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  const getIcon = (iconType: string, severity: string) => {
    const color = severity === 'critical' ? '#DC2626' : severity === 'warning' ? '#D97706' : '#2563EB'
    
    switch (iconType) {
      case 'money':
        return <IconMoney size={24} color={color} />
      case 'chart':
        return <IconBarChart size={24} color={color} />
      case 'search':
        return <IconSearch size={24} color={color} />
      case 'trending':
        return <IconTrendingUp size={24} color={color} />
      default:
        return <IconAlertTriangle size={24} color={color} />
    }
  }

  if (!showAlerts || alerts.length === 0) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#ffffff] flex items-center space-x-2">
          <IconBell size={20} color="#F59E0B" />
          <span>Alertas ({alerts.length})</span>
        </h3>
        {alerts.length > 0 && (
          <button
            onClick={() => setShowAlerts(false)}
            className="text-lg text-[#ffffff] hover:text-gray-300"
          >
            Ocultar todo
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`rounded-lg border-2 p-4 ${getSeverityColor(alert.severity)} transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getIcon(alert.iconType, alert.severity)}
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                </div>
                <p className="text-lg ml-8">{alert.message}</p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-500 hover:text-gray-700 ml-4"
              >
                <IconX size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
