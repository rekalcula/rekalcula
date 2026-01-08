import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// Verificar que la clave de Stripe existe
if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY no está configurada en las variables de entorno')
}

// Crear instancia de Stripe con versión de API válida
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',  // ✅ Versión de API válida
      typescript: true
    })
  : null

// Función auxiliar para verificar que Stripe está configurado
export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.')
  }
  return stripe
}

// Precios legacy (por compatibilidad)
export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  semiannual: process.env.STRIPE_PRICE_SEMIANNUAL || '',
  yearly: process.env.STRIPE_PRICE_YEARLY || ''
}