'use client'

import { useState, useEffect } from 'react'

interface SignedImageProps {
  filePath: string
  alt: string
  className?: string
}

export default function SignedImage({ filePath, alt, className }: SignedImageProps) {
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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath }),
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
      <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Cargando...</span>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Error al cargar imagen</span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
    />
  )
}