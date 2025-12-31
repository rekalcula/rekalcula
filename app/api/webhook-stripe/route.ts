import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'
import { initializeUserCredits, monthlyRefill, addCredits } from '@/lib/credits'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      
      // ========================================
      // COMPRA DE PAQUETES EXTRA (pago único)
      // ========================================
      if (session.mode === 'payment' && session.metadata?.packageId) {
        const userId = session.metadata.userId
        const creditType = session.metadata.creditType as 'invoices' | 'tickets' | 'analyses'
        const creditAmount = parseInt(session.metadata.creditAmount || '0')

        if (userId && creditType && creditAmount > 0) {
          await addCredits(userId, creditType, creditAmount, `Compra de paquete extra`)
          console.log(`Créditos añadidos: ${creditAmount} ${creditType} para usuario ${userId}`)
        }
        break
      }

      // ========================================
      // NUEVA SUSCRIPCIÓN
      // ========================================
      const userId = session.metadata?.userId
      const billingCycle = session.metadata?.billingCycle
      const planSlug = session.metadata?.planSlug || 'basico'

      if (userId && session.subscription) {
        const subscriptionData: any = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          status: 'active',
          plan: planSlug,
          billing_cycle: billingCycle,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionData.id,
          current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
          trial_end: null,
          updated_at: new Date().toISOString()
        })

        // Inicializar créditos del usuario
        await initializeUserCredits(userId, planSlug)
        console.log(`Créditos inicializados para usuario ${userId} con plan ${planSlug}`)
      }
      break
    }

    // ========================================
    // RENOVACIÓN MENSUAL - RECARGAR CRÉDITOS
    // ========================================
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice

      // Solo procesar renovaciones (no el primer pago)
      if (invoice.billing_reason === 'subscription_cycle') {
        const customerId = invoice.customer as string

        // Obtener userId del customer
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub) {
          // Recargar créditos con acumulación
          await monthlyRefill(sub.user_id)
          console.log(`Créditos recargados para usuario ${sub.user_id}`)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (sub) {
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription: any = event.data.object

      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice: any = event.data.object

      if (invoice.subscription) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', invoice.subscription as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}