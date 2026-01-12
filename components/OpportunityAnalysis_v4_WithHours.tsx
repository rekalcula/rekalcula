'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, TrendingDown, Clock, Calendar, AlertCircle, 
  CheckCircle2, Lightbulb, ArrowUpRight, ArrowDownRight, X, Coffee
} from 'lucide-react'

interface BusinessHour {
  day_of_week: number
  is_closed: boolean
  morning_open: string | null
  morning_close: string | null
  afternoon_open: string | null
  afternoon_close: string | null
}

interface OpportunityData {
  hasData: boolean
  selectedDay?: number | null
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
    hora: number
    horaFormato: string
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
    mejorHora: string
    impactoTotalPotencial: number
  } | null
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function OpportunityAnalysisV4() {
  const [data, setData] = useState<OpportunityData | null>(null)
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    loadBusinessHours()
  }, [])

  useEffect(() => {
    if (businessHours.length > 0) {
      fetchOpportunities()
    }
  }, [selectedDay, businessHours])

  const loadBusinessHours = async () => {
    try {
      const response = await fetch('/api/business-hours')
      const result = await response.json()
      
      if (result.configured && result.hours) {
        setBusinessHours(result.hours)
      }
    } catch (err) {
      console.error('Error al cargar horarios:', err)
    }
  }

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const url = selectedDay !== null 
        ? `/api/analytics/opportunity?day=${selectedDay}`
        : '/api/analytics/opportunity'
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al cargar análisis')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('No se pudo cargar el análisis de oportunidades')
    } finally {
      setLoading(false)
    }
  }

  const handleDayClick = (dia: number) => {
    setSelectedDay(dia === selectedDay ? null : dia)
  }

  // Función para verificar si una hora está dentro del horario de apertura
  const isHourOpen = (hora: number, dayOfWeek: number): 'open' | 'closed' | 'lunch_break' => {
    if (businessHours.length === 0) return 'open' // Si no hay configuración, mostrar todo

    const schedule = businessHours.find(h => h.day_of_week === dayOfWeek)
    if (!schedule || schedule.is_closed) return 'closed'

    const horaStr = `${hora.toString().padStart(2, '0')}:00`

    // Verificar turno mañana
    if (schedule.morning_open && schedule.morning_close) {
      if (horaStr >= schedule.morning_open && horaStr < schedule.morning_close) {
        return 'open'
      }
    }

    // Verificar turno tarde (si existe)
    if (schedule.afternoon_open && schedule.afternoon_close) {
      if (horaStr >= schedule.afternoon_open && horaStr < schedule.afternoon_close) {
        return 'open'
      }
      
      // Si está entre los dos turnos, es hora de comida
      if (schedule.morning_close && horaStr >= schedule.morning_close && horaStr < schedule.afternoon_open) {
        return 'lunch_break'
      }
    }

    return 'closed'
  }

  // Filtrar horas según configuración de apertura
  const getFilteredHours = () => {
    if (!data?.analisisHorarios) return []

    return data.analisisHorarios.map(horario => {
      const dayOfWeek = selectedDay !== null ? selectedDay : 0 // Usar día seleccionado o lunes por defecto
      const status = isHourOpen(horario.hora, dayOfWeek)
      
      return {
        ...horario,
        status
      }
    })
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

  const selectedDayName = selectedDay !== null && data.analisisDias 
    ? data.analisisDias[selectedDay].nombre 
    : null

  const filteredHours = getFilteredHours()

  return (
    <div className="space-y-6">
      {/* Header con métricas generales (solo si no hay filtro) */}
      {selectedDay === null && data.metricas && (
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-purple-200 text-xs">Mejor día</p>
              <p className="text-white font-bold text-lg">{data.metricas.mejorDia}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-purple-200 text-xs">Mejor hora</p>
              <p className="text-white font-bold text-lg">{data.metricas.mejorHora}</p>
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
        </div>
      )}

      {/* Recomendaciones (solo si no hay filtro) */}
      {selectedDay === null && data.recomendaciones && data.recomendaciones.length > 0 && (
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

      {/* Análisis por día de la semana (CLICKEABLE) */}
      {data.analisisDias && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-[#d98c21] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rendimiento por Día de la Semana
            {selectedDay !== null && (
              <span className="text-sm text-gray-400 font-normal">
                (Click para filtrar por hora)
              </span>
            )}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            {data.analisisDias.map((dia) => {
              const isWeekend = dia.dia === 5 || dia.dia === 6 // Sábado=5, Domingo=6 (en mi mapeo 0=Lunes)
              const isSelected = selectedDay === dia.dia
              const ingresosMax = Math.max(...data.analisisDias!.map(d => d.ingresosPromedio))
              const porcentaje = (dia.ingresosPromedio / ingresosMax) * 100

              return (
                <button
                  key={dia.dia}
                  onClick={() => handleDayClick(dia.dia)}
                  className={`
                    rounded-lg p-3 border transition-all cursor-pointer
                    ${isSelected 
                      ? 'bg-[#d98c21] border-[#d98c21] ring-2 ring-[#d98c21]/50' 
                      : isWeekend 
                        ? 'bg-purple-900/20 border-purple-700 hover:bg-purple-900/30' 
                        : 'bg-[#262626] border-gray-700 hover:bg-[#2d2d2d]'
                    }
                  `}
                >
                  <p className={`font-semibold text-sm mb-1 ${isSelected ? 'text-white' : 'text-white'}`}>
                    {dia.nombre.substring(0, 3)}
                  </p>
                  <p className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-[#d98c21]'}`}>
                    {formatCurrency(dia.ingresosPromedio)}
                  </p>
                  <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {Math.round(dia.ventasPromedio)} ventas
                  </p>
                  
                  <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${isSelected ? 'bg-white' : isWeekend ? 'bg-purple-500' : 'bg-[#d98c21]'}`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          {selectedDay !== null && (
            <button
              onClick={() => setSelectedDay(null)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Ver todos los días
            </button>
          )}
        </div>
      )}

      {/* Análisis hora por hora (24 horas) - FILTRADO POR HORARIO */}
      {data.analisisHorarios && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-[#d98c21] mb-2 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Rendimiento Hora por Hora
            {selectedDayName && (
              <span className="text-white font-bold">- {selectedDayName.toUpperCase()}</span>
            )}
          </h4>
          {selectedDayName && (
            <p className="text-gray-400 text-sm mb-4">
              Mostrando solo ventas de {selectedDayName} • Solo horas de apertura
            </p>
          )}

          {/* Gráfico de barras horizontal - FILTRADO */}
          <div className="space-y-2">
            {filteredHours.map((horario) => {
              const ingresosMax = Math.max(...filteredHours.filter(h => h.status === 'open').map(h => h.ingresosPromedioDiarios))
              const porcentaje = ingresosMax > 0 ? (horario.ingresosPromedioDiarios / ingresosMax) * 100 : 0
              const tieneActividad = horario.totalVentas > 0
              const status = horario.status

              // Solo mostrar horas de apertura y hora de comida
              if (status === 'closed') return null

              // Color según actividad
              let colorClase = 'bg-gray-700'
              if (status === 'lunch_break') {
                colorClase = 'bg-amber-600'
              } else if (tieneActividad) {
                if (porcentaje > 80) colorClase = 'bg-gradient-to-r from-green-500 to-emerald-600'
                else if (porcentaje > 50) colorClase = 'bg-gradient-to-r from-[#d98c21] to-[#f4a340]'
                else if (porcentaje > 20) colorClase = 'bg-gradient-to-r from-yellow-500 to-amber-500'
                else colorClase = 'bg-gradient-to-r from-gray-500 to-gray-600'
              }

              return (
                <div
                  key={horario.hora}
                  className={`
                    flex items-center gap-3 p-2 rounded-lg transition-all
                    ${status === 'lunch_break' ? 'bg-amber-900/20' : tieneActividad ? 'bg-[#262626] hover:bg-[#2d2d2d]' : 'bg-[#1a1a1a]'}
                  `}
                >
                  {/* Hora */}
                  <div className="w-16 flex-shrink-0">
                    <p className={`text-sm font-mono ${status === 'lunch_break' ? 'text-amber-400 font-semibold' : tieneActividad ? 'text-white font-semibold' : 'text-gray-600'}`}>
                      {horario.horaFormato}
                    </p>
                  </div>

                  {/* Barra de progreso o mensaje de cierre */}
                  {status === 'lunch_break' ? (
                    <div className="flex-1 flex items-center gap-2 text-amber-400">
                      <Coffee className="w-4 h-4" />
                      <span className="text-sm font-medium">Cierre mediodía</span>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-500 ${colorClase}`}
                          style={{ width: `${porcentaje}%` }}
                        />
                        {tieneActividad && porcentaje > 15 && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {formatCurrency(horario.ingresosPromedioDiarios)}
                          </span>
                        )}
                      </div>

                      {/* Valor fuera de la barra si es muy pequeña */}
                      {tieneActividad && porcentaje <= 15 && (
                        <span className="text-[#d98c21] text-xs font-semibold whitespace-nowrap">
                          {formatCurrency(horario.ingresosPromedioDiarios)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Ventas */}
                  <div className="w-20 flex-shrink-0 text-right">
                    {status === 'lunch_break' ? (
                      <span className="text-gray-700 text-xs">—</span>
                    ) : tieneActividad ? (
                      <p className="text-gray-400 text-xs">
                        {Math.round(horario.ventasPromedioDiarias * 10) / 10} v/d
                      </p>
                    ) : (
                      <p className="text-gray-700 text-xs">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-600"></div>
              <span>Pico (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-[#d98c21] to-[#f4a340]"></div>
              <span>Alto (50-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-yellow-500 to-amber-500"></div>
              <span>Medio (20-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-r from-gray-500 to-gray-600"></div>
              <span>Bajo (&lt;20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-600"></div>
              <span>Cierre mediodía</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}