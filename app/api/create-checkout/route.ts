import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, PRICES } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { billingCycle } = await request.json()
    
    // Seleccionar precio según el ciclo
    let priceId: string
    switch (billingCycle) {
      case 'monthly':
        priceId = PRICES.monthly
        break
      case 'semiannual':
        priceId = PRICES.semiannual
        break
      case 'yearly':
        priceId = PRICES.yearly
        break
      default:
        priceId = PRICES.yearly
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
      metadata: { userId, billingCycle },
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