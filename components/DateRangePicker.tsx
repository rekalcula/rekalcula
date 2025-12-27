'use client'

import { useState, useEffect } from 'react'

interface DateRangePickerProps {
  onDateChange: (fechaInicio: string, fechaFin: string, diasSeleccionados: number) => void
  disabled?: boolean
}

export default function DateRangePicker({ onDateChange, disabled }: DateRangePickerProps) {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [diasConVentas, setDiasConVentas] = useState<string[]>([])
  const [diasSeleccionados, setDiasSeleccionados] = useState(0)

  // Obtener fechas con ventas al montar
  useEffect(() => {
    fetch('/api/sales/available-dates')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.dates) {
          setDiasConVentas(data.dates)
          
          // Establecer rango inicial: ultimos 30 dias con datos
          if (data.dates.length > 0) {
            const fechas = data.dates.sort()
            const ultimaFecha = fechas[fechas.length - 1]
            const primeraFecha = fechas[0]
            
            // Calcular 30 dias atras desde la ultima fecha
            const fin = new Date(ultimaFecha)
            const inicio = new Date(fin)
            inicio.setDate(inicio.getDate() - 29)
            
            const inicioStr = inicio > new Date(primeraFecha) 
              ? inicio.toISOString().split('T')[0]
              : primeraFecha
              
            setFechaInicio(inicioStr)
            setFechaFin(ultimaFecha)
          }
        }
      })
      .catch(err => console.error('Error cargando fechas:', err))
  }, [])

  // Calcular dias cuando cambian las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      const diff = fin.getTime() - inicio.getTime()
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
      
      setDiasSeleccionados(dias)
      onDateChange(fechaInicio, fechaFin, dias)
    }
  }, [fechaInicio, fechaFin, onDateChange])

  const mostrarWarning = diasSeleccionados > 0 && diasSeleccionados < 15

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xl font-medium text-[#FFFCFF] mb-1">
            Fecha inicio
          </label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            disabled={disabled}
            max={fechaFin || undefined}
            className="w-full px-4 py-2 bg-[#262626] text-[#FFFCFF] border border-[#979797] rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-[#AC4A00]"
          />
        </div>

        <div>
          <label className="block text-xl font-medium text-[#FFFCFF] mb-1">
            Fecha fin
          </label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            disabled={disabled}
            min={fechaInicio || undefined}
            className="w-full px-4 py-2 bg-[#262626] text-[#FFFCFF] border border-[#979797] rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-[#AC4A00]"
          />
        </div>
      </div>

      {diasSeleccionados > 0 && (
        <div className="text-[#ACACAC] text-lg">
          {diasSeleccionados} dias seleccionados
        </div>
      )}

      {mostrarWarning && (
        <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-yellow-200 font-medium mb-1">
                Periodo menor a 15 dias
              </p>
              <p className="text-yellow-300/80 text-sm">
                Se recomienda al menos 15 dias de datos de ventas para realizar un analisis 
                cientificamente valido y detectar tendencias significativas.
              </p>
            </div>
          </div>
        </div>
      )}

      {diasConVentas.length > 0 && (
        <p className="text-[#ACACAC] text-sm">
          Tienes ventas registradas en {diasConVentas.length} dias diferentes
        </p>
      )}
    </div>
  )
}