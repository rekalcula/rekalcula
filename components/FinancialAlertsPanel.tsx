'use client'

import { useState, useEffect } from 'react'
import { IconX } from './Icons'

interface FinancialData {
  totalSales: number
  totalVariableCosts: number
  totalFixedCosts: number
  rentCosts: number
  laborCosts: number
  grossProfit: number
  netProfit: number
}

interface FinancialAlert {
  id: string
  type: string
  severity: string
  title: string
  message: string
  recommendation: string
  currentValue: number
  optimalValue: string
}

interface Props {
  data: FinancialData
}

export default function FinancialAlertsPanel({ data }: Props) {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [showAlerts, setShowAlerts] = useState(true)

  useEffect(() => {
    generateFinancialAlerts()
  }, [data])

  const generateFinancialAlerts = () => {
    const newAlerts: FinancialAlert[] = []

    if (data.totalSales === 0) {
      newAlerts.push({
        id: 'no-sales',
        type: 'profit_margin',
        severity: 'warning',
        title: 'Sin Ventas Registradas',
        message: 'No hay ventas registradas este mes para calcular ratios financieros.',
        recommendation: 'Comienza a registrar tus ventas para obtener analisis financiero.',
        currentValue: 0,
        optimalValue: 'N/A'
      })
      setAlerts(newAlerts)
      return
    }

    const rentRatio = (data.rentCosts / data.totalSales) * 100
    const cogsRatio = (data.totalVariableCosts / data.totalSales) * 100
    const laborRatio = (data.laborCosts / data.totalSales) * 100
    const primeCost = ((data.totalVariableCosts + data.laborCosts) / data.totalSales) * 100
    const profitMargin = (data.netProfit / data.totalSales) * 100

    if (data.rentCosts > 0) {
      if (rentRatio > 12) {
        newAlerts.push({
          id: 'rent-critical',
          type: 'rent_ratio',
          severity: 'critical',
          title: 'Alquiler Muy Alto',
          message: 'Tu alquiler representa el ' + rentRatio.toFixed(1) + '% de tus ventas.',
          recommendation: 'Necesitas aumentar ventas o renegociar el alquiler. Un alquiler >12% pone en riesgo la rentabilidad.',
          currentValue: rentRatio,
          optimalValue: 'Maximo 10%'
        })
      } else if (rentRatio > 10) {
        newAlerts.push({
          id: 'rent-warning',
          type: 'rent_ratio',
          severity: 'warning',
          title: 'Alquiler Elevado',
          message: 'Tu alquiler representa el ' + rentRatio.toFixed(1) + '% de tus ventas.',
          recommendation: 'Intenta mantenerlo por debajo del 10%.',
          currentValue: rentRatio,
          optimalValue: 'Maximo 10%'
        })
      } else {
        newAlerts.push({
          id: 'rent-good',
          type: 'rent_ratio',
          severity: 'success',
          title: 'Alquiler Optimo',
          message: 'Tu alquiler representa el ' + rentRatio.toFixed(1) + '% de tus ventas.',
          recommendation: 'Continua manteniendo este ratio. Esta dentro del rango optimo (6-10%).',
          currentValue: rentRatio,
          optimalValue: '6-10%'
        })
      }
    }

    if (cogsRatio > 38) {
      newAlerts.push({
        id: 'cogs-critical',
        type: 'cogs_ratio',
        severity: 'critical',
        title: 'Costo de Materia Prima Muy Alto',
        message: 'Tu materia prima representa el ' + cogsRatio.toFixed(1) + '% de tus ventas.',
        recommendation: 'Un COGS >38% elimina rentabilidad. Reduce costos o aumenta precios.',
        currentValue: cogsRatio,
        optimalValue: 'Maximo 35%'
      })
    } else if (cogsRatio > 35) {
      newAlerts.push({
        id: 'cogs-warning',
        type: 'cogs_ratio',
        severity: 'warning',
        title: 'Costo de Materia Prima Elevado',
        message: 'Tu materia prima representa el ' + cogsRatio.toFixed(1) + '% de tus ventas.',
        recommendation: 'Busca proveedores mas economicos. Objetivo: 30-35%.',
        currentValue: cogsRatio,
        optimalValue: '28-35%'
      })
    } else {
      newAlerts.push({
        id: 'cogs-good',
        type: 'cogs_ratio',
        severity: 'success',
        title: 'Costo de Materia Prima Optimo',
        message: 'Tu materia prima representa el ' + cogsRatio.toFixed(1) + '% de tus ventas.',
        recommendation: 'Manten este nivel. Esta dentro del rango optimo.',
        currentValue: cogsRatio,
        optimalValue: '28-35%'
      })
    }

    if (data.laborCosts > 0) {
      if (laborRatio > 40) {
        newAlerts.push({
          id: 'labor-critical',
          type: 'labor_ratio',
          severity: 'critical',
          title: 'Costos Laborales Muy Altos',
          message: 'Tus salarios representan el ' + laborRatio.toFixed(1) + '% de tus ventas.',
          recommendation: 'Necesitas aumentar productividad o ventas.',
          currentValue: laborRatio,
          optimalValue: 'Maximo 35%'
        })
      } else if (laborRatio > 35) {
        newAlerts.push({
          id: 'labor-warning',
          type: 'labor_ratio',
          severity: 'warning',
          title: 'Costos Laborales Elevados',
          message: 'Tus salarios representan el ' + laborRatio.toFixed(1) + '% de tus ventas.',
          recommendation: 'Optimiza turnos o aumenta ventas por empleado. Objetivo: 25-35%.',
          currentValue: laborRatio,
          optimalValue: '25-35%'
        })
      } else {
        newAlerts.push({
          id: 'labor-good',
          type: 'labor_ratio',
          severity: 'success',
          title: 'Costos Laborales Optimos',
          message: 'Tus salarios representan el ' + laborRatio.toFixed(1) + '% de tus ventas.',
          recommendation: 'Manten este equilibrio entre personal y ventas.',
          currentValue: laborRatio,
          optimalValue: '25-35%'
        })
      }
    }

    if (primeCost > 70) {
      newAlerts.push({
        id: 'prime-cost-critical',
        type: 'prime_cost',
        severity: 'critical',
        title: 'PRIME COST PELIGROSO',
        message: 'Tu Prime Cost es del ' + primeCost.toFixed(1) + '%. Esto amenaza la rentabilidad.',
        recommendation: 'URGENTE: Reduce costos y/o aumenta precios.',
        currentValue: primeCost,
        optimalValue: 'Maximo 65%'
      })
    } else if (primeCost > 65) {
      newAlerts.push({
        id: 'prime-cost-warning',
        type: 'prime_cost',
        severity: 'warning',
        title: 'Prime Cost Alto',
        message: 'Tu Prime Cost es del ' + primeCost.toFixed(1) + '%.',
        recommendation: 'Reduce materia prima o salarios para alcanzar el 65%.',
        currentValue: primeCost,
        optimalValue: 'Maximo 65%'
      })
    } else {
      newAlerts.push({
        id: 'prime-cost-good',
        type: 'prime_cost',
        severity: 'success',
        title: 'Prime Cost Excelente',
        message: 'Tu Prime Cost es del ' + primeCost.toFixed(1) + '%.',
        recommendation: 'Este es el indicador mas importante de rentabilidad. Sigue asi!',
        currentValue: primeCost,
        optimalValue: '55-65%'
      })
    }

    if (profitMargin < 0) {
      newAlerts.push({
        id: 'profit-critical',
        type: 'profit_margin',
        severity: 'critical',
        title: 'Estas en Perdidas',
        message: 'Tu margen de beneficio es del ' + profitMargin.toFixed(1) + '%.',
        recommendation: 'Revisa urgentemente todos tus costos y precios.',
        currentValue: profitMargin,
        optimalValue: '15-25%'
      })
    } else if (profitMargin < 10) {
      newAlerts.push({
        id: 'profit-warning',
        type: 'profit_margin',
        severity: 'warning',
        title: 'Margen de Beneficio Bajo',
        message: 'Tu margen de beneficio es del ' + profitMargin.toFixed(1) + '%.',
        recommendation: 'Objetivo: alcanzar 15-20% de margen.',
        currentValue: profitMargin,
        optimalValue: '15-25%'
      })
    } else if (profitMargin >= 15) {
      newAlerts.push({
        id: 'profit-good',
        type: 'profit_margin',
        severity: 'success',
        title: 'Margen de Beneficio Saludable',
        message: 'Tu margen de beneficio es del ' + profitMargin.toFixed(1) + '%.',
        recommendation: 'Excelente! Manten este nivel de rentabilidad.',
        currentValue: profitMargin,
        optimalValue: '15-25%'
      })
    }

    const sortedAlerts = newAlerts.sort((a, b) => {
      const severityOrder: any = { critical: 0, warning: 1, success: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })

    setAlerts(sortedAlerts)
  }

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  if (!showAlerts || alerts.length === 0) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'bg-red-50 border-red-400 text-red-900'
    if (severity === 'warning') return 'bg-yellow-50 border-yellow-400 text-yellow-900'
    if (severity === 'success') return 'bg-green-50 border-green-400 text-green-900'
    return 'bg-gray-50 border-gray-200 text-gray-800'
  }

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') return 'bg-red-600 text-white'
    if (severity === 'warning') return 'bg-yellow-600 text-white'
    if (severity === 'success') return 'bg-green-600 text-white'
    return 'bg-gray-600 text-white'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#FFFCFF] flex items-center space-x-2">
          <span>Alertas Financieras ({alerts.length})</span>
        </h3>
        {alerts.length > 0 && (
          <button
            onClick={() => setShowAlerts(false)}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Ocultar todo
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={'rounded-lg border-2 p-4 transition-all ' + getSeverityColor(alert.severity)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                  <span className={'px-2 py-1 rounded-full text-xs font-bold ' + getSeverityBadge(alert.severity)}>
                    {alert.currentValue.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-600">
                    Optimo: {alert.optimalValue}
                  </span>
                </div>
                <p className="text-sm mb-2 font-medium">{alert.message}</p>
                <p className="text-sm opacity-80">
                  <strong>Recomendacion:</strong> {alert.recommendation}
                </p>
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
