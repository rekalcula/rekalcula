import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { hasCredits } from '@/lib/credits'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// ========================================
// FUNCIÓN PARA SANITIZAR NOMBRE DE ARCHIVO
// ========================================
function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos (é → e, í → i)
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Reemplazar caracteres especiales por _
    .replace(/_+/g, '_') // Eliminar guiones bajos múltiples
    .replace(/^_|_$/g, '') // Eliminar guiones bajos al inicio/final
}

// ========================================
// PASO 1: SOLO ANALIZAR (NO GUARDA EN BD)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar créditos disponibles
    const hasAvailableCredits = await hasCredits(userId, 'invoices')
    if (!hasAvailableCredits) {
      return NextResponse.json({ 
        error: 'No tienes créditos de facturas disponibles.',
        code: 'NO_CREDITS'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten imágenes o PDFs' }, { status: 400 })
    }

    // Convertir a buffer y base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')
    
    const isPDF = file.type === 'application/pdf'
    
    // Preparar contenido para Claude
    let messageContent: any[]
    
    if (isPDF) {
      messageContent = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data
          }
        },
        {
          type: 'text',
          text: `Analiza esta factura PDF y extrae la siguiente información en formato JSON:

{
  "supplier": "nombre del proveedor",
  "supplier_address": "dirección completa del proveedor",
  "supplier_nif": "NIF/CIF del proveedor",
  "supplier_email": "email del proveedor si aparece",
  "supplier_phone": "teléfono del proveedor si aparece",
  "total_amount": número decimal del importe total,
  "tax_amount": número decimal del IVA/impuestos,
  "invoice_date": "fecha en formato YYYY-MM-DD",
  "invoice_number": "número de factura",
  "category": "categoría del gasto (ej: Servicios, Productos, Materiales, etc)",
  "items": [
    {
      "description": "descripción del producto/servicio",
      "quantity": cantidad,
      "unit_price": precio unitario,
      "tax_rate": porcentaje de IVA,
      "total": total
    }
  ],
  "payment_conditions": "condiciones de pago si aparecen",
  "bank_account": "cuenta bancaria si aparece",
  "notes": "notas o comentarios adicionales",
  "analysis": {
    "insights": ["insight 1", "insight 2"],
    "savings_opportunities": ["oportunidad 1", "oportunidad 2"],
    "recommendations": ["recomendación 1", "recomendación 2"]
  }
}

Responde SOLO con el JSON, sin texto adicional.`
        }
      ]
    } else {
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
      if (file.type === 'image/png') mediaType = 'image/png'
      if (file.type === 'image/gif') mediaType = 'image/gif'
      if (file.type === 'image/webp') mediaType = 'image/webp'

      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        },
        {
          type: 'text',
          text: `Analiza esta factura y extrae la siguiente información en formato JSON:

{
  "supplier": "nombre del proveedor",
  "supplier_address": "dirección completa del proveedor",
  "supplier_nif": "NIF/CIF del proveedor",
  "supplier_email": "email del proveedor si aparece",
  "supplier_phone": "teléfono del proveedor si aparece",
  "total_amount": número decimal del importe total,
  "tax_amount": número decimal del IVA/impuestos,
  "invoice_date": "fecha en formato YYYY-MM-DD",
  "invoice_number": "número de factura",
  "category": "categoría del gasto (ej: Servicios, Productos, Materiales, etc)",
  "items": [
    {
      "description": "descripción del producto/servicio",
      "quantity": cantidad,
      "unit_price": precio unitario,
      "tax_rate": porcentaje de IVA,
      "total": total
    }
  ],
  "payment_conditions": "condiciones de pago si aparecen",
  "bank_account": "cuenta bancaria si aparece",
  "notes": "notas o comentarios adicionales",
  "analysis": {
    "insights": ["insight 1", "insight 2"],
    "savings_opportunities": ["oportunidad 1", "oportunidad 2"],
    "recommendations": ["recomendación 1", "recomendación 2"]
  }
}

Responde SOLO con el JSON, sin texto adicional.`
        }
      ]
    }

    // Analizar con Claude
    console.log(`[analyze-invoice] Analizando ${isPDF ? 'PDF' : 'imagen'} con Claude...`)
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: messageContent }]
    })

    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('')

    // Parsear JSON
    let analysisData
    try {
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      analysisData = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('[analyze-invoice] Error parseando respuesta:', parseError)
      return NextResponse.json({ error: 'Error procesando el análisis' }, { status: 500 })
    }

    // ========================================
    // SUBIR ARCHIVO A STORAGE (temporal)
    // ========================================
    const timestamp = Date.now()
    // ⭐ SANITIZAR NOMBRE DEL ARCHIVO
    const sanitizedName = sanitizeFileName(file.name)
    const fileName = `${userId}/${timestamp}-${sanitizedName}`

    const { error: uploadError } = await supabase
      .storage
      .from('invoices')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[analyze-invoice] Error subiendo archivo:', uploadError)
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
    }

    // ========================================
    // RETORNAR DATOS SIN GUARDAR EN BD
    // ========================================
    return NextResponse.json({
      success: true,
      // Datos del análisis (para mostrar en UI)
      analysis: analysisData,
      // Datos necesarios para guardar después
      fileData: {
        filePath: fileName,
        fileName: file.name, // Mantener nombre original para mostrar
        fileSize: file.size
      },
      // Flag que indica que requiere confirmación de pago ANTES de guardar
      requiresPaymentConfirmation: true
    })

  } catch (error) {
    console.error('[analyze-invoice] Error general:', error)
    return NextResponse.json({ error: 'Error procesando la factura' }, { status: 500 })
  }
}