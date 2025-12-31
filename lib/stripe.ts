import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover'
    })
  : null as unknown as Stripe

export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  semiannual: process.env.STRIPE_PRICE_SEMIANNUAL!,
  yearly: process.env.STRIPE_PRICE_YEARLY!
}