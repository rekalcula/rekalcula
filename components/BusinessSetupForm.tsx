'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BusinessType {
  id: string
  name: string
  icon: string
  description: string
}

interface BusinessConfig {
  id: string
  business_name: string
  business_type_id: string
  custom_business_type: string
  address: string
  phone: string
  email: string
  tax_id: string
}

interface Props {
  existingConfig: BusinessConfig | null
  businessTypes: BusinessType[]
}

export default function BusinessSetupForm({ existingConfig, businessTypes }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    business_name: existingConfig?.business_name || '',
    business_type_id: existingConfig?.business_type_id || '',
    custom_business_type: existingConfig?.custom_business_type || '',
    address: existingConfig?.address || '',
    phone: existingConfig?.phone || '',
    email: existingConfig?.email || '',
    tax_id: existingConfig?.tax_id || '',
    loadTemplates: !existingConfig // Solo cargar plantillas si es nuevo
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/business-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Error al guardar')

      router.push('/dashboard')
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const selectedType = businessTypes.find(t => t.id === formData.business_type_id)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Tipo de Negocio */}
      <div className="bg-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          ¿Qué tipo de negocio tienes?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData({ ...formData, business_type_id: type.id })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.business_type_id === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl block mb-2">{type.icon}</span>
              <span className="text-sm font-medium text-gray-900">{type.name}</span>
            </button>
          ))}
        </div>
        
        {selectedType?.name === 'Otro' && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Describe tu tipo de negocio"
              value={formData.custom_business_type}
              onChange={(e) => setFormData({ ...formData, custom_business_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Información del Negocio */}
      <div className="bg-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Información del Negocio
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del negocio *
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Ej: Cafetería El Rincón"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CIF / NIF
            </label>
            <input
              type="text"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="B12345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="612 345 678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@minegocio.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle Mayor, 1 - 28001 Madrid"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Cargar plantillas */}
      {!existingConfig && formData.business_type_id && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.loadTemplates}
              onChange={(e) => setFormData({ ...formData, loadTemplates: e.target.checked })}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-blue-900">
                Cargar productos/servicios de ejemplo
              </span>
              <p className="text-sm text-blue-700 mt-1">
                Te cargaremos una lista de productos típicos para {selectedType?.name} que podrás personalizar después.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Botón guardar */}
      <div className="flex justify-end space-x-4">
        <button
          type="submit"
          disabled={saving || !formData.business_name || !formData.business_type_id}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
            saving || !formData.business_name || !formData.business_type_id
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Guardando...' : existingConfig ? 'Actualizar' : 'Empezar →'}
        </button>
      </div>
    </form>
  )
}