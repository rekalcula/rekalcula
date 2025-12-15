import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// GET - Obtener configuración del negocio
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configuración
    const { data: config } = await supabase
      .from('business_config')
      .select('*, business_types(*)')
      .eq('user_id', userId)
      .single()

    // Obtener tipos de negocio disponibles
    const { data: businessTypes } = await supabase
      .from('business_types')
      .select('*')
      .order('name')

    return NextResponse.json({ 
      config, 
      businessTypes,
      isConfigured: !!config 
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Crear/actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      business_name, 
      business_type_id, 
      custom_business_type,
      address, 
      phone, 
      email, 
      tax_id,
      loadTemplates 
    } = body

    // Verificar si ya existe configuración
    const { data: existing } = await supabase
      .from('business_config')
      .select('id')
      .eq('user_id', userId)
      .single()

    let config
    if (existing) {
      // Actualizar
      const { data, error } = await supabase
        .from('business_config')
        .update({
          business_name,
          business_type_id,
          custom_business_type,
          address,
          phone,
          email,
          tax_id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      config = data
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('business_config')
        .insert({
          user_id: userId,
          business_name,
          business_type_id,
          custom_business_type,
          address,
          phone,
          email,
          tax_id
        })
        .select()
        .single()

      if (error) throw error
      config = data

      // Si es nuevo y quiere cargar plantillas
      if (loadTemplates && business_type_id) {
        await loadProductTemplates(userId, business_type_id)
      }
    }

    return NextResponse.json({ success: true, config })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

// Función para cargar plantillas de productos
async function loadProductTemplates(userId: string, businessTypeId: string) {
  // Obtener plantillas para este tipo de negocio
  const { data: templates } = await supabase
    .from('product_templates')
    .select('*')
    .eq('business_type_id', businessTypeId)
    .order('category_name, sort_order')

  if (!templates || templates.length === 0) return

  // Agrupar por categoría
  const categories = [...new Set(templates.map(t => t.category_name))]

  // Crear categorías
  const categoryMap: Record<string, string> = {}
  for (const catName of categories) {
    const template = templates.find(t => t.category_name === catName)
    const { data: category } = await supabase
      .from('product_categories')
      .insert({
        user_id: userId,
        name: catName,
        icon: template?.category_icon || '📦'
      })
      .select()
      .single()

    if (category) {
      categoryMap[catName] = category.id
    }
  }

  // Crear productos
  for (const template of templates) {
    await supabase
      .from('products')
      .insert({
        user_id: userId,
        category_id: categoryMap[template.category_name],
        name: template.product_name,
        icon: template.product_icon,
        sale_price: template.suggested_price,
        cost_price: template.suggested_cost,
        unit: template.unit,
        sort_order: template.sort_order
      })
  }
}