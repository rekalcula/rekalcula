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
    <div className="bg-[#1a1a1a] rounded-xl p-4 sm:p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <Clock className="w-6 h-6 text-[#d98c21] flex-shrink-0 mt-0.5 sm:mt-0" />
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white">Horario Comercial</h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Configura tus horarios de apertura para análisis precisos
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`
          mb-6 p-3 sm:p-4 rounded-lg border-2 flex items-start sm:items-center gap-3
          ${message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          {message.type === 'success' 
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />
          }
          <p className="font-medium text-sm sm:text-base">{message.text}</p>
        </div>
      )}

      {/* Schedules */}
      <div className="space-y-3 sm:space-y-4">
        {schedules.map((schedule, index) => (
          <div
            key={schedule.day_of_week}
            className={`
              bg-[#262626] rounded-lg p-3 sm:p-4 border
              ${schedule.is_closed ? 'border-gray-700 opacity-60' : 'border-gray-600'}
              transition-all
            `}
          >
            {/* Layout Responsive: Vertical en móvil, Horizontal en desktop */}
            <div className="schedule-container">
              {/* Day Header */}
              <div className="day-header">
                <p className="day-name">{DIAS_SEMANA[schedule.day_of_week]}</p>
                <label className="closed-checkbox">
                  <input
                    type="checkbox"
                    checked={schedule.is_closed}
                    onChange={(e) => updateSchedule(index, 'is_closed', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-500 text-[#d98c21] focus:ring-[#d98c21]"
                  />
                  <span className="text-sm text-gray-400">Cerrado</span>
                </label>
              </div>

              {/* Schedule Content */}
              {!schedule.is_closed && (
                <div className="schedule-content">
                  {/* Morning Schedule */}
                  <div className="time-row">
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={schedule.morning_open}
                        onChange={(e) => updateSchedule(index, 'morning_open', e.target.value)}
                        className="time-input"
                      />
                      <span className="time-separator">a</span>
                      <input
                        type="time"
                        value={schedule.morning_close}
                        onChange={(e) => updateSchedule(index, 'morning_close', e.target.value)}
                        className="time-input"
                      />
                    </div>

                    {!schedule.has_split_schedule && (
                      <span className="schedule-label">(Horario continuo)</span>
                    )}
                  </div>

                  {/* Afternoon Schedule */}
                  {schedule.has_split_schedule && (
                    <div className="time-row">
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={schedule.afternoon_open}
                          onChange={(e) => updateSchedule(index, 'afternoon_open', e.target.value)}
                          className="time-input"
                        />
                        <span className="time-separator">a</span>
                        <input
                          type="time"
                          value={schedule.afternoon_close}
                          onChange={(e) => updateSchedule(index, 'afternoon_close', e.target.value)}
                          className="time-input"
                        />
                      </div>
                      <span className="schedule-label">(Turno tarde)</span>
                    </div>
                  )}

                  {/* Toggle Split Schedule */}
                  <button
                    onClick={() => updateSchedule(index, 'has_split_schedule', !schedule.has_split_schedule)}
                    className="toggle-split-btn"
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

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="
            w-full sm:w-auto
            px-6 py-3 bg-[#d98c21] text-white font-semibold rounded-lg
            hover:bg-[#c27d1e] disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2 transition-colors
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

      <style jsx>{`
        /* ==================== LAYOUT BASE ==================== */
        .schedule-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
        }

        .day-name {
          color: white;
          font-weight: 600;
          font-size: 15px;
        }

        .closed-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .schedule-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ==================== TIME INPUTS ==================== */
        .time-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .time-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .time-input {
          flex: 1;
          min-width: 110px;
          padding: 10px 12px;
          background: #1a1a1a;
          color: white;
          border: 1px solid rgb(75, 85, 99);
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .time-input:focus {
          outline: none;
          border-color: #d98c21;
          ring: 1px;
          ring-color: #d98c21;
        }

        .time-separator {
          color: rgb(107, 114, 128);
          font-weight: 500;
          flex-shrink: 0;
        }

        .schedule-label {
          font-size: 13px;
          color: rgb(156, 163, 175);
          display: block;
        }

        /* ==================== TOGGLE BUTTON ==================== */
        .toggle-split-btn {
          font-size: 13px;
          color: #d98c21;
          font-weight: 500;
          text-align: left;
          padding: 4px 0;
          transition: color 0.2s;
        }

        .toggle-split-btn:hover {
          color: #f4a340;
        }

        /* ==================== MOBILE (< 640px) ==================== */
        @media (max-width: 639px) {
          .day-name {
            font-size: 14px;
          }

          .time-input {
            min-width: 100px;
            padding: 8px 10px;
            font-size: 14px;
          }

          .time-inputs {
            width: 100%;
          }

          .schedule-label {
            font-size: 12px;
            margin-top: 2px;
          }

          .toggle-split-btn {
            font-size: 12px;
          }
        }

        /* ==================== EXTRA SMALL (< 380px) ==================== */
        @media (max-width: 379px) {
          .time-inputs {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .time-input {
            width: 100%;
            min-width: 0;
          }

          .time-separator {
            display: none;
          }
        }

        /* ==================== TABLET+ (≥ 640px) ==================== */
        @media (min-width: 640px) {
          .schedule-container {
            flex-direction: row;
            align-items: flex-start;
            gap: 16px;
          }

          .day-header {
            flex-direction: column;
            align-items: flex-start;
            width: 140px;
            flex-shrink: 0;
            padding-bottom: 0;
            border-bottom: none;
            gap: 8px;
          }

          .day-name {
            font-size: 16px;
          }

          .schedule-content {
            flex: 1;
          }

          .time-row {
            flex-direction: row;
            align-items: center;
            gap: 12px;
          }

          .time-inputs {
            flex-wrap: nowrap;
          }

          .time-input {
            flex: 0 0 auto;
            width: auto;
            min-width: 90px;
          }

          .schedule-label {
            white-space: nowrap;
          }
        }

        /* ==================== DESKTOP (≥ 1024px) ==================== */
        @media (min-width: 1024px) {
          .day-header {
            width: 160px;
          }

          .time-input {
            min-width: 100px;
          }
        }
      `}</style>
    </div>
  )
}