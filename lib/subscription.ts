import { supabase } from './supabase'

export interface Subscription {
  id: string
  user_id: string
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'expired'
  plan: 'free' | 'trial' | 'pro'
  billing_cycle: 'monthly' | 'yearly' | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_start: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) return null
  return data
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId)
  if (!sub) return false
  
  if (sub.status === 'trialing' && sub.trial_end) {
    return new Date(sub.trial_end) > new Date()
  }
  
  return sub.status === 'active'
}

export async function createTrialSubscription(userId: string) {
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 28)
  
  const { data } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      status: 'trialing',
      plan: 'trial',
      trial_start: new Date().toISOString(),
      trial_end: trialEnd.toISOString()
    })
    .select()
    .single()
  
  return data
}

export async function getTrialDaysRemaining(userId: string): Promise<number> {
  const sub = await getSubscription(userId)
  if (!sub || sub.status !== 'trialing' || !sub.trial_end) return 0
  
  const diffTime = new Date(sub.trial_end).getTime() - new Date().getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}