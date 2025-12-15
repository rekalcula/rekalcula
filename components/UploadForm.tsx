'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UploadForm() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/')
    )
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    } else {
      alert('Solo se permiten archivos PDF o imágenes (PNG, JPG, JPEG)')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      alert('Por favor selecciona al menos un archivo')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const totalFiles = files.length
      let completedFiles = 0

      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/process-invoice', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al procesar archivo')
        }

        completedFiles++
        setProgress(Math.round((completedFiles / totalFiles) * 100))
      }

      // Redirigir al dashboard
      router.push('/dashboard/invoices')
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al subir archivos')
      setUploading(false)
      setProgress(0)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return '📄'
    if (file.type.startsWith('image/')) return '🖼️'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Zona de Drop */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <div className="text-6xl mb-4">📤</div>
        <p className="text-lg font-semibold text-gray-900 mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Soporta: PDF, PNG, JPG, JPEG
        </p>
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf,image/png,image/jpeg,image/jpg"
          multiple
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Seleccionar Archivos
        </label>
      </div>

      {/* Lista de archivos seleccionados */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Archivos seleccionados ({files.length})
          </h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{getFileIcon(file)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de progreso */}
      {uploading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Procesando archivos...
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Por favor espera, esto puede tomar unos momentos...
          </p>
        </div>
      )}

      {/* Botón de enviar */}
      <button
        type="submit"
        disabled={files.length === 0 || uploading}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors
          ${files.length === 0 || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {uploading 
          ? `Procesando ${files.length} archivo${files.length > 1 ? 's' : ''}...` 
          : `Subir ${files.length > 0 ? files.length : ''} Archivo${files.length > 1 ? 's' : files.length === 1 ? '' : 's'}`
        }
      </button>
    </form>
  )
}