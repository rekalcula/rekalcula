import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// ============================================================
// SANITIZACIÓN DE ENTRADA
// ============================================================
function sanitizeString(value: any, maxLength: number = 255): string | null {
  if (value === null || value === undefined) return null
  return String(value)
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')      // Eliminar tags HTML
    .replace(/[<>"'`;]/g, '')     // Eliminar caracteres peligrosos
}

function sanitizePhone(value: any): string | null {
  if (!value) return null
  // Solo permitir dígitos, espacios, +, -, (, )
  return String(value)
    .trim()
    .slice(0, 20)
    .replace(/[^\d\s+\-()]/g, '')
}

function sanitizeEmail(value: any): string | null {
  if (!value) return null
  const email = String(value).trim().toLowerCase().slice(0, 255)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? email : null
}

function sanitizeTaxId(value: any): string | null {
  if (!value) return null
  // NIF/CIF: solo letras y números
  return String(value)
    .trim()
    .toUpperCase()
    .slice(0, 15)
    .replace(/[^A-Z0-9]/g, '')
}

function isValidUUID(value: any): boolean {
  if (!value) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(String(value))
}

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

    // 🔒 SANITIZAR TODOS LOS CAMPOS DE ENTRADA
    const business_name = sanitizeString(body.business_name, 150)
    const custom_business_type = sanitizeString(body.custom_business_type, 100)
    const address = sanitizeString(body.address, 300)
    const phone = sanitizePhone(body.phone)
    const email = sanitizeEmail(body.email)
    const tax_id = sanitizeTaxId(body.tax_id)
    const loadTemplates = body.loadTemplates === true

    // Validar business_type_id si se proporciona
    const business_type_id = body.business_type_id && isValidUUID(body.business_type_id) 
      ? body.business_type_id 
      : null

    // Validación mínima: nombre del negocio obligatorio
    if (!business_name) {
      return NextResponse.json(
        { error: 'El nombre del negocio es obligatorio' },
        { status: 400 }
      )
    }

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
  // 🔒 Validar UUID antes de consultar
  if (!isValidUUID(businessTypeId)) return

  // Obtener plantillas para este tipo de negocio
  const { data: templates } = await supabase
    .from('product_templates')
    .select('*')
    .eq('business_type_id', businessTypeId)
    .order('category_name, sort_order')

  if (!templates || templates.length === 0) return

  // 🔒 Limitar cantidad de plantillas para evitar abuso
  const limitedTemplates = templates.slice(0, 100)

  // Agrupar por categoría
  const categories = [...new Set(limitedTemplates.map(t => t.category_name))]

  // Crear categorías
  const categoryMap: Record<string, string> = {}
  for (const catName of categories) {
    const template = limitedTemplates.find(t => t.category_name === catName)
    const { data: category } = await supabase
      .from('product_categories')
      .insert({
        user_id: userId,
        name: sanitizeString(catName, 100) || catName,
        icon: template?.category_icon || '📦'
      })
      .select()
      .single()

    if (category) {
      categoryMap[catName] = category.id
    }
  }

  // Crear productos
  for (const template of limitedTemplates) {
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