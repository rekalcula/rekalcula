import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { hasCredits, useCredits } from '@/lib/credits'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ========================================
    // VERIFICAR CRÉDITOS DISPONIBLES
    // ========================================
    const hasAvailableCredits = await hasCredits(userId, 'tickets')
    if (!hasAvailableCredits) {
      return NextResponse.json({ 
        error: 'No tienes créditos de tickets disponibles. Actualiza tu plan o compra créditos adicionales.',
        code: 'NO_CREDITS'
      }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se ha proporcionado archivo' }, { status: 400 })
    }

    // Convertir archivo a base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    
    const isPDF = file.type === 'application/pdf'

    // Construir el contenido según el tipo de archivo
    let fileContent: any

    if (isPDF) {
      fileContent = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64
        }
      }
    } else {
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
      if (file.type === 'image/png') mediaType = 'image/png'
      else if (file.type === 'image/gif') mediaType = 'image/gif'
      else if (file.type === 'image/webp') mediaType = 'image/webp'

      fileContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64
        }
      }
    }

    // Procesar con Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            fileContent,
            {
              type: 'text',
              text: `Analiza este ticket o factura de VENTA y extrae la información en formato JSON.
              
Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta:
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "productos": [
    {
      "nombre": "nombre del producto o servicio",
      "cantidad": 1,
      "precio_unitario": 0.00,
      "total": 0.00
    }
  ],
  "subtotal": 0.00,
  "iva": 0.00,
  "total": 0.00,
  "metodo_pago": "efectivo|tarjeta|mixto|desconocido",
  "negocio": "nombre del negocio si aparece"
}

Si no puedes identificar algún campo, usa null.
Si hay varios productos, inclúyelos todos en el array.
Responde SOLO con el JSON, sin explicaciones.`
            }
          ]
        }
      ]
    })

    // Extraer respuesta
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Limpiar y parsear JSON
    let ticketData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        ticketData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No se encontró JSON válido')
      }
    } catch (e) {
      return NextResponse.json({ 
        error: 'No se pudo procesar el ticket',
        raw: responseText 
      }, { status: 400 })
    }

    // Guardar la venta en la base de datos
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        sale_date: ticketData.fecha || new Date().toISOString().split('T')[0],
        sale_time: ticketData.hora,
        subtotal: ticketData.subtotal || ticketData.total,
        tax_amount: ticketData.iva || 0,
        total: ticketData.total,
        payment_method: ticketData.metodo_pago,
        notes: ticketData.negocio ? `Negocio: ${ticketData.negocio}` : null,
        source: 'ticket'
      })
      .select()
      .single()

    if (saleError) {
      console.error('Error guardando venta:', saleError)
      return NextResponse.json({ error: 'Error al guardar la venta' }, { status: 500 })
    }

    // Guardar los items de la venta
    if (ticketData.productos && ticketData.productos.length > 0) {
      const saleItems = ticketData.productos.map((producto: any) => ({
        sale_id: sale.id,
        product_name: producto.nombre,
        quantity: producto.cantidad || 1,
        unit_price: producto.precio_unitario || producto.total,
        cost_price: 0,
        total: producto.total || (producto.precio_unitario * (producto.cantidad || 1))
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) {
        console.error('Error guardando items:', itemsError)
      }
    }

    // ========================================
    // DESCONTAR CRÉDITO DESPUÉS DE ÉXITO
    // ========================================
    const creditResult = await useCredits(userId, 'tickets')
    if (!creditResult.success) {
      console.warn('Error descontando crédito:', creditResult.error)
    }

    return NextResponse.json({ 
      success: true, 
      sale,
      extracted: ticketData,
      creditsRemaining: creditResult.remaining
    })

  } catch (error) {
    console.error('Error procesando ticket:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}