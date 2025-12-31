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

    const { packageId } = await request.json()

    // Obtener el paquete
    const { data: pkg, error: pkgError } = await supabase
      .from('extra_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
    }

    if (!pkg.stripe_price_id) {
      return NextResponse.json({ error: 'Paquete no configurado en Stripe' }, { status: 400 })
    }

    // Obtener o crear customer de Stripe
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

    // Crear sesión de checkout para pago único
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=cancelled`,
      metadata: { 
        userId, 
        packageId: pkg.id,
        creditType: pkg.credit_type,
        creditAmount: pkg.amount.toString()
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}