'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadSalesForm() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const processFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/process-sales-ticket', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el ticket')
      }

      setSuccess(`✅ Venta registrada correctamente - Total: €${data.sale.total?.toFixed(2) || '0.00'}`)
      
      setTimeout(() => {
        router.push('/dashboard/sales')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Error al procesar el ticket')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  return (
    <div className="bg-gray-200 rounded-xl shadow-sm p-8">
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 font-medium">Procesando ticket con IA...</p>
            <p className="text-sm text-gray-400">Extrayendo fecha, productos y totales</p>
          </div>
        ) : (
          <>
            <span className="text-6xl block mb-4">🧾</span>
            <p className="text-xl font-medium text-gray-700 mb-2">
              Arrastra tu ticket aquí
            </p>
            <p className="text-gray-500 mb-4">
              o haz clic para seleccionar un archivo
            </p>
            <p className="text-sm text-gray-400">
              Formatos soportados: JPG, PNG, PDF
            </p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
          <p className="text-sm text-green-600 mt-1">Redirigiendo a la lista de ventas...</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">💡 La IA extraerá automáticamente:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>📅 Fecha y hora de la venta</li>
          <li>🛒 Productos o servicios vendidos</li>
          <li>💰 Cantidades y precios</li>
          <li>🧮 Subtotal, IVA y total</li>
          <li>💳 Método de pago</li>
        </ul>
      </div>
    </div>
  )
}