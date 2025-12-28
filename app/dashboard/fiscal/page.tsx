'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function FiscalPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-[#262626] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#d98c21]">
          ⚖️ Configuración Fiscal
        </h1>
        <p className="text-xl text-[#FFFCFF] mt-1">
          Optimiza tus impuestos con análisis inteligente
        </p>
      </div>

      <div className="bg-[#0d0d0d] rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold text-[#FFFCFF] mb-2">
          Módulo en construcción
        </h2>
        <p className="text-[#ACACAC]">
          Sistema de optimización fiscal próximamente disponible
        </p>
      </div>
    </div>
  )
}