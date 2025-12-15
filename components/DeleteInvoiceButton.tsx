'use client'

export default function DeleteInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.')) {
      return
    }

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
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
    >
      🗑️ Eliminar Factura
    </button>
  )
}