import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // ========================================
    // Verificar que Stripe está configurado
    // ========================================
    let stripe
    try {
      stripe = getStripe()
    } catch (error) {
      console.error('Stripe no configurado:', error)
      return NextResponse.json({ 
        error: 'El sistema de pagos no está configurado correctamente. Contacta con soporte.' 
      }, { status: 500 })
    }

    const { billingCycle, planSlug } = await request.json()

    // Validar parámetros
    if (!planSlug) {
      return NextResponse.json({ error: 'Plan no especificado' }, { status: 400 })
    }

    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Ciclo de facturación inválido' }, { status: 400 })
    }
    
    // ========================================
    // Obtener el plan de la base de datos
    // ========================================
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, slug, stripe_price_monthly, stripe_price_yearly, price_monthly, price_yearly')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      console.error('Plan no encontrado:', planSlug, planError)
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // ========================================
    // Seleccionar precio según el ciclo
    // ========================================
    let priceId: string | null = null

    if (billingCycle === 'monthly') {
      priceId = plan.stripe_price_monthly
    } else if (billingCycle === 'yearly') {
      priceId = plan.stripe_price_yearly
      
      // Si no hay precio anual, usar el mensual como fallback
      if (!priceId) {
        console.warn(`Plan ${plan.name} no tiene precio anual, usando mensual`)
        priceId = plan.stripe_price_monthly
      }
    }

    // ========================================
    // Verificar que tenemos un precio válido
    // ========================================
    if (!priceId || priceId.trim() === '') {
      console.error('Stripe Price ID faltante:', {
        plan: plan.name,
        slug: planSlug,
        billingCycle,
        stripe_price_monthly: plan.stripe_price_monthly,
        stripe_price_yearly: plan.stripe_price_yearly
      })

      return NextResponse.json({ 
        error: `Precio no configurado para el plan "${plan.name}". Contacta con soporte.`
      }, { status: 400 })
    }

    // Verificar formato del Price ID
    if (!priceId.startsWith('price_')) {
      console.error('Formato de Stripe Price ID inválido:', priceId)
      return NextResponse.json({ 
        error: 'Configuración de precios incorrecta. Contacta con soporte.'
      }, { status: 400 })
    }

    // ========================================
    // Obtener o crear cliente de Stripe
    // ========================================
    let { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          metadata: { userId }
        })
        customerId = customer.id

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
      } catch (stripeError: any) {
        console.error('Error creando cliente en Stripe:', stripeError)
        return NextResponse.json({ 
          error: 'Error al configurar tu cuenta de pago. Inténtalo de nuevo.' 
        }, { status: 500 })
      }
    }

    // ========================================
    // Crear sesión de checkout en Stripe
    // ========================================
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        metadata: { 
          userId, 
          billingCycle, 
          planSlug,
          planName: plan.name
        },
        allow_promotion_codes: true,
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            userId,
            planSlug,
            planName: plan.name
          }
        }
      })

      return NextResponse.json({ url: session.url })
      
    } catch (stripeError: any) {
      console.error('Error creando sesión de Stripe:', stripeError)
      
      // Manejar errores específicos de Stripe
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json({ 
          error: 'El precio configurado no existe en Stripe. Contacta con soporte.' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Error al crear sesión de pago. Inténtalo de nuevo.' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error en create-checkout:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor. Inténtalo de nuevo.' 
    }, { status: 500 })
  }
}