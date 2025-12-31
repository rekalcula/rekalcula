'use client'

import { useState, useEffect } from 'react'

interface InvoiceImageViewerProps {
  filePath: string
  fileName: string
}

export default function InvoiceImageViewer({
  filePath,
  fileName
}: InvoiceImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        // Si es una URL completa antigua, usarla directamente
        if (filePath.startsWith('http')) {
          setImageUrl(filePath)
          setLoading(false)
          return
        }

        const response = await fetch('/api/signed-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filePath })
        })

        if (!response.ok) {
          throw new Error('Error obteniendo URL')
        }

        const data = await response.json()
        setImageUrl(data.signedUrl)
      } catch (err) {
        console.error('Error:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (filePath) {
      fetchSignedUrl()
    }
  }, [filePath])

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
        <span className="text-gray-500">Cargando imagen...</span>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-gray-500">Error al cargar imagen</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <img
          src={imageUrl}
          alt={fileName}
          className="w-full rounded-lg border border-gray-200"
        />
      </div>

      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Abrir en nueva pestaña
      </a>
    </div>
  )
}
