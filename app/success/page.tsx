import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✓</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Pago Exitoso!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tu suscripción a reKalcula Pro está activa. Ya puedes disfrutar de todas las funcionalidades.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="font-medium text-gray-900 mb-2">Ahora tienes acceso a:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Facturas ilimitadas</li>
            <li>✓ Análisis con IA avanzada</li>
            <li>✓ Reportes y gráficas</li>
            <li>✓ Soporte prioritario</li>
          </ul>
        </div>

        <Link
          href="/dashboard"
          className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Ir al Dashboard
        </Link>
      </div>
    </div>
  )
}