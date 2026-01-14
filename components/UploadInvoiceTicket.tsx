'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { IconCamera, IconFolder, IconFolderOpen, IconCheckCircle, IconDocument, IconTarget, IconTrash, IconInfoCircle, IconLoader, IconRocket, IconZap, IconMoney, IconCalendar, IconXCircle, IconBarChart, IconPlus } from './Icons'
import PaymentMethodModal, { PaymentData } from './PaymentMethodModal'

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

// Datos pendientes de una factura analizada pero no guardada
interface PendingInvoiceData {
  analysis: any
  fileData: {
    filePath: string
    fileName: string
    fileSize: number
  }
  originalFile: File
}

// ⭐ NUEVO: Interface para factura manual
interface ManualInvoiceForm {
  supplier: string
  total_amount: string
  invoice_date: string
  category: string
  include_vat: boolean
  vat_rate: string
}

const CATEGORIES = [
  'Productos',
  'Servicios',
  'Materiales',
  'Suministros',
  'Alquiler',
  'Mantenimiento',
  'Marketing',
  'Transporte',
  'Otros'
]

export default function UploadInvoiceTicket() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [mode, setMode] = useState<'select' | 'folder' | null>(null)

  // ⭐ Estados para el flujo de 2 pasos
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingInvoiceData, setPendingInvoiceData] = useState<PendingInvoiceData | null>(null)
  const [paymentResolve, setPaymentResolve] = useState<((value: PaymentData | null) => void) | null>(null)

  // ⭐ NUEVO: Estados para factura manual
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState<ManualInvoiceForm>({
    supplier: '',
    total_amount: '',
    invoice_date: new Date().toISOString().split('T')[0],
    category: 'Productos',
    include_vat: true,
    vat_rate: '21'
  })
  const [manualFormError, setManualFormError] = useState<string | null>(null)
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)

  // ⭐ NUEVO: Modal para forma de pago de factura manual
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false)
  const [pendingManualData, setPendingManualData] = useState<any>(null)

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
    setShowManualForm(false)
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

  // ⭐ PASO 1: Esperar que el usuario seleccione forma de pago
  const waitForPaymentSelection = (pendingData: PendingInvoiceData): Promise<PaymentData | null> => {
    return new Promise((resolve) => {
      setPendingInvoiceData(pendingData)
      setIsModalOpen(true)
      setPaymentResolve(() => resolve)
    })
  }

  // ⭐ PASO 2: Guardar factura con forma de pago
  const saveInvoiceWithPayment = async (
    pendingData: PendingInvoiceData, 
    paymentData: PaymentData
  ): Promise<any> => {
    const response = await fetch('/api/save-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis: pendingData.analysis,
        fileData: pendingData.fileData,
        paymentMethod: paymentData.paymentMethod,
        paymentTerms: paymentData.paymentTerms,
        paymentDueDate: paymentData.paymentDueDate
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar la factura')
    }

    return data
  }

  // ⭐ Handler cuando el usuario confirma la forma de pago
  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    if (!pendingInvoiceData) return

    try {
      // Guardar la factura con la forma de pago
      await saveInvoiceWithPayment(pendingInvoiceData, paymentData)
      
      console.log('✅ Factura guardada con forma de pago:', paymentData.paymentMethod)

      // Cerrar modal
      setIsModalOpen(false)
      setPendingInvoiceData(null)

      // Resolver la promesa para continuar
      if (paymentResolve) {
        paymentResolve(paymentData)
        setPaymentResolve(null)
      }

    } catch (err) {
      console.error('Error guardando factura:', err)
      throw err
    }
  }

  // ⭐ Handler para cerrar modal
  const handleModalClose = () => {
    setIsModalOpen(false)
    setPendingInvoiceData(null)
    
    if (paymentResolve) {
      paymentResolve(null)
      setPaymentResolve(null)
    }
  }

  // ⭐ PROCESO PRINCIPAL
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
        // PASO 1: ANALIZAR (sin guardar)
        const formData = new FormData()
        formData.append('file', fileItem.file)

        const analyzeResponse = await fetch('/api/analyze-invoice', {
          method: 'POST',
          body: formData
        })

        const analyzeData = await analyzeResponse.json()

        if (!analyzeResponse.ok) {
          throw new Error(analyzeData.error || 'Error al analizar la factura')
        }

        // PASO 2: PEDIR FORMA DE PAGO (OBLIGATORIO)
        const pendingData: PendingInvoiceData = {
          analysis: analyzeData.analysis,
          fileData: analyzeData.fileData,
          originalFile: fileItem.file
        }

        const paymentData = await waitForPaymentSelection(pendingData)

        if (!paymentData) {
          throw new Error('Debes seleccionar una forma de pago para guardar la factura')
        }
        
        newResults.push({
          fileName: fileItem.file.name,
          success: true,
          data: {
            total_amount: analyzeData.analysis.total_amount,
            invoice_date: analyzeData.analysis.invoice_date,
            payment_method: paymentData.paymentMethod
          }
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
      setSuccess(`✅ ${successCount} factura(s) procesada(s) correctamente. Redirigiendo...`)

      setTimeout(() => {
        window.location.href = '/dashboard/invoices'  // ✅ Redirección forzada
      }, 2000)
    }

    if (errorCount > 0 && successCount === 0) {
      setError(`${errorCount} factura(s) con errores`)
    }
  }

  // ========================================
  // ⭐ NUEVO: Funciones para factura manual
  // ========================================

  const handleManualFormChange = (field: keyof ManualInvoiceForm, value: string | boolean) => {
    setManualForm(prev => ({ ...prev, [field]: value }))
    setManualFormError(null)
  }

  const validateManualForm = (): boolean => {
    if (!manualForm.supplier.trim()) {
      setManualFormError('El proveedor es obligatorio')
      return false
    }
    if (!manualForm.total_amount || parseFloat(manualForm.total_amount) <= 0) {
      setManualFormError('El importe debe ser mayor a 0')
      return false
    }
    if (!manualForm.invoice_date) {
      setManualFormError('La fecha es obligatoria')
      return false
    }
    return true
  }

  const handleManualSubmit = async () => {
    if (!validateManualForm()) return

    // Calcular base imponible si incluye IVA
    const inputAmount = parseFloat(manualForm.total_amount)
    const vatRate = parseFloat(manualForm.vat_rate) / 100

    let baseAmount: number
    let taxAmount: number

    if (manualForm.include_vat) {
      baseAmount = inputAmount / (1 + vatRate)
      taxAmount = inputAmount - baseAmount
    } else {
      baseAmount = inputAmount
      taxAmount = 0
    }

    // Preparar datos para el modal de pago
    setPendingManualData({
      supplier: manualForm.supplier,
      total_amount: inputAmount,
      base_amount: Math.round(baseAmount * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      invoice_date: manualForm.invoice_date,
      category: manualForm.category,
      include_vat: manualForm.include_vat
    })

    setIsManualPaymentModalOpen(true)
  }

  const handleManualPaymentConfirm = async (paymentData: PaymentData) => {
    if (!pendingManualData) return

    setIsSubmittingManual(true)

    try {
      const response = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: {
            supplier: pendingManualData.supplier,
            total_amount: pendingManualData.total_amount,
            base_amount: pendingManualData.base_amount,
            tax_amount: pendingManualData.tax_amount,
            invoice_date: pendingManualData.invoice_date,
            category: pendingManualData.category,
            items: [],
            analysis: { insights: [], savings_opportunities: [], recommendations: [] }
          },
          fileData: {
            filePath: `manual/${Date.now()}-manual`,
            fileName: `Factura_Manual_${pendingManualData.supplier}`,
            fileSize: 0
          },
          paymentMethod: paymentData.paymentMethod,
          paymentTerms: paymentData.paymentTerms,
          paymentDueDate: paymentData.paymentDueDate,
          includeVat: pendingManualData.include_vat
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la factura')
      }

      setIsManualPaymentModalOpen(false)
      setPendingManualData(null)
      setSuccess('Factura manual guardada correctamente')
      setManualForm({
        supplier: '',
        total_amount: '',
        invoice_date: new Date().toISOString().split('T')[0],
        category: 'Productos',
        include_vat: true,
        vat_rate: '21'
      })
      setShowManualForm(false)

    setTimeout(() => {
      window.location.href = '/dashboard/invoices'  // ✅
    }, 2000)

    } catch (err: any) {
      setManualFormError(err.message)
    } finally {
      setIsSubmittingManual(false)
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

        {files.length === 0 && !showManualForm && (
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

            {/* ⭐ NUEVO: Opción 3 - Añadir manualmente */}
            <div className="border-2 border-[#d98c21] rounded-xl p-6 bg-[#d98c21]/10">
              <div className="flex items-start gap-4">
                <IconPlus size={40} color="#d98c21" />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-[#d98c21] mb-2">
                    Opción 3: Añadir factura manualmente
                  </h4>
                  <p className="text-sm text-[#ACACAC] mb-4">
                    Introduce los datos de la factura sin necesidad de subir un archivo.
                  </p>
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#d98c21] hover:bg-[#c17a1a] text-white rounded-lg font-semibold transition-colors"
                  >
                    <IconPlus size={20} color="#FFFFFF" />
                    Añadir Factura Manual
                  </button>
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

        {/* ⭐ NUEVO: Formulario manual */}
        {showManualForm && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-[#d98c21]">Añadir Factura Manualmente</h4>
              <button
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proveedor */}
              <div className="md:col-span-2">
                <label className="block text-[#FFFCFF] font-medium mb-2">
                  Proveedor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={manualForm.supplier}
                  onChange={(e) => handleManualFormChange('supplier', e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d98c21]"
                />
              </div>

              {/* Importe */}
              <div>
                <label className="block text-[#FFFCFF] font-medium mb-2">
                  Importe (€) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualForm.total_amount}
                  onChange={(e) => handleManualFormChange('total_amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d98c21]"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-[#FFFCFF] font-medium mb-2">
                  Fecha de factura <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={manualForm.invoice_date}
                  onChange={(e) => handleManualFormChange('invoice_date', e.target.value)}
                  className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d98c21]"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-[#FFFCFF] font-medium mb-2">
                  Categoría
                </label>
                <select
                  value={manualForm.category}
                  onChange={(e) => handleManualFormChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d98c21]"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Tipo IVA */}
              <div>
                <label className="block text-[#FFFCFF] font-medium mb-2">
                  Tipo de IVA
                </label>
                <select
                  value={manualForm.vat_rate}
                  onChange={(e) => handleManualFormChange('vat_rate', e.target.value)}
                  className="w-full px-4 py-3 bg-[#262626] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#d98c21]"
                >
                  <option value="21">21% (General)</option>
                  <option value="10">10% (Reducido)</option>
                  <option value="4">4% (Superreducido)</option>
                  <option value="0">0% (Exento)</option>
                </select>
              </div>

              {/* ⭐ Checkbox IVA incluido */}
              <div className="md:col-span-2">
                <div className="bg-[#262626] border border-gray-700 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualForm.include_vat}
                      onChange={(e) => handleManualFormChange('include_vat', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 text-[#d98c21] focus:ring-[#d98c21]"
                    />
                    <div>
                      <span className="text-[#FFFCFF] font-medium">¿El importe incluye IVA?</span>
                      <p className="text-sm text-gray-400 mt-1">
                        {manualForm.include_vat 
                          ? `El importe introducido INCLUYE el ${manualForm.vat_rate}% de IVA. Se calculará automáticamente la base imponible.`
                          : 'El importe introducido es la BASE IMPONIBLE (sin IVA).'
                        }
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview de cálculo */}
              {manualForm.total_amount && parseFloat(manualForm.total_amount) > 0 && (
                <div className="md:col-span-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 text-sm font-medium mb-2">📊 Resumen contable:</p>
                  {manualForm.include_vat ? (
                    <>
                      <p className="text-white">
                        Importe introducido (con IVA): <strong>€{parseFloat(manualForm.total_amount).toFixed(2)}</strong>
                      </p>
                      <p className="text-green-400">
                        Base imponible (contable): <strong>€{(parseFloat(manualForm.total_amount) / (1 + parseFloat(manualForm.vat_rate) / 100)).toFixed(2)}</strong>
                      </p>
                      <p className="text-gray-400">
                        IVA ({manualForm.vat_rate}%): €{(parseFloat(manualForm.total_amount) - parseFloat(manualForm.total_amount) / (1 + parseFloat(manualForm.vat_rate) / 100)).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-green-400">
                      Base imponible (contable): <strong>€{parseFloat(manualForm.total_amount).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {manualFormError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{manualFormError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleManualSubmit}
                disabled={isSubmittingManual}
                className="px-8 py-3 bg-[#d98c21] hover:bg-[#c17a1a] disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                {isSubmittingManual ? 'Guardando...' : 'Continuar →'}
              </button>
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

              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mt-3 flex items-center gap-2">
                <IconInfoCircle size={18} color="#D97706" />
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Para cada factura deberás seleccionar la forma de pago antes de guardarla.
                </p>
              </div>

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

      {/* Modal de forma de pago para archivos */}
      {pendingInvoiceData && (
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handlePaymentConfirm}
          invoiceData={{
            supplierName: pendingInvoiceData.analysis.supplier || 'Proveedor',
            totalAmount: pendingInvoiceData.analysis.total_amount || 0,
            invoiceDate: pendingInvoiceData.analysis.invoice_date || new Date().toISOString().split('T')[0]
          }}
        />
      )}

      {/* Modal de forma de pago para factura manual */}
      {pendingManualData && (
        <PaymentMethodModal
          isOpen={isManualPaymentModalOpen}
          onClose={() => {
            setIsManualPaymentModalOpen(false)
            setPendingManualData(null)
          }}
          onConfirm={handleManualPaymentConfirm}
          invoiceData={{
            supplierName: pendingManualData.supplier,
            totalAmount: pendingManualData.base_amount,
            invoiceDate: pendingManualData.invoice_date
          }}
        />
      )}
    </>
  )
}