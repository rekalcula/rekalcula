'use client'

import { useState, useEffect } from 'react'
import { Clock, Save, X, CheckCircle2, AlertCircle } from 'lucide-react'

interface DaySchedule {
  day_of_week: number
  is_closed: boolean
  morning_open: string
  morning_close: string
  afternoon_open: string
  afternoon_close: string
  has_split_schedule: boolean
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface Props {
  onSaved?: () => void
}

export default function BusinessHoursConfigComponent({ onSaved }: Props) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/business-hours')
      const data = await response.json()
      
      if (data.configured && data.hours.length > 0) {
        setSchedules(data.hours.map((h: any) => ({
          day_of_week: h.day_of_week,
          is_closed: h.is_closed,
          morning_open: h.morning_open || '09:00',
          morning_close: h.morning_close || '14:00',
          afternoon_open: h.afternoon_open || '17:00',
          afternoon_close: h.afternoon_close || '21:00',
          has_split_schedule: h.afternoon_open !== null
        })))
      } else {
        setSchedules(DIAS_SEMANA.map((_, index) => ({
          day_of_week: index,
          is_closed: index === 6,
          morning_open: '09:00',
          morning_close: '14:00',
          afternoon_open: '17:00',
          afternoon_close: '21:00',
          has_split_schedule: true
        })))
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const diasAbiertos = schedules.filter(s => !s.is_closed)
      if (diasAbiertos.length === 0) {
        setMessage({ type: 'error', text: 'Debe tener al menos un día abierto' })
        setSaving(false)
        return
      }

      for (const schedule of schedules) {
        if (!schedule.is_closed) {
          if (!schedule.morning_open || !schedule.morning_close) {
            setMessage({ type: 'error', text: `Faltan horarios en ${DIAS_SEMANA[schedule.day_of_week]}` })
            setSaving(false)
            return
          }

          if (schedule.has_split_schedule && (!schedule.afternoon_open || !schedule.afternoon_close)) {
            setMessage({ type: 'error', text: `Horario de tarde incompleto en ${DIAS_SEMANA[schedule.day_of_week]}` })
            setSaving(false)
            return
          }
        }
      }

      const response = await fetch('/api/business-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: schedules.map(s => ({
            day_of_week: s.day_of_week,
            is_closed: s.is_closed,
            morning_open: s.is_closed ? null : s.morning_open,
            morning_close: s.is_closed ? null : s.morning_close,
            afternoon_open: s.is_closed || !s.has_split_schedule ? null : s.afternoon_open,
            afternoon_close: s.is_closed || !s.has_split_schedule ? null : s.afternoon_close
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar')
      }

      setMessage({ type: 'success', text: 'Horarios guardados correctamente' })
      
      if (onSaved) {
        setTimeout(() => onSaved(), 1500)
      }

    } catch (error) {
      console.error('Error al guardar horarios:', error)
      setMessage({ type: 'error', text: 'Error al guardar horarios' })
    } finally {
      setSaving(false)
    }
  }

  const updateSchedule = (index: number, field: keyof DaySchedule, value: any) => {
    setSchedules(prev => prev.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    ))
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#d98c21] animate-pulse" />
          <p className="text-white">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-[#d98c21]" />
          <div>
            <h3 className="text-xl font-bold text-white">Horario Comercial</h3>
            <p className="text-sm text-gray-400">Configura tus horarios de apertura para análisis precisos</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`
          mb-6 p-4 rounded-lg border-2 flex items-center gap-3
          ${message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          {message.type === 'success' 
            ? <CheckCircle2 className="w-5 h-5" />
            : <AlertCircle className="w-5 h-5" />
          }
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="space-y-4">
        {schedules.map((schedule, index) => (
          <div
            key={schedule.day_of_week}
            className={`
              bg-[#262626] rounded-lg p-4 border
              ${schedule.is_closed ? 'border-gray-700 opacity-60' : 'border-gray-600'}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="w-28 flex-shrink-0">
                <p className="text-white font-semibold mb-2">{DIAS_SEMANA[schedule.day_of_week]}</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.is_closed}
                    onChange={(e) => updateSchedule(index, 'is_closed', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-500 text-[#d98c21] focus:ring-[#d98c21]"
                  />
                  <span className="text-sm text-gray-400">Cerrado</span>
                </label>
              </div>

              {!schedule.is_closed && (
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.morning_open}
                        onChange={(e) => updateSchedule(index, 'morning_open', e.target.value)}
                        className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-600 focus:border-[#d98c21] focus:ring-1 focus:ring-[#d98c21]"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={schedule.morning_close}
                        onChange={(e) => updateSchedule(index, 'morning_close', e.target.value)}
                        className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-600 focus:border-[#d98c21] focus:ring-1 focus:ring-[#d98c21]"
                      />
                    </div>

                    {!schedule.has_split_schedule && (
                      <span className="text-sm text-gray-400">(Horario continuo)</span>
                    )}
                  </div>

                  {schedule.has_split_schedule && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={schedule.afternoon_open}
                          onChange={(e) => updateSchedule(index, 'afternoon_open', e.target.value)}
                          className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-600 focus:border-[#d98c21] focus:ring-1 focus:ring-[#d98c21]"
                        />
                        <span className="text-gray-500">a</span>
                        <input
                          type="time"
                          value={schedule.afternoon_close}
                          onChange={(e) => updateSchedule(index, 'afternoon_close', e.target.value)}
                          className="px-3 py-2 bg-[#1a1a1a] text-white rounded-lg border border-gray-600 focus:border-[#d98c21] focus:ring-1 focus:ring-[#d98c21]"
                        />
                      </div>
                      <span className="text-sm text-gray-400">(Turno tarde)</span>
                    </div>
                  )}

                  <button
                    onClick={() => updateSchedule(index, 'has_split_schedule', !schedule.has_split_schedule)}
                    className="text-sm text-[#d98c21] hover:text-[#f4a340] font-medium"
                  >
                    {schedule.has_split_schedule 
                      ? '✕ Quitar turno partido' 
                      : '+ Añadir turno partido (cierre mediodía)'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="
            px-6 py-3 bg-[#d98c21] text-white font-semibold rounded-lg
            hover:bg-[#c27d1e] disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-2 transition-colors
          "
        >
          {saving ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Horarios
            </>
          )}
        </button>
      </div>
    </div>
  )
}