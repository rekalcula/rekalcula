'use client'

import { useState, useEffect } from 'react'

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
  type: 'rent_ratio' | 'cogs_ratio' | 'labor_ratio' | 'prime_cost' | 'profit_margin'
  severity: 'success' | 'warning' | 'critical'
  title: string
  message: string
  recommendation: string
  icon: string
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
        title: '?? Sin Ventas Registradas',
        message: 'No hay ventas registradas este mes para calcular ratios financieros.',
        recommendation: 'Comienza a registrar tus ventas para obtener análisis financiero.',
        icon: '??',
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
          title: '?? Alquiler Muy Alto',
          message: `Tu alquiler representa el ${rentRatio.toFixed(1)}% de tus ventas (€${data.rentCosts.toFixed(0)}/mes).`,
          recommendation: `Necesitas aumentar ventas a €${(data.rentCosts / 0.10).toFixed(0)}/mes o renegociar el alquiler. Un alquiler >12% pone en riesgo la rentabilidad.`,
          icon: '??',
          currentValue: rentRatio,
          optimalValue: '=10%'
        })
      } else if (rentRatio > 10) {
        newAlerts.push({
          id: 'rent-warning',
          type: 'rent_ratio',
          severity: 'warning',
          title: '?? Alquiler Elevado',
          message: `Tu alquiler representa el ${rentRatio.toFixed(1)}% de tus ventas (€${data.rentCosts.toFixed(0)}/mes).`,
          recommendation: `Intenta mantenerlo por debajo del 10%. Considera aumentar ventas en €${((data.rentCosts / 0.10) - data.totalSales).toFixed(0)}/mes.`,
          icon: '??',
          currentValue: rentRatio,
          optimalValue: '=10%'
        })
      } else {
        newAlerts.push({
          id: 'rent-good',
          type: 'rent_ratio',
          severity: 'success',
          title: '? Alquiler Óptimo',
          message: `Tu alquiler representa el ${rentRatio.toFixed(1)}% de tus ventas. ¡Excelente!`,
          recommendation: 'Continúa manteniendo este ratio. Está dentro del rango óptimo (6-10%).',
          icon: '??',
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
        title: '?? Costo de Materia Prima Muy Alto',
        message: `Tu materia prima representa el ${cogsRatio.toFixed(1)}% de tus ventas (€${data.totalVariableCosts.toFixed(0)}).`,
        recommendation: `Debes reducir costos en €${(data.totalVariableCosts - (data.totalSales * 0.35)).toFixed(0)} o aumentar precios. Un COGS >38% elimina rentabilidad.`,
        icon: '??',
        currentValue: cogsRatio,
        optimalValue: '=35%'
      })
    } else if (cogsRatio > 35) {
      newAlerts.push({
        id: 'cogs-warning',
        type: 'cogs_ratio',
        severity: 'warning',
        title: '?? Costo de Materia Prima Elevado',
        message: `Tu materia prima representa el ${cogsRatio.toFixed(1)}% de tus ventas (€${data.totalVariableCosts.toFixed(0)}).`,
        recommendation: `Busca proveedores más económicos o ajusta recetas/productos. Objetivo: reducir a 30-35%.`,
        icon: '??',
        currentValue: cogsRatio,
        optimalValue: '28-35%'
      })
    } else {
      newAlerts.push({
        id: 'cogs-good',
        type: 'cogs_ratio',
        severity: 'success',
        title: '? Costo de Materia Prima Óptimo',
        message: `Tu materia prima representa el ${cogsRatio.toFixed(1)}% de tus ventas. ¡Bien controlado!`,
        recommendation: 'Mantén este nivel. Está dentro del rango óptimo para tu sector.',
        icon: '??',
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
          title: '?? Costos Laborales Muy Altos',
          message: `Tus salarios representan el ${laborRatio.toFixed(1)}% de tus ventas (€${data.laborCosts.toFixed(0)}/mes).`,
          recommendation: `Necesitas aumentar productividad o ventas. Con ventas de €${(data.laborCosts / 0.35).toFixed(0)}/mes este ratio sería óptimo.`,
          icon: '??',
          currentValue: laborRatio,
          optimalValue: '=35%'
        })
      } else if (laborRatio > 35) {
        newAlerts.push({
          id: 'labor-warning',
          type: 'labor_ratio',
          severity: 'warning',
          title: '?? Costos Laborales Elevados',
          message: `Tus salarios representan el ${laborRatio.toFixed(1)}% de tus ventas (€${data.laborCosts.toFixed(0)}/mes).`,
          recommendation: `Optimiza turnos o aumenta ventas por empleado. Objetivo: 25-35%.`,
          icon: '??',
          currentValue: laborRatio,
          optimalValue: '25-35%'
        })
      } else {
        newAlerts.push({
          id: 'labor-good',
          type: 'labor_ratio',
          severity: 'success',
          title: '? Costos Laborales Óptimos',
          message: `Tus salarios representan el ${laborRatio.toFixed(1)}% de tus ventas. ¡Productividad excelente!`,
          recommendation: 'Mantén este equilibrio entre personal y ventas.',
          icon: '??',
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
        title: '?? PRIME COST PELIGROSO',
        message: `Tu Prime Cost (Materia Prima + Salarios) es del ${primeCost.toFixed(1)}%. Esto amenaza seriamente la rentabilidad.`,
        recommendation: `URGENTE: Debes reducir ${(primeCost - 65).toFixed(1)} puntos porcentuales. Combina reducción de costos y aumento de precios/ventas.`,
        icon: '??',
        currentValue: primeCost,
        optimalValue: '=65%'
      })
    } else if (primeCost > 65) {
      newAlerts.push({
        id: 'prime-cost-warning',
        type: 'prime_cost',
        severity: 'warning',
        title: '?? Prime Cost Alto',
        message: `Tu Prime Cost es del ${primeCost.toFixed(1)}%. Está por encima del límite recomendado.`,
        recommendation: `Reduce materia prima o salarios en ${((primeCost - 65) / 100 * data.totalSales).toFixed(0)}€/mes para alcanzar el 65%.`,
        icon: '??',
        currentValue: primeCost,
        optimalValue: '=65%'
      })
    } else {
      newAlerts.push({
        id: 'prime-cost-good',
        type: 'prime_cost',
        severity: 'success',
        title: '?? Prime Cost Excelente',
        message: `Tu Prime Cost es del ${primeCost.toFixed(1)}%. ¡Controlado perfectamente!`,
        recommendation: 'Este es el indicador más importante de rentabilidad. ¡Sigue así!',
        icon: '??',
        currentValue: primeCost,
        optimalValue: '55-65%'
      })
    }

    if (profitMargin < 0) {
      newAlerts.push({
        id: 'profit-critical',
        type: 'profit_margin',
        severity: 'critical',
        title: '?? Estás en Pérdidas',
        message: `Tu margen de beneficio es del ${profitMargin.toFixed(1)}%. Estás perdiendo €${Math.abs(data.netProfit).toFixed(0)}/mes.`,
        recommendation: `Revisa urgentemente todos tus costos y precios. Necesitas cambios inmediatos.`,
        icon: '??',
        currentValue: profitMargin,
        optimalValue: '15-25%'
      })
    } else if (profitMargin < 10) {
      newAlerts.push({
        id: 'profit-warning',
        type: 'profit_margin',
        severity: 'warning',
        title: '?? Margen de Beneficio Bajo',
        message: `Tu margen de beneficio es del ${profitMargin.toFixed(1)}%. Solo ganas €${data.netProfit.toFixed(0)}/mes.`,
        recommendation: `Objetivo: alcanzar 15-20% de margen. Necesitas mejorar eficiencia o aumentar precios.`,
        icon: '??',
        currentValue: profitMargin,
        optimalValue: '15-25%'
      })
    } else if (profitMargin >= 15) {
      newAlerts.push({
        id: 'profit-good',
        type: 'profit_margin',
        severity: 'success',
        title: '? Margen de Beneficio Saludable',
        message: `Tu margen de beneficio es del ${profitMargin.toFixed(1)}%. Ganas €${data.netProfit.toFixed(0)}/mes.`,
        recommendation: '¡Excelente! Mantén este nivel de rentabilidad.',
        icon: '??',
        currentValue: profitMargin,
        optimalValue: '15-25%'
      })
    }

    const sortedAlerts = newAlerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, success: 2 }
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
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-400 text-red-900'
      case 'warning': return 'bg-yellow-50 border-yellow-400 text-yellow-900'
      case 'success': return 'bg-green-50 border-green-400 text-green-900'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'warning': return 'bg-yellow-600 text-white'
      case 'success': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <span>??</span>
          <span>Alertas Financieras ({alerts.length})</span>
        </h3>
        {alerts.length > 0 && (
          <button
            onClick={() => setShowAlerts(false)}
            className="text-sm text-gray-600 hover:text-gray-800"
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
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{alert.icon}</span>
                  <h4 className="font-semibold text-lg">{alert.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getSeverityBadge(alert.severity)}`}>
                    {alert.currentValue.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-600">
                    Óptimo: {alert.optimalValue}
                  </span>
                </div>
                <p className="text-sm mb-2 font-medium">{alert.message}</p>
                <p className="text-sm opacity-80">
                  <strong>?? Recomendación:</strong> {alert.recommendation}
                </p>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-500 hover:text-gray-700 ml-4 text-xl"
              >
                ?
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
