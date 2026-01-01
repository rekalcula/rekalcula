'use client'

import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { IconDocument, IconBarChart } from './Icons'

interface Invoice {
  id: number
  created_at: string
  file_name: string
  supplier: string | null
  total_amount: number | null
  invoice_date: string | null
  category: string | null
}

interface ExportButtonsProps {
  invoices: Invoice[]
}

export default function ExportButtons({ invoices }: ExportButtonsProps) {
  const prepareData = () => {
    return invoices.map(invoice => ({
      'ID': invoice.id,
      'Fecha': invoice.invoice_date
        ? new Date(invoice.invoice_date).toLocaleDateString('es-ES')
        : new Date(invoice.created_at).toLocaleDateString('es-ES'),
      'Proveedor': invoice.supplier || 'Sin proveedor',
      'Categoria': invoice.category || 'Sin categoria',
      'Total': invoice.total_amount ? `${invoice.total_amount.toFixed(2)}€` : '-',
      'Archivo': invoice.file_name,
    }))
  }

  const exportToCSV = () => {
    const data = prepareData()
    const csv = Papa.unparse(data)

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = () => {
    const data = prepareData()
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas')

    // Ajustar ancho de columnas
    const maxWidth = 20
    const cols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }))
    worksheet['!cols'] = cols

    XLSX.writeFile(workbook, `facturas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (invoices.length === 0) {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={exportToCSV}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        <IconDocument size={20} />
        <span>Exportar CSV</span>
      </button>

      <button
        onClick={exportToExcel}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <IconBarChart size={20} />
        <span>Exportar Excel</span>
      </button>
    </div>
  )
}
