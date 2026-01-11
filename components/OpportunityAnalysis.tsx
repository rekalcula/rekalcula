'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, TrendingDown, Clock, Calendar, AlertCircle, 
  CheckCircle2, Lightbulb, ArrowUpRight, ArrowDownRight,
  Sun, Moon, Coffee, Sunset
} from 'lucide-react'

interface OpportunityData {
  hasData: boolean
  periodoAnalisis?: {
    inicio: string
    fin: string
    totalDias: number
    totalVentas: number
  }
  analisisDias?: Array<{
    dia: number
    nombre: string
    ventasPromedio: number
    ingresosPromedio: number
    totalVentas: number
    totalIngresos: number
  }>
  analisisHorarios?: Array<{
    franja: string
    ventasPromedioDiarias: number
    ingresosPromedioDiarios: number
    totalVentas: number
    totalIngresos: number
  }>
  recomendaciones?: Array<{
    type: string
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    impactoMensual: number
    confidence: number
    data: any
  }>
  metricas?: {
    ingresoPromedioDiario: number
    costoFijoDiario: number
    mejorDia: string
    mejorFranja: string
    impactoTotalPotencial: number
  }
}

export default function OpportunityAnalysis() {
  const [data, setData] = useState<OpportunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/analytics/opportunity')
      if (!response.ok) throw new Error('Error al cargar análisis')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('No se pudo cargar el análisis de oportunidades')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-5 h-5" />
      case 'medium': return <Lightbulb className="w-5 h-5" />
      case 'low': return <CheckCircle2 className="w-5 h-5" />
      default: return <AlertCircle className="w-5 h-5" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ampliar_horario': return <ArrowUpRight className="w-4 h-4" />
      case 'reducir_horario': return <ArrowDownRight className="w-4 h-4" />
      case 'redistribuir_recursos': return <TrendingUp className="w-4 h-4" />
      case 'ajuste_estacional': return <Calendar className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getFranjaIcon = (franja: string) => {
    if (franja.includes('Mañana') || franja.includes('temprano')) return <Coffee className="w-4 h-4" />
    if (franja.includes('Tarde')) return <Sun className="w-4 h-4" />
    if (franja.includes('Noche')) return <Moon className="w-4 h-4" />
    if (franja.includes('Madrugada')) return <Moon className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#d98c21] animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold text-white">Análisis de Oportunidades</h3>
            <p className="text-sm text-gray-400">Analizando patrones de venta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data?.hasData) {
    return (
      <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900">Datos insuficientes</h3>
            <p className="text-sm text-amber-700 mt-1">
              Necesitas al menos 3 meses de ventas para generar análisis de oportunidades temporal.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas generales */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-6 border border-purple-700">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-7 h-7 text-yellow-300" />
          <div>
            <h3 className="text-xl font-bold text-white">Análisis de Oportunidades</h3>
            <p className="text-purple-200 text-sm">
              Basado en {data.periodoAnalisis?.totalVentas} ventas • {data.periodoAnalisis?.totalDias} días
            </p>
          </div>
        </div>

        {data.metricas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-purple-200 text-xs">Mejor día</p>
              <p className="text-white font-bold text-lg">{data.metricas.mejorDia}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-purple-200 text-xs">Mejor franja</p>
              <p className="text-white font-bold text-sm">{data.metricas.mejorFranja}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-purple-200 text-xs">Ingreso/día</p>
              <p className="text-white font-bold text-lg">{formatCurrency(data.metricas.ingresoPromedioDiario)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-purple-200 text-xs">Potencial total</p>
              <p className="text-green-300 font-bold text-lg">+{formatCurrency(data.metricas.impactoTotalPotencial)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recomendaciones */}
      {data.recomendaciones && data.recomendaciones.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-[#d98c21] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Oportunidades Detectadas ({data.recomendaciones.length})
          </h4>

          <div className="space-y-4">
            {data.recomendaciones.map((rec, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 border-2 ${getPriorityColor(rec.priority)} transition-all hover:shadow-lg`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(rec.type)}
                      <h5 className="font-bold">{rec.title}</h5>
                    </div>
                    
                    <p className="text-sm mb-3">{rec.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold">
                          Impacto: {rec.impactoMensual > 0 ? '+' : ''}{formatCurrency(rec.impactoMensual)}/mes
                        </span>
                        <span className="text-xs opacity-75">
                          Confianza: {rec.confidence}%
                        </span>
                      </div>
                      
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                        ${rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : ''}
                        ${rec.priority === 'low' ? 'bg-blue-100 text-blue-700' : ''}
                      `}>
                        {rec.priority === 'high' ? 'Alta prioridad' : ''}
                        {rec.priority === 'medium' ? 'Prioridad media' : ''}
                        {rec.priority === 'low' ? 'Baja prioridad' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Análisis por día de la semana */}
      {data.analisisDias && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-[#d98c21] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rendimiento por Día de la Semana
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {data.analisisDias.map((dia) => {
              const isWeekend = dia.dia === 0 || dia.dia === 6
              const ingresosMax = Math.max(...data.analisisDias!.map(d => d.ingresosPromedio))
              const porcentaje = (dia.ingresosPromedio / ingresosMax) * 100

              return (
                <div
                  key={dia.dia}
                  className={`
                    rounded-lg p-3 border
                    ${isWeekend ? 'bg-purple-900/20 border-purple-700' : 'bg-[#262626] border-gray-700'}
                  `}
                >
                  <p className="text-white font-semibold text-sm mb-1">{dia.nombre.substring(0, 3)}</p>
                  <p className="text-[#d98c21] font-bold text-lg">{formatCurrency(dia.ingresosPromedio)}</p>
                  <p className="text-gray-400 text-xs mt-1">{Math.round(dia.ventasPromedio)} ventas</p>
                  
                  <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${isWeekend ? 'bg-purple-500' : 'bg-[#d98c21]'}`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Análisis por franja horaria */}
      {data.analisisHorarios && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-[#d98c21] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Rendimiento por Franja Horaria
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.analisisHorarios.map((horario, index) => {
              const ingresosMax = Math.max(...data.analisisHorarios!.map(h => h.ingresosPromedioDiarios))
              const porcentaje = (horario.ingresosPromedioDiarios / ingresosMax) * 100

              return (
                <div key={index} className="bg-[#262626] rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    {getFranjaIcon(horario.franja)}
                    <p className="text-white font-semibold">{horario.franja}</p>
                  </div>
                  
                  <p className="text-[#d98c21] font-bold text-xl">{formatCurrency(horario.ingresosPromedioDiarios)}</p>
                  <p className="text-gray-400 text-sm">por día en promedio</p>
                  
                  <div className="mt-3 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#d98c21] to-[#f4a340]"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  
                  <p className="text-gray-500 text-xs mt-2">
                    {Math.round(horario.ventasPromedioDiarias * 10) / 10} ventas/día • {horario.totalVentas} total
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}