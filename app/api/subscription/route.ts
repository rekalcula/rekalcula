import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSubscription, createTrialSubscription, getTrialDaysRemaining } from '@/lib/subscription'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let subscription = await getSubscription(userId)

    if (!subscription) {
      subscription = await createTrialSubscription(userId)
    }

    const trialDaysRemaining = subscription?.status === 'trialing' 
      ? await getTrialDaysRemaining(userId)
      : 0

    return NextResponse.json({
      subscription,
      trialDaysRemaining,
      isActive: subscription?.status === 'active' || 
                (subscription?.status === 'trialing' && trialDaysRemaining > 0)
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}