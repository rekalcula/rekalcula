'use client'

import { useState, useEffect } from 'react'
import type { FiscalConfig, TipoEntidad, RegimenFiscal, TipoIVA } from '@/lib/fiscal/types'

export default function FiscalPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [config, setConfig] = useState<FiscalConfig>({
    tipo_entidad: 'autonomo',
    regimen_fiscal: 'general',
    retencion_irpf: 15.00,
    tipo_iva: 'general',
    porcentaje_iva: 21.00,
    tipo_impuesto_sociedades: 25.00,
    umbral_alerta_1: 40000.00,
    umbral_alerta_2: 1000000.00,
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch('/api/fiscal/config')
      const data = await response.json()
      
      if (data.success && data.config) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error cargando configuracion:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/fiscal/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Configuracion guardada')
      } else {
        alert('Error guardando')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error guardando')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 bg-[#262626] min-h-screen">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d98c21] mx-auto"></div>
          <p className="text-[#ACACAC] mt-4">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-[#262626] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#d98c21]">Configuracion Fiscal</h1>
        <p className="text-xl text-[#FFFCFF] mt-1">Optimiza tus impuestos</p>
      </div>

      <div className="bg-[#0d0d0d] rounded-xl p-6 space-y-6">
        
        <div>
          <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">Tipo de Entidad</label>
          <select
            value={config.tipo_entidad}
            onChange={(e) => setConfig({ ...config, tipo_entidad: e.target.value as TipoEntidad })}
            className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
          >
            <option value="autonomo">Autonomo</option>
            <option value="sl">SL</option>
            <option value="sa">SA</option>
          </select>
        </div>

        <div>
          <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">Regimen Fiscal</label>
          <select
            value={config.regimen_fiscal}
            onChange={(e) => setConfig({ ...config, regimen_fiscal: e.target.value as RegimenFiscal })}
            className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
          >
            <option value="general">General</option>
            <option value="simplificado">Simplificado</option>
            <option value="modulos">Modulos</option>
            <option value="recargo">Recargo</option>
          </select>
        </div>

        {config.tipo_entidad === 'autonomo' && (
          <div>
            <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">IRPF (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.retencion_irpf}
              onChange={(e) => setConfig({ ...config, retencion_irpf: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">Tipo IVA</label>
            <select
              value={config.tipo_iva}
              onChange={(e) => setConfig({ ...config, tipo_iva: e.target.value as TipoIVA })}
              className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
            >
              <option value="general">21%</option>
              <option value="reducido">10%</option>
              <option value="superreducido">4%</option>
              <option value="exento">Exento</option>
            </select>
          </div>

          <div>
            <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">% IVA</label>
            <input
              type="number"
              step="0.01"
              value={config.porcentaje_iva}
              onChange={(e) => setConfig({ ...config, porcentaje_iva: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
            />
          </div>
        </div>

        {(config.tipo_entidad === 'sl' || config.tipo_entidad === 'sa') && (
          <div>
            <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">Impuesto Sociedades (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.tipo_impuesto_sociedades}
              onChange={(e) => setConfig({ ...config, tipo_impuesto_sociedades: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
            />
          </div>
        )}

        <div className="border-t border-[#3d3d3d] pt-6">
          <h3 className="text-lg font-semibold text-[#d98c21] mb-4">Umbrales</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">Umbral 1</label>
              <input
                type="number"
                value={config.umbral_alerta_1}
                onChange={(e) => setConfig({ ...config, umbral_alerta_1: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
              />
            </div>
            <div>
              <label className="block text-[18px] font-medium text-[#ACACAC] mb-2">Umbral 2</label>
              <input
                type="number"
                value={config.umbral_alerta_2}
                onChange={(e) => setConfig({ ...config, umbral_alerta_2: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-[#262626] border border-[#3d3d3d] text-[#FFFCFF] rounded-lg focus:ring-2 focus:ring-[#d98c21]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={guardarConfiguracion}
            disabled={saving}
            className="px-6 py-3 bg-[#d98c21] text-[#0d0d0d] font-semibold rounded-lg hover:bg-[#b87619] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}