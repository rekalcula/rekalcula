// app/api/admin/typography-config/route.ts
// API para gestionar la configuración tipográfica global

import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET: Obtener configuración actual
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('typography_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Si no existe, devolver valores por defecto
    if (!data) {
      return NextResponse.json({
        success: true,
        config: {
          base_font_size_mobile: 16,
          base_font_size_tablet: 16,
          base_font_size_desktop: 18,
          font_family: 'Inter, system-ui, -apple-system, sans-serif',
          scale_ratio: 1.25,
          line_height_body: 1.5,
          line_height_heading: 1.2,
          is_active: true,
        }
      })
    }

    return NextResponse.json({
      success: true,
      config: data
    })
  } catch (error) {
    console.error('Error fetching typography config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración tipográfica' },
      { status: 500 }
    )
  }
}

// POST: Actualizar configuración
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      base_font_size_mobile,
      base_font_size_tablet,
      base_font_size_desktop,
      font_family,
      scale_ratio,
      line_height_body,
      line_height_heading,
      description
    } = body

    // Validar valores
    if (
      base_font_size_mobile < 12 || base_font_size_mobile > 24 ||
      base_font_size_tablet < 12 || base_font_size_tablet > 24 ||
      base_font_size_desktop < 12 || base_font_size_desktop > 28
    ) {
      return NextResponse.json(
        { success: false, error: 'Tamaños de fuente fuera de rango permitido (12-24px móvil/tablet, 12-28px desktop)' },
        { status: 400 }
      )
    }

    if (scale_ratio < 1.1 || scale_ratio > 2.0) {
      return NextResponse.json(
        { success: false, error: 'Escala tipográfica fuera de rango (1.1-2.0)' },
        { status: 400 }
      )
    }

    // Verificar si existe configuración
    const { data: existing } = await supabase
      .from('typography_config')
      .select('id')
      .single()

    let result

    if (existing) {
      // Actualizar existente
      result = await supabase
        .from('typography_config')
        .update({
          base_font_size_mobile,
          base_font_size_tablet,
          base_font_size_desktop,
          font_family,
          scale_ratio,
          line_height_body,
          line_height_heading,
          description,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Crear nuevo
      result = await supabase
        .from('typography_config')
        .insert({
          base_font_size_mobile,
          base_font_size_tablet,
          base_font_size_desktop,
          font_family,
          scale_ratio,
          line_height_body,
          line_height_heading,
          description,
          is_active: true
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json({
      success: true,
      config: result.data
    })
  } catch (error) {
    console.error('Error updating typography config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración tipográfica' },
      { status: 500 }
    )
  }
}

// PUT: Restablecer a valores por defecto
export async function PUT() {
  try {
    const { data: existing } = await supabase
      .from('typography_config')
      .select('id')
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'No existe configuración para restablecer' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('typography_config')
      .update({
        base_font_size_mobile: 16,
        base_font_size_tablet: 16,
        base_font_size_desktop: 18,
        font_family: 'Inter, system-ui, -apple-system, sans-serif',
        scale_ratio: 1.25,
        line_height_body: 1.5,
        line_height_heading: 1.2,
        description: 'Restablecido a valores por defecto',
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      config: data
    })
  } catch (error) {
    console.error('Error resetting typography config:', error)
    return NextResponse.json(
      { success: false, error: 'Error al restablecer configuración' },
      { status: 500 }
    )
  }
}

