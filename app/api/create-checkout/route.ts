import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { billingCycle, planSlug } = await request.json()
    
    // Obtener el precio de Stripe desde la base de datos
    const { data: plan } = await supabase
      .from('plans')
      .select('stripe_price_monthly, stripe_price_yearly, name')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    // Seleccionar precio según el ciclo
    let priceId: string
    switch (billingCycle) {
      case 'monthly':
        priceId = plan.stripe_price_monthly
        break
      case 'yearly':
        priceId = plan.stripe_price_yearly
        break
      default:
        priceId = plan.stripe_price_yearly
    }

    if (!priceId) {
      return NextResponse.json({ error: 'Precio no configurado para este plan' }, { status: 400 })
    }

    let { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
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
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { userId, billingCycle, planSlug },
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al crear sesión' }, { status: 500 })
  }
}