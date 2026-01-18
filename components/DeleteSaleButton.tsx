'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from './ConfirmDialog'

export default function DeleteSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleDeleteClick = () => {
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    setShowConfirmDialog(false)
    setDeleting(true)

    try {
      const response = await fetch(`/api/sales?id=${saleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      router.push('/dashboard/sales')
      router.refresh()
    } catch (error) {
      alert('Error al eliminar la venta')
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowConfirmDialog(false)
  }

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={deleting}
        className="block w-full text-center bg-red-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
      >
        {deleting ? 'Eliminando...' : '🗑️ Eliminar Venta'}
      </button>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar 1 venta? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}