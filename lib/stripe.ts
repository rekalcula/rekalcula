import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// Verificar que la clave de Stripe existe
if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY no está configurada en las variables de entorno')
}

// Crear instancia de Stripe
// La versión de API debe coincidir con la versión del paquete stripe instalado
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true
    })
  : null

// Función segura que lanza error si Stripe no está configurado
export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe no está configurado. Verifica STRIPE_SECRET_KEY en las variables de entorno.')
  }
  return stripe
}

// Función para verificar configuración
export function verifyStripeConfig(): boolean {
  return !!stripeSecretKey
}

// Precios legacy (por compatibilidad)
export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  semiannual: process.env.STRIPE_PRICE_SEMIANNUAL || '',
  yearly: process.env.STRIPE_PRICE_YEARLY || ''
}