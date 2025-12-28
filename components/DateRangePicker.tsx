'use client'

import { useState, useEffect } from 'react'

interface DateRangePickerProps {
  onDateChange: (fechaInicio: string, fechaFin: string, diasSeleccionados: number) => void
  disabled?: boolean
}

export default function DateRangePicker({ onDateChange, disabled }: DateRangePickerProps) {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [diasSeleccionados, setDiasSeleccionados] = useState(0)
  const [diasConVentas, setDiasConVentas] = useState(0)

  // Fetch available dates on mount
  useEffect(() => {
    async function fetchAvailableDates() {
      try {
        const response = await fetch('/api/sales/available-dates')
        const data = await response.json()
        
        if (data.success && data.dates && data.dates.length > 0) {
          setDiasConVentas(data.dates.length)
          
          // Set default range: last 30 days with data
          const lastDate = data.dates[data.dates.length - 1]
          const firstDate = data.dates[Math.max(0, data.dates.length - 30)]
          
          setFechaInicio(firstDate)
          setFechaFin(lastDate)
        }
      } catch (error) {
        console.error('Error fetching dates:', error)
      }
    }
    
    fetchAvailableDates()
  }, [])

  // Calculate days when dates change
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      const diffTime = Math.abs(fin.getTime() - inicio.getTime())
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      
      setDiasSeleccionados(dias)
      onDateChange(fechaInicio, fechaFin, dias)
    }
  }, [fechaInicio, fechaFin, onDateChange])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {fechaInicio && fechaFin && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{diasSeleccionados}</span> dias seleccionados
            {diasConVentas > 0 && (
              <span className="ml-2">
                ({diasConVentas} dias con ventas disponibles)
              </span>
            )}
          </div>

          {diasSeleccionados < 15 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">
                    Periodo menor a 15 dias
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Se recomienda al menos 15 dias de datos de ventas para realizar un analisis 
                    cientificamente valido y detectar tendencias significativas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}