'use client'

import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

export default function DeleteInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/delete-invoice?id=${invoiceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar factura')
      }

      // Redirigir a la lista de facturas
      window.location.href = '/dashboard/invoices'
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la factura. Inténtalo de nuevo.')
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {deleting ? 'Eliminando...' : '🗑️ Eliminar Factura'}
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}