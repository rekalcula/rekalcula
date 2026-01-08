'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { IconCamera, IconFolder, IconFolderOpen, IconCheckCircle, IconDocument, IconTarget, IconTrash, IconInfoCircle, IconLoader, IconRocket, IconZap, IconMoney, IconCalendar, IconXCircle, IconBarChart } from './Icons'
import PaymentMethodModal, { PaymentData } from './PaymentMethodModal'

// Extender tipos de input para soportar webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string
    directory?: string
  }
}

interface FileWithPreview {
  file: File
  preview: string
  selected: boolean
  id: string
}

export default function UploadInvoiceTicket() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [mode, setMode] = useState<'select' | 'folder' | null>(null)

  // ⭐ NUEVO: Estados para el modal de forma de pago
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingInvoice, setPendingInvoice] = useState<any>(null)
  const [paymentResolve, setPaymentResolve] = useState<((value: boolean) => void) | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const loadFiles = async (fileList: FileList | File[], autoSelect: boolean = false) => {
    const newFiles: FileWithPreview[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        continue
      }

      let preview = ''
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file)
      } else if (file.type === 'application/pdf') {
        preview = 'pdf'
      }
      
      newFiles.push({
        file,
        preview,
        selected: autoSelect,
        id: `${file.name}-${Date.now()}-${i}`
      })
    }

    setFiles(newFiles)
    setError(null)
  }

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files) {
      setMode('folder')
      loadFiles(e.target.files, true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files) {
      setMode('select')
      loadFiles(e.target.files, true)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      setMode('select')
      loadFiles(e.dataTransfer.files, true)
    }
  }, [])

  const toggleFileSelection = (id: string) => {
    setFiles(prev =>
      prev.map(f => f.id === id ? { ...f, selected: !f.selected } : f)
    )
  }

  const toggleAll = () => {
    const allSelected = files.every(f => f.selected)
    setFiles(prev => prev.map(f => ({ ...f, selected: !allSelected })))
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview && file.preview !== 'pdf') {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const clearAll = () => {
    files.forEach(f => {
      if (f.preview && f.preview !== 'pdf') {
        URL.revokeObjectURL(f.preview)
      }
    })
    setFiles([])
    setResults([])
    setError(null)
    setSuccess(null)
    setMode(null)
  }

  // ⭐ NUEVO: Función para esperar confirmación de pago
  const waitForPaymentConfirmation = (invoice: any): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingInvoice(invoice)
      setIsModalOpen(true)
      setPaymentResolve(() => resolve)
    })
  }

  // ⭐ NUEVO: Función para confirmar forma de pago
  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    if (!pendingInvoice) return

    try {
      // Actualizar la factura con la forma de pago
      const response = await fetch('/api/invoices/payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: pendingInvoice.id,
          paymentMethod: paymentData.paymentMethod,
          paymentTerms: paymentData.paymentTerms,
          paymentDueDate: paymentData.paymentDueDate
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar forma de pago')
      }

      // ✅ Forma de pago confirmada
      console.log('✅ Forma de pago confirmada para factura:', pendingInvoice.id)

      // Cerrar modal
      setIsModalOpen(false)
      setPendingInvoice(null)

      // Resolver la promesa para continuar con el siguiente archivo
      if (paymentResolve) {
        paymentResolve(true)
        setPaymentResolve(null)
      }

    } catch (err) {
      console.error('Error confirmando pago:', err)
      throw err // Propagar error al modal
    }
  }

  // ⭐ MODIFICADO: Función para cerrar modal (cancelar)
  const handleModalClose = () => {
    setIsModalOpen(false)
    setPendingInvoice(null)
    
    // Resolver con false para indicar cancelación
    if (paymentResolve) {
      paymentResolve(false)
      setPaymentResolve(null)
    }
  }

  const processFiles = async () => {
    const filesToProcess = mode === 'folder'
      ? files
      : files.filter(f => f.selected)

    if (filesToProcess.length === 0) {
      setError('No hay archivos para procesar')
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)
    setResults([])

    let successCount = 0
    let errorCount = 0
    const newResults: any[] = []

    for (let i = 0; i < filesToProcess.length; i++) {
      const fileItem = filesToProcess[i]
      
      try {
        const formData = new FormData()
        formData.append('file', fileItem.file)

        const response = await fetch('/api/process-invoice', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al procesar la factura')
        }

        // ⭐ NUEVO: Verificar si requiere confirmación de forma de pago
        if (data.requiresPaymentConfirmation && data.data?.invoice) {
          console.log('⚠️ Requiere confirmación de forma de pago')
          
          // Abrir modal y esperar confirmación
          const confirmed = await waitForPaymentConfirmation(data.data.invoice)
          
          if (!confirmed) {
            // Usuario canceló
            throw new Error('Confirmación de forma de pago cancelada')
          }
        }

        // Guardar resultado exitoso
        newResults.push({
          fileName: fileItem.file.name,
          success: true,
          data: data.data?.invoice
        })
        successCount++

      } catch (err: any) {
        newResults.push({
          fileName: fileItem.file.name,
          success: false,
          error: err.message
        })
        errorCount++
      }

      setResults([...newResults])
    }

    setProcessing(false)

    if (successCount > 0) {
      setSuccess(`${successCount} factura(s) procesada(s) correctamente`)

      setTimeout(() => {
        router.refresh()
      }, 3000)
    }

    if (errorCount > 0) {
      setError(`${errorCount} factura(s) con errores`)
    }
  }

  const selectedCount = files.filter(f => f.selected).length

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#FFFCFF] mb-4 flex items-center gap-2">
          <IconCamera size={24} color="#FFFCFF" />
          Subir Facturas de Compra
        </h3>

        {files.length === 0 && (
          <div className="space-y-4">
            <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50">
              <div className="flex items-start gap-4">
                <IconFolder size={40} color="#2563EB" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2">
                    Opción 1: Cargar carpeta completa
                  </h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Sube una carpeta con todas tus facturas. Se analizarán automáticamente TODOS los archivos.
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer transition-colors">   
                    <IconFolderOpen size={20} color="#FFFFFF" />
                    Seleccionar Carpeta Completa
                    <input
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFolderUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50">
              <div className="flex items-start gap-4">
                <IconCheckCircle size={40} color="#16A34A" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">
                    Opción 2: Seleccionar archivos manualmente
                  </h4>
                  <p className="text-sm text-green-700 mb-4">
                    Elige específicamente qué facturas quieres analizar. Puedes seleccionar múltiples archivos.
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold cursor-pointer transition-colors"> 
                    <IconDocument size={20} color="#FFFFFF" />
                    Seleccionar Archivos
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <IconTarget size={40} color="#9CA3AF" className="mx-auto mb-3" />
              <p className="text-[#ACACAC] mb-2">
                O arrastra archivos aquí
              </p>
              <p className="text-sm text-gray-400">
                JPG, PNG, PDF
              </p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-lg font-semibold text-[#FFFCFF] flex items-center gap-2">
                    {mode === 'folder' ? (
                      <>
                        <IconFolder size={20} color="#3B82F6" />
                        Carpeta cargada
                      </>
                    ) : (
                      <>
                        <IconCheckCircle size={20} color="#10B981" />
                        Archivos seleccionados
                      </>
                    )}
                  </h4>
                  <p className="text-sm text-[#ACACAC]">
                    {files.length} archivo(s) encontrado(s)
                    {mode === 'select' && ` - ${selectedCount} seleccionado(s)`}
                  </p>
                </div>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <IconTrash size={18} />
                  Cancelar
                </button>
              </div>

              {mode === 'folder' && (
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mt-3 flex items-center gap-2">
                  <IconInfoCircle size={18} color="#1D4ED8" />
                  <p className="text-sm text-blue-800">
                    Modo carpeta completa: Se procesarán automáticamente TODOS los {files.length} archivos
                  </p>
                </div>
              )}

              {mode === 'select' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={toggleAll}
                    className="px-3 py-1 text-sm bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#FFFCFF] rounded-lg transition-colors"
                  >
                    {files.every(f => f.selected) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={`relative border-2 rounded-lg p-2 transition-all ${
                    mode === 'folder'
                      ? 'border-blue-400 bg-blue-50'
                      : fileItem.selected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {mode === 'select' && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 z-10 text-xs"
                    >
                      ×
                    </button>
                  )}

                  <div>
                    {fileItem.preview === 'pdf' ? (
                      <div className="aspect-square bg-red-100 rounded flex items-center justify-center">
                        <IconDocument size={32} color="#EF4444" />
                      </div>
                    ) : (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-full aspect-square object-cover rounded"
                      />
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      {mode === 'select' && (
                        <input
                          type="checkbox"
                          checked={fileItem.selected}
                          onChange={() => toggleFileSelection(fileItem.id)}
                          className="w-4 h-4"
                        />
                      )}
                      <p className="text-xs text-[#ACACAC] truncate flex-1" title={fileItem.file.name}>
                        {fileItem.file.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={processFiles}
                disabled={processing || (mode === 'select' && selectedCount === 0)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 disabled:hover:scale-100 inline-flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <IconLoader size={24} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <IconRocket size={24} />
                    {mode === 'folder'
                      ? `Procesar TODOS los ${files.length} archivos`
                      : `Procesar ${selectedCount} archivo(s) seleccionado(s)`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {processing && (
          <div className="mt-4">
            <div className="w-full bg-[#3d3d3d] rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(results.length / (mode === 'folder' ? files.length : selectedCount)) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-sm text-[#ACACAC] text-center mt-2 font-semibold flex items-center justify-center gap-2">
              <IconZap size={16} color="#FBBF24" />
              Procesando {results.length} de {mode === 'folder' ? files.length : selectedCount}...
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
            <h4 className="text-md font-semibold text-[#FFFCFF] mb-3 flex items-center gap-2">
              <IconBarChart size={20} color="#FFFCFF" />
              Resultados:
            </h4>
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border-l-4 ${
                  result.success
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-semibold flex items-center gap-1 ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? <IconCheckCircle size={16} color="#16A34A" /> : <IconXCircle size={16} color="#DC2626" />}
                      {result.fileName}
                    </p>
                    {result.success && result.data && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-2">
                        <IconMoney size={14} /> Total: €{result.data.total_amount?.toFixed(2) || '0.00'}
                        <IconCalendar size={14} className="ml-2" /> {result.data.invoice_date || 'N/A'}
                      </p>
                    )}
                    {!result.success && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !processing && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 font-semibold flex items-center gap-2">
              <IconXCircle size={20} color="#DC2626" />
              {error}
            </p>
          </div>
        )}

        {success && !processing && (
          <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-700 font-semibold flex items-center gap-2">
              <IconCheckCircle size={20} color="#16A34A" />
              {success}
            </p>
            <p className="text-sm text-green-600 mt-1">
              Redirigiendo al listado de facturas...
            </p>
          </div>
        )}
      </div>

      {/* ⭐ NUEVO: Modal de forma de pago */}
      {pendingInvoice && (
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handlePaymentConfirm}
          invoiceData={{
            supplierName: pendingInvoice.supplier_name || 'Proveedor',
            totalAmount: pendingInvoice.total_amount || 0,
            invoiceDate: pendingInvoice.invoice_date || new Date().toISOString().split('T')[0]
          }}
        />
      )}
    </>
  )
}