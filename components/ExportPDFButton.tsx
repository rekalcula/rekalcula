'use client'

import { useState } from 'react'

interface ExportPDFButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

export default function ExportPDFButton({ 
  onClick, 
  label = 'Exportar PDF',
  className = ''
}: ExportPDFButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleClick = async () => {
    setExporting(true)
    try {
      await onClick()
    } catch (error) {
      console.error('Error exportando PDF:', error)
      alert('Error al exportar PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={exporting}
      className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 ${className}`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      {exporting ? 'Exportando...' : label}
    </button>
  )
}
