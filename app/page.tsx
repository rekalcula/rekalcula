import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
      {/* Header / Navegación */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold">
            re<span className="text-blue-600">K</span>alcula
          </div>
          <div className="space-x-4">
            <Link 
              href="/sign-in" 
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Empezar gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full text-blue-600 font-medium text-sm">
            ✨ 14 días gratis • Sin tarjeta de crédito
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Deja de perder dinero
            <br />
            <span className="text-blue-600">sin saberlo</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Fotografía tus facturas, recibe un análisis con IA en 3 minutos,
            y descubre exactamente cómo aumentar tus beneficios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/sign-up"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              Empezar gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#como-funciona"
              className="border-2 border-gray-300 px-8 py-4 rounded-lg hover:border-gray-400 transition text-lg font-semibold"
            >
              Ver cómo funciona
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>14 días gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="mt-32 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Análisis en 3 minutos</h3>
              <p className="text-gray-600">
                Sube tus facturas y recibe un análisis completo instantáneo. Sin esperas, sin complicaciones.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Aumenta beneficios</h3>
              <p className="text-gray-600">
                Descubre oportunidades ocultas para aumentar ventas y reducir costes innecesarios.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">100% seguro</h3>
              <p className="text-gray-600">
                Tus datos están encriptados y protegidos. Nunca compartimos tu información.
              </p>
            </div>
          </div>
        </div>

        {/* Cómo funciona */}
        <div id="como-funciona" className="mt-32">
          <h2 className="text-4xl font-bold text-center mb-4">
            Cómo funciona
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            3 pasos simples para optimizar tu negocio
          </p>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Fotografía facturas</h3>
              <p className="text-gray-600">
                Sube fotos de tus facturas mensuales. La IA las procesa automáticamente en segundos.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Análisis instantáneo</h3>
              <p className="text-gray-600">
                Recibes métricas completas: márgenes, punto de equilibrio, comparativa con el sector.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Implementa consejos</h3>
              <p className="text-gray-600">
                Sigue recomendaciones priorizadas para reducir costes y aumentar ventas hoy mismo.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-32 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para optimizar tu negocio?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a cientos de comercios que ya aumentaron sus beneficios
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg font-semibold shadow-lg"
          >
            Empezar ahora gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-32 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 reKalcula. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}