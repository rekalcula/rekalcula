import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener configuración actual
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('typography_config')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching typography config:', error)
      return NextResponse.json(
        { error: 'Error al obtener configuración' },
        { status: 500 }
      )
    }

    return NextResponse.json({ config: data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    )
  }
}

// POST - Guardar nueva configuración
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      baseSizeMobile,
      baseSizeTablet,
      baseSizeDesktop,
      fontFamily,
      scaleRatio,
      lineHeight
    } = body

    // Validaciones de tamaños base
    if (baseSizeMobile < 12 || baseSizeMobile > 24) {
      return NextResponse.json(
        { error: 'Tamaño mobile debe estar entre 12px y 24px' },
        { status: 400 }
      )
    }
    
    if (baseSizeTablet < 12 || baseSizeTablet > 24) {
      return NextResponse.json(
        { error: 'Tamaño tablet debe estar entre 12px y 24px' },
        { status: 400 }
      )
    }
    
    if (baseSizeDesktop < 12 || baseSizeDesktop > 24) {
      return NextResponse.json(
        { error: 'Tamaño desktop debe estar entre 12px y 24px' },
        { status: 400 }
      )
    }

    // Validación de Scale Ratio (ACTUALIZADO: 1.05 - 1.618)
    if (scaleRatio < 1.05 || scaleRatio > 1.618) {
      return NextResponse.json(
        { error: 'Escala debe estar entre 1.05 y 1.618' },
        { status: 400 }
      )
    }

    // Validación de Line Height (ACTUALIZADO: 1.05 - 2.0)
    if (lineHeight < 1.05 || lineHeight > 2.0) {
      return NextResponse.json(
        { error: 'Line Height debe estar entre 1.05 y 2.0' },
        { status: 400 }
      )
    }

    // Obtener el ID del registro existente
    const { data: existing } = await supabase
      .from('typography_config')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('typography_config')
        .update({
          base_size_mobile: baseSizeMobile,
          base_size_tablet: baseSizeTablet,
          base_size_desktop: baseSizeDesktop,
          font_family: fontFamily,
          scale_ratio: scaleRatio,
          line_height: lineHeight,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating typography config:', error)
        return NextResponse.json(
          { error: 'Error al guardar configuración' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        message: 'Configuración actualizada',
        config: data 
      })
    } else {
      // Crear nuevo registro
      const { data, error } = await supabase
        .from('typography_config')
        .insert({
          base_size_mobile: baseSizeMobile,
          base_size_tablet: baseSizeTablet,
          base_size_desktop: baseSizeDesktop,
          font_family: fontFamily,
          scale_ratio: scaleRatio,
          line_height: lineHeight
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating typography config:', error)
        return NextResponse.json(
          { error: 'Error al crear configuración' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        message: 'Configuración creada',
        config: data 
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    )
  }
}

// PUT - Restablecer configuración por defecto
export async function PUT() {
  try {
    const defaultConfig = {
      base_size_mobile: 16,
      base_size_tablet: 16,
      base_size_desktop: 18,
      font_family: 'Inter, system-ui, sans-serif',
      scale_ratio: 1.25,
      line_height: 1.5,
      updated_at: new Date().toISOString()
    }

    const { data: existing } = await supabase
      .from('typography_config')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('typography_config')
        .update(defaultConfig)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error resetting typography config:', error)
        return NextResponse.json(
          { error: 'Error al restablecer configuración' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        message: 'Configuración restablecida',
        config: data 
      })
    }

    return NextResponse.json(
      { error: 'No se encontró configuración' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    )
  }
}

