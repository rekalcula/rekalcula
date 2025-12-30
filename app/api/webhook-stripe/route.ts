import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

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
      const userId = session.metadata?.userId
      const billingCycle = session.metadata?.billingCycle

      if (userId && session.subscription) {
        const subscriptionData: any = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          status: 'active',
          plan: 'pro',
          billing_cycle: billingCycle,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionData.id,
          current_period_start: new Date(subscriptionData.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscriptionData.current_period_end * 1000).toISOString(),
          trial_end: null,
          updated_at: new Date().toISOString()
        })
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