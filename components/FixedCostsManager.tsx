'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconMoney, IconTrash } from './Icons'
import ConfirmDialog from './ConfirmDialog'

// ========================================
// CATEGORÍAS PREDEFINIDAS (sin emojis)
// ========================================
const COST_CATEGORIES = [
  { id: 'local', name: 'Local / Hipoteca' },
  { id: 'seguros', name: 'Seguros' },
  { id: 'servicios', name: 'Servicios (Luz, Agua, Gas)' },
  { id: 'limpieza', name: 'Limpieza' },
  { id: 'financiero', name: 'Financiero' },
  { id: 'ayuntamiento', name: 'Ayuntamiento' },
  { id: 'material_oficina', name: 'Material de Oficina' },
  { id: 'personal', name: 'Personal' },
  { id: 'otros', name: 'Otros Gastos' }
]

const VAT_RATES = [
  { value: 21, label: '21% (General)' },
  { value: 10, label: '10% (Reducido)' },
  { value: 4, label: '4% (Superreducido)' },
  { value: 0, label: '0% (Exento)' }
]

interface FixedCost {
  id: string
  name: string
  description?: string
  amount: number
  base_amount?: number
  tax_amount?: number
  vat_rate?: number
  includes_vat?: boolean
  frequency: string
  category_id?: string
  cost_type?: string
  is_active: boolean
  is_payroll?: boolean
  payroll_data?: {
    salario_bruto: number
    base_irpf: number
    liquido_percibir: number
    ss_empresa: number
    ss_trabajador: number
    irpf: number
    nombre_empleado: string
  }
  fixed_cost_categories?: any
}

interface Props {
  initialCategories: any[]
  initialCosts: FixedCost[]
  hideAddButton?: boolean
  externalAddTrigger?: number
}

export default function FixedCostsManager({ 
  initialCategories, 
  initialCosts,
  hideAddButton = false,
  externalAddTrigger = 0
}: Props) {
  const router = useRouter()
  const [costs, setCosts] = useState(initialCosts)
  const [showAddCost, setShowAddCost] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [costToDelete, setCostToDelete] = useState<string | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    cost_type: '',
    name: '',
    amount: '',
    frequency: 'monthly',
    description: '',
    includes_vat: false,
    vat_rate: 21
  })

  // Estado para datos de nómina
  const [payrollData, setPayrollData] = useState({
    nombre_empleado: '',
    salario_bruto: '',
    base_irpf: '',
    liquido_percibir: '',
    ss_empresa: '',
    ss_trabajador: '',
    irpf: ''
  })

  // Cálculos de IVA
  const calculateVAT = () => {
    const amount = parseFloat(formData.amount) || 0
    const vatRate = formData.vat_rate / 100

    if (formData.includes_vat && amount > 0) {
      const base = amount / (1 + vatRate)
      const tax = amount - base
      return { base: Math.round(base * 100) / 100, tax: Math.round(tax * 100) / 100 }
    }
    return { base: amount, tax: 0 }
  }

  const vatCalc = calculateVAT()

  // Calcular coste total de empleado
  const calculatePayrollTotal = () => {
    const bruto = parseFloat(payrollData.salario_bruto) || 0
    const ssEmpresa = parseFloat(payrollData.ss_empresa) || (bruto * 0.30) // ~30% SS empresa
    return bruto + ssEmpresa
  }

  // Abrir formulario cuando se dispare el trigger externo
  useEffect(() => {
    if (externalAddTrigger > 0) {
      setShowAddCost(true)
    }
  }, [externalAddTrigger])

  // Auto-calcular SS empresa cuando cambia salario bruto
  useEffect(() => {
    if (payrollData.salario_bruto) {
      const bruto = parseFloat(payrollData.salario_bruto) || 0
      setPayrollData(prev => ({
        ...prev,
        ss_empresa: (bruto * 0.30).toFixed(2) // ~30% SS empresa
      }))
    }
  }, [payrollData.salario_bruto])

  const resetForm = () => {
    setFormData({
      cost_type: '',
      name: '',
      amount: '',
      frequency: 'monthly',
      description: '',
      includes_vat: false,
      vat_rate: 21
    })
    setPayrollData({
      nombre_empleado: '',
      salario_bruto: '',
      base_irpf: '',
      liquido_percibir: '',
      ss_empresa: '',
      ss_trabajador: '',
      irpf: ''
    })
  }

  const handleAddCost = async () => {
    const isPersonal = formData.cost_type === 'personal'
    
    if (!formData.cost_type) return
    if (isPersonal && !payrollData.salario_bruto) return
    if (!isPersonal && !formData.amount) return

    setSaving(true)

    try {
      const category = COST_CATEGORIES.find(c => c.id === formData.cost_type)
      
      let payload: any = {
        type: 'cost',
        cost_type: formData.cost_type,
        name: isPersonal 
          ? `Nómina: ${payrollData.nombre_empleado || 'Empleado'}`
          : (formData.name || category?.name || 'Coste fijo'),
        frequency: formData.frequency,
        description: formData.description
      }

      if (isPersonal) {
        // Coste de personal = Salario bruto + SS empresa
        const totalCost = calculatePayrollTotal()
        payload.amount = totalCost
        payload.base_amount = totalCost
        payload.tax_amount = 0
        payload.vat_rate = 0
        payload.includes_vat = false
        payload.is_payroll = true
        payload.payroll_data = {
          nombre_empleado: payrollData.nombre_empleado,
          salario_bruto: parseFloat(payrollData.salario_bruto) || 0,
          base_irpf: parseFloat(payrollData.base_irpf) || parseFloat(payrollData.salario_bruto) || 0,
          liquido_percibir: parseFloat(payrollData.liquido_percibir) || 0,
          ss_empresa: parseFloat(payrollData.ss_empresa) || 0,
          ss_trabajador: parseFloat(payrollData.ss_trabajador) || 0,
          irpf: parseFloat(payrollData.irpf) || 0
        }
      } else {
        // Coste normal con IVA
        payload.amount = vatCalc.base // Guardamos la BASE IMPONIBLE
        payload.base_amount = vatCalc.base
        payload.tax_amount = vatCalc.tax
        payload.vat_rate = formData.includes_vat ? formData.vat_rate : 0
        payload.includes_vat = formData.includes_vat
        payload.is_payroll = false
      }

      const response = await fetch('/api/fixed-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        router.refresh()
        resetForm()
        setShowAddCost(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCost = (id: string) => {
    // Almacenar ID y mostrar modal de confirmación
    setCostToDelete(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    if (!costToDelete) return
    
    setShowConfirmDialog(false)

    try {
      await fetch(`/api/fixed-costs?id=${costToDelete}`, { method: 'DELETE' })
      setCosts(costs.filter(c => c.id !== costToDelete))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el coste fijo')
    } finally {
      setCostToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowConfirmDialog(false)
    setCostToDelete(null)
  }

  const getMonthlyAmount = (cost: FixedCost) => {
    const base = cost.base_amount || cost.amount || 0
    if (cost.frequency === 'quarterly') return base / 3
    if (cost.frequency === 'yearly') return base / 12
    return base
  }

  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual'
  }

  // Agrupar costos por tipo
  const costsByType = costs.reduce((acc, cost) => {
    const type = cost.cost_type || 'otros'
    if (!acc[type]) acc[type] = []
    acc[type].push(cost)
    return acc
  }, {} as Record<string, FixedCost[]>)

  const isPersonalSelected = formData.cost_type === 'personal'

  return (
    <div className="space-y-6">
      {/* Botón añadir */}
      {!hideAddButton && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddCost(true)}
            className="bg-[#0d0d0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d2d2d]"
          >
            + Añadir Costo Fijo
          </button>
        </div>
      )}

      {/* Formulario nuevo costo */}
      {showAddCost && (
        <div className="bg-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">Nuevo Costo Fijo</h3>
          
          {/* Selector de categoría */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Gasto *
            </label>
            <select
              value={formData.cost_type}
              onChange={(e) => setFormData({ ...formData, cost_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              required
            >
              <option value="">Seleccionar tipo...</option>
              {COST_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Formulario PERSONAL (Nómina) */}
          {isPersonalSelected && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                Datos de Nómina
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Empleado
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: María García"
                    value={payrollData.nombre_empleado}
                    onChange={(e) => setPayrollData({ ...payrollData, nombre_empleado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Base de cotización */}
                <div className="bg-white p-3 rounded-lg border">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Salario Bruto (Base Cotización SS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={payrollData.salario_bruto}
                    onChange={(e) => setPayrollData({ ...payrollData, salario_bruto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Devengos salariales para calcular SS</p>
                </div>

                {/* Base de retención IRPF */}
                <div className="bg-white p-3 rounded-lg border">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Base de Retención (IRPF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={payrollData.salario_bruto || '0.00'}
                    value={payrollData.base_irpf}
                    onChange={(e) => setPayrollData({ ...payrollData, base_irpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Salario sujeto a IRPF</p>
                </div>

                {/* Líquido a percibir */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Líquido a Percibir (Neto)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={payrollData.liquido_percibir}
                    onChange={(e) => setPayrollData({ ...payrollData, liquido_percibir: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-green-600 mt-1">Importe neto que recibe el empleado</p>
                </div>

                {/* SS Empresa */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Seguridad Social Empresa (~30%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={payrollData.ss_empresa}
                    onChange={(e) => setPayrollData({ ...payrollData, ss_empresa: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-red-600 mt-1">Coste adicional para la empresa</p>
                </div>

                {/* SS Trabajador */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SS Trabajador (~6.35%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={payrollData.ss_trabajador}
                    onChange={(e) => setPayrollData({ ...payrollData, ss_trabajador: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* IRPF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retención IRPF
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={payrollData.irpf}
                    onChange={(e) => setPayrollData({ ...payrollData, irpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Resumen coste total */}
              {payrollData.salario_bruto && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium text-gray-700">Coste Total Empresa:</span>
                    <span className="font-bold text-red-600">
                      €{calculatePayrollTotal().toFixed(2)}/mes
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    = Salario Bruto (€{parseFloat(payrollData.salario_bruto || '0').toFixed(2)}) + SS Empresa (€{parseFloat(payrollData.ss_empresa || '0').toFixed(2)})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Formulario NORMAL (no Personal) */}
          {formData.cost_type && !isPersonalSelected && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder={COST_CATEGORIES.find(c => c.id === formData.cost_type)?.name || 'Ej: Alquiler local'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importe (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Notas adicionales..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/*  CASILLA DE IVA - PROMINENTE */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includes_vat}
                      onChange={(e) => setFormData({ ...formData, includes_vat: e.target.checked })}
                      className="w-6 h-6 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-base font-medium text-gray-800">
                      ¿El importe incluye IVA?
                    </span>
                  </label>

                  {formData.includes_vat && (
                    <select
                      value={formData.vat_rate}
                      onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) })}
                      className="px-4 py-2 border border-amber-300 rounded-lg bg-white text-sm font-medium"
                    >
                      {VAT_RATES.map(rate => (
                        <option key={rate.value} value={rate.value}>{rate.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Preview cálculo IVA */}
                {formData.includes_vat && formData.amount && (
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-sm text-amber-800 font-semibold mb-2"> Desglose fiscal:</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded p-2 text-center">
                        <span className="text-gray-500 block text-xs">Base imponible</span>
                        <span className="font-bold text-lg text-green-600">€{vatCalc.base.toFixed(2)}</span>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <span className="text-gray-500 block text-xs">IVA ({formData.vat_rate}%)</span>
                        <span className="font-bold text-lg text-blue-600">€{vatCalc.tax.toFixed(2)}</span>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <span className="text-gray-500 block text-xs">Total introducido</span>
                        <span className="font-bold text-lg text-gray-800">€{formData.amount}</span>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
                       Se contabilizará <strong>€{vatCalc.base.toFixed(2)}</strong> como gasto (base imponible)
                    </p>
                  </div>
                )}

                {!formData.includes_vat && formData.amount && (
                  <p className="text-xs text-gray-500 mt-2">
                    Se contabilizará €{formData.amount} como gasto (sin IVA)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => { setShowAddCost(false); resetForm(); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddCost}
              disabled={saving || !formData.cost_type || (!isPersonalSelected && !formData.amount) || (isPersonalSelected && !payrollData.salario_bruto)}
              className="px-6 py-2 bg-[#0d0d0d] text-white rounded-lg font-medium hover:bg-[#2d2d2d] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/*  COSTES OPERATIVOS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-orange-500">
          <h2 className="text-2xl font-bold text-white"> Costes Operativos (Grupo 62 PGC)</h2>
          <div className="text-xl font-bold text-orange-400">
            €{costs.filter(c => !c.is_payroll).reduce((sum, c) => sum + getMonthlyAmount(c), 0).toFixed(2)}/mes
          </div>
        </div>
        
        {COST_CATEGORIES.filter(cat => cat.id !== 'personal').map(category => {
          const categoryCosts = costs.filter(c => c.cost_type === category.id && !c.is_payroll)
          if (categoryCosts.length === 0) return null

          const categoryTotal = categoryCosts.reduce((sum, cost) => {
            return sum + getMonthlyAmount(cost)
          }, 0)

          return (
            <div key={category.id} className="bg-[#1a1a1a] rounded-xl border border-[#404040] overflow-hidden mb-4">
              <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#404040] flex justify-between items-center">
                <h3 className="font-semibold text-white text-[20px]">
                  {category.name}
                </h3>
                <span className="text-[20px] font-medium text-gray-400">
                  €{categoryTotal.toFixed(2)}/mes
                </span>
              </div>
              <div className="divide-y">
                {categoryCosts.map((cost) => (
                  <div key={cost.id} className="px-6 py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-white text-[18px]">{cost.name}</p>
                        {cost.description && (
                          <p className="text-gray-500 text-sm">{cost.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-400">
                            {frequencyLabels[cost.frequency]}
                          </span>
                          {cost.tax_amount && cost.tax_amount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              +IVA €{cost.tax_amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-white text-[18px]">
                            €{(cost.base_amount || cost.amount).toFixed(2)}
                          </p>
                          {cost.frequency !== 'monthly' && (
                            <p className="text-sm text-gray-500">
                              €{getMonthlyAmount(cost).toFixed(2)}/mes
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <IconTrash size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 👥 GASTOS DE PERSONAL (NÓMINAS) */}
      {costs.filter(c => c.is_payroll).length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-purple-500">
            <h2 className="text-2xl font-bold text-white"> Gastos de Personal (Grupo 64 PGC)</h2>
            <div className="text-xl font-bold text-purple-400">
              €{costs.filter(c => c.is_payroll).reduce((sum, c) => sum + getMonthlyAmount(c), 0).toFixed(2)}/mes
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] overflow-hidden">
            <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#404040] flex justify-between items-center">
              <h3 className="font-semibold text-white text-[20px]">
                Nóminas
              </h3>
              <span className="text-[20px] font-medium text-gray-400">
                €{costs.filter(c => c.is_payroll).reduce((sum, c) => sum + getMonthlyAmount(c), 0).toFixed(2)}/mes
              </span>
            </div>
            <div className="divide-y">
              {costs.filter(c => c.is_payroll).map((cost) => (
                <div key={cost.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <p className="font-medium text-white text-[18px]">{cost.name}</p>
                      {cost.description && (
                        <p className="text-gray-500 text-sm">{cost.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-400">
                          {frequencyLabels[cost.frequency]}
                        </span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Nómina
                        </span>
                      </div>
                      
                      {/* Detalles de nómina - FORMATO LISTA LIMPIA */}
                      {cost.payroll_data && (
                        <div className="mt-3 space-y-2 w-full">
                          <div className="flex justify-between p-2 bg-blue-500/5 rounded w-full">
                            <span className="text-sm text-gray-400">Bruto</span>
                            <span className="text-blue-400 font-medium">
                              €{cost.payroll_data.salario_bruto?.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-red-500/5 rounded w-full">
                            <span className="text-sm text-gray-400">SS Empresa</span>
                            <span className="text-red-400 font-medium">
                              €{cost.payroll_data.ss_empresa?.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-green-500/5 rounded w-full">
                            <span className="text-sm text-gray-400">Líquido</span>
                            <span className="text-green-400 font-medium">
                              €{cost.payroll_data.liquido_percibir?.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between p-2 bg-amber-500/5 rounded w-full">
                            <span className="text-sm text-gray-400">IRPF</span>
                            <span className="text-amber-400 font-medium">
                              €{cost.payroll_data.irpf?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-white text-[18px]">
                          €{(cost.base_amount || cost.amount).toFixed(2)}
                        </p>
                        {cost.frequency !== 'monthly' && (
                          <p className="text-sm text-gray-500">
                            €{getMonthlyAmount(cost).toFixed(2)}/mes
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCost(cost.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <IconTrash size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Costos sin categoría (legacy) */}
      {costs.filter(c => !c.cost_type && !COST_CATEGORIES.find(cat => cat.id === c.cost_type)).length > 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] overflow-hidden">
          <div className="px-6 py-4 bg-[#0d0d0d] border-b border-[#404040]">
            <h3 className="font-semibold text-white text-[20px]">Otros (migrados)</h3>
          </div>
          <div className="divide-y">
            {costs.filter(c => !c.cost_type).map((cost) => (
              <div key={cost.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{cost.name}</p>
                  <span className="text-sm text-gray-400">{frequencyLabels[cost.frequency]}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-semibold text-gray-900">€{cost.amount.toFixed(2)}</p>
                  <button onClick={() => handleDeleteCost(cost.id)} className="text-red-600 hover:text-red-700">
                    <IconTrash size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {costs.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-12 text-center">
          <IconMoney size={48} color="#666" className="mx-auto mb-2" />
          <p className="text-gray-400">No hay costos fijos registrados</p>
          <p className="text-sm text-gray-500 mt-1">
            Añade tus gastos fijos como alquiler, luz, nóminas, etc.
          </p>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar este coste fijo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}