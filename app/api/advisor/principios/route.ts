// ============================================================
// API DE PRINCIPIOS - LISTA PRINCIPIOS CIENTÍFICOS
// ============================================================
//
// GET /api/advisor/principios
//   - Devuelve los 10 principios científicos
//   - No requiere autenticación (información pública)
//
// ============================================================

import { NextResponse } from 'next/server'
import { PRINCIPIOS } from '@/lib/advisor'

export async function GET() {
  // Devolver principios con información relevante
  const principiosPublicos = PRINCIPIOS.map(p => ({
    id: p.id,
    nombre: p.nombre,
    autor: p.autor,
    anio: p.anio,
    publicacion: p.publicacion,
    hallazgo: p.hallazgo,
    aplicacionComercial: p.aplicacionComercial
  }))

  return NextResponse.json({
    success: true,
    total: principiosPublicos.length,
    principios: principiosPublicos
  })
}
