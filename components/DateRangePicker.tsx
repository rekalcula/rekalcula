'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface DateRangePickerProps {
  onDateChange: (fechaInicio: string, fechaFin: string, diasSeleccionados: number) => void
  disabled?: boolean
}

export default function DateRangePicker({ onDateChange, disabled }: DateRangePickerProps) {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null)
  const [fechaFin, setFechaFin] = useState<Date | null>(null)
  const [diasSeleccionados, setDiasSeleccionados] = useState(0)
  const [fechasConVentas, setFechasConVentas] = useState<Date[]>([])

  useEffect(() => {
    async function fetchAvailableDates() {
      try {
        const response = await fetch('/api/sales/available-dates')
        const data = await response.json()
        
        if (data.success && data.dates && data.dates.length > 0) {
          // Convertir strings a objetos Date
          const dates = data.dates.map((d: string) => new Date(d + 'T00:00:00'))
          setFechasConVentas(dates)
          
          // Establecer rango por defecto (últimos 30 días)
          const lastDate = dates[dates.length - 1]
          const firstDate = dates[Math.max(0, dates.length - 30)]
          
          setFechaInicio(firstDate)
          setFechaFin(lastDate)
        }
      } catch (error) {
        console.error('Error fetching dates:', error)
      }
    }
    
    fetchAvailableDates()
  }, [])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime())
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      
      setDiasSeleccionados(dias)
      
      // Formatear a YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      
      onDateChange(formatDate(fechaInicio), formatDate(fechaFin), dias)
    }
  }, [fechaInicio, fechaFin, onDateChange])

  // Función para marcar días con ventas
  const dayClassName = (date: Date) => {
    const hasData = fechasConVentas.some(d => 
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    )
    return hasData ? 'has-sales' : ''
  }

  return (
    <div className="space-y-4">
      <style jsx global>{`
        .react-datepicker {
          background-color: #0d0d0d !important;
          border: 1px solid #3d3d3d !important;
        }
        .react-datepicker__header {
          background-color: #262626 !important;
          border-bottom: 1px solid #3d3d3d !important;
        }
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: #FFFCFF !important;
        }
        .react-datepicker__day {
          color: #ACACAC !important;
        }
        .react-datepicker__day:hover {
          background-color: #d98c21 !important;
          color: #FFFCFF !important;
        }
        .react-datepicker__day--selected {
          background-color: #d98c21 !important;
          color: #FFFCFF !important;
        }
        .react-datepicker__day.has-sales {
          background-color: rgba(217, 140, 33, 0.2) !important;
          border-radius: 4px;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #d98c21 !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #FFFCFF !important;
        }
      `}</style>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#ACACAC] mb-1">
            Fecha inicio
          </label>
          <DatePicker
            selected={fechaInicio}
            onChange={(date) => setFechaInicio(date)}
            selectsStart
            startDate={fechaInicio}
            endDate={fechaFin}
            dayClassName={dayClassName}
            disabled={disabled}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border-2 border-[#d98c21] bg-[#0d0d0d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21] focus:border-[#d98c21] disabled:opacity-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#ACACAC] mb-1">
            Fecha fin
          </label>
          <DatePicker
            selected={fechaFin}
            onChange={(date) => setFechaFin(date)}
            selectsEnd
            startDate={fechaInicio}
            endDate={fechaFin}
            minDate={fechaInicio}
            dayClassName={dayClassName}
            disabled={disabled}
            dateFormat="dd/MM/yyyy"
            className="w-full px-3 py-2 border-2 border-[#d98c21] bg-[#0d0d0d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21] focus:border-[#d98c21] disabled:opacity-50"
          />
        </div>
      </div>

      {fechaInicio && fechaFin && (
        <div className="text-sm text-[#ACACAC]">
          <span className="font-medium text-[#FFFCFF]">{diasSeleccionados}</span> dias seleccionados
          <span className="ml-2">
            ({fechasConVentas.length} dias con ventas disponibles)
          </span>
        </div>
      )}

      {fechaInicio && fechaFin && diasSeleccionados < 15 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">
                Periodo menor a 15 dias
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Se recomienda al menos 15 dias de datos de ventas para realizar un análisis 
                cientificamente válido y detectar tendencias significativas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}