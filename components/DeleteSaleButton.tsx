'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
  <ConfirmDialog
    isOpen={showConfirmDialog}
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
    title="Confirmar eliminación"
    message="¿Estás seguro de que quieres eliminar 1 factura? Esta acción no se puede deshacer."
    confirmText="Eliminar"
    cancelText="Cancelar"
    variant="danger"
  />

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

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="block w-full text-center bg-red-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
    >
      {deleting ? 'Eliminando...' : '🗑 Eliminar Venta'}
    </button>
  )
}