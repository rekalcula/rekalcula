import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (PNG, JPG, JPEG) o PDFs' },
        { status: 400 }
      )
    }

    // Convertir a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const fileName = `${userId}/${timestamp}-${file.name}`

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('invoices')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      )
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('invoices')
      .getPublicUrl(fileName)

    // Convertir archivo a base64
    const base64Data = buffer.toString('base64')
    
    // Determinar el tipo de contenido para Claude
    const isPDF = file.type === 'application/pdf'
    
    let messageContent: any[]
    
    if (isPDF) {
      // Para PDFs usar el tipo "document"
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
  "total_amount": número decimal del importe total,
  "invoice_date": "fecha en formato YYYY-MM-DD",
  "category": "categoría del gasto (ej: Servicios, Productos, Materiales, etc)",
  "items": [
    {
      "description": "descripción del producto/servicio",
      "quantity": cantidad,
      "unit_price": precio unitario,
      "total": total
    }
  ],
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
      // Para imágenes usar el tipo "image"
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
  "total_amount": número decimal del importe total,
  "invoice_date": "fecha en formato YYYY-MM-DD",
  "category": "categoría del gasto (ej: Servicios, Productos, Materiales, etc)",
  "items": [
    {
      "description": "descripción del producto/servicio",
      "quantity": cantidad,
      "unit_price": precio unitario,
      "total": total
    }
  ],
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
    console.log(`Analizando ${isPDF ? 'PDF' : 'imagen'} con Claude...`)
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    })

    // Extraer el contenido de texto de la respuesta
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.type === 'text' ? block.text : '')
      .join('')

    console.log('Respuesta de Claude:', responseText)

    // Parsear JSON de la respuesta
    let analysisData
    try {
      // Limpiar posibles marcadores de código
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      analysisData = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Error parseando respuesta de Claude:', parseError)
      return NextResponse.json(
        { error: 'Error procesando el análisis de la factura' },
        { status: 500 }
      )
    }

    // Guardar en la base de datos
    const { data: invoiceData, error: dbError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        file_url: publicUrl,
        file_name: file.name,
        supplier: analysisData.supplier,
        total_amount: analysisData.total_amount,
        invoice_date: analysisData.invoice_date,
        category: analysisData.category,
        items: analysisData.items,
        analysis: analysisData.analysis
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error guardando en BD:', dbError)
      return NextResponse.json(
        { error: 'Error guardando los datos' },
        { status: 500 }
      )
    }

    // Retornar resultado exitoso
    return NextResponse.json({
      success: true,
      data: {
        invoice: invoiceData,
        analysis: analysisData
      }
    })

  } catch (error) {
    console.error('Error general:', error)
    return NextResponse.json(
      { error: 'Error procesando la factura' },
      { status: 500 }
    )
  }
}