import Link from 'next/link'
import { ArrowRight, CheckCircle, Zap, TrendingUp, Shield } from 'lucide-react'
import LandingFooter from '@/components/LandingFooter'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: '#262626'}}>
      {/* Header / Navegacion */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <nav className="flex flex-wrap justify-between items-center gap-2">
          <div className="text-[35px] font-bold text-[#FFFCFF]">
            re<span className="text-[#d98c21]">K</span>alcula
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/sign-in"
              className="text-[#FFFCFF] hover:text-[#262626] font-medium text-xs sm:text-base border-2 border-[#FFFCFF] px-4 py-2 rounded-lg hover:bg-[#FFFCFF] transition"
            >
              Iniciar sesion
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section - Ocupa pantalla completa en movil */}
      <main className="container mx-auto px-4 flex-1">
        <div className="min-h-[calc(100vh-80px)] sm:min-h-0 flex flex-col justify-center sm:py-20">
          <div className="max-w-4xl mx-auto text-center">

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#FFFCFF] mb-6 sm:mb-6 leading-tight">
              Deja de perder dinero
              <br />
              <span className="text-[#d98c21]">sin saberlo</span>
            </h1>

            <p className="text-base sm:text-xl text-[#FFFCFF] mb-8 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Fotografía tus facturas, configura tu régimen fiscal y recibe un análisis con IA en 3 minutos, 
              con tu cash flow, el resultado de la empresa y descubre exactamente cómo aumentar tus beneficios.
              
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 justify-center mb-10 sm:mb-12 px-8 sm:px-0">
              <Link
                href="/sign-up"
                className="bg-[#d98c21] text-white px-6 py-4 sm:px-8 sm:py-4 rounded-lg hover:bg-[#8A3C00] transition flex items-center justify-center gap-2 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                Empezar gratis
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                href="#como-funciona"
                className="border-2 border-[#FFFCFF] text-[#FFFCFF] px-6 py-4 sm:px-8 sm:py-4 rounded-lg hover:border-[#FFFCFF] hover:bg-[#FFFCFF] hover:text-[#262626] transition text-base sm:text-lg font-semibold"
              >
                Ver como funciona
              </Link>
            </div>

            {/* Trust badges - Vertical en movil */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 text-sm text-[#FFFCFF] px-4">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>7 dias gratis</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Sin tarjeta de credito</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Cancela cuando quieras</span>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="py-16 sm:py-32 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-200 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-[#FFF5ED] w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#d98c21]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#262626] mb-2 sm:mb-3">Analisis en 3 minutos</h3>
              <p className="text-sm sm:text-base text-[#262626]">
                Sube tus facturas y recibe un analisis completo instantaneo. Sin esperas, sin complicaciones.
              </p>
            </div>

            <div className="bg-gray-200 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-green-100 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#262626] mb-2 sm:mb-3">Aumenta beneficios</h3>
              <p className="text-sm sm:text-base text-[#262626]">
                Descubre oportunidades ocultas para aumentar ventas y reducir costes innecesarios.
              </p>
            </div>

            <div className="bg-gray-200 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-purple-100 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#262626] mb-2 sm:mb-3">100% seguro</h3>
              <p className="text-sm sm:text-base text-[#262626]">
                Tus datos estan encriptados y protegidos. Nunca compartimos tu informacion.
              </p>
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div id="como-funciona" className="py-16 sm:py-32">
          <h2 className="text-2xl sm:text-4xl font-bold text-[#FFFCFF] text-center mb-3 sm:mb-4">
            Como funciona
          </h2>
          <p className="text-center text-[#FFFCFF] mb-10 sm:mb-16 text-base sm:text-lg px-4">
            3 pasos simples para optimizar tu negocio
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-gradient-to-br from-[#d98c21] to-[#d98c21] w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <span className="text-xl sm:text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#FFFCFF] mb-2 sm:mb-3">Fotografia facturas</h3>
              <p className="text-sm sm:text-base text-[#FFFCFF] px-4 sm:px-0">
                Sube fotos de tus facturas mensuales. La IA las procesa automaticamente en segundos.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-[#d98c21] to-[#d98c21] w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <span className="text-xl sm:text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#FFFCFF] mb-2 sm:mb-3">Analisis instantaneo</h3>
              <p className="text-sm sm:text-base text-[#FFFCFF] px-4 sm:px-0">
                Recibes metricas completas: margenes, punto de equilibrio, comparativa con el sector.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-[#d98c21] to-[#d98c21] w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <span className="text-xl sm:text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#FFFCFF] mb-2 sm:mb-3">Implementa consejos</h3>
              <p className="text-sm sm:text-base text-[#FFFCFF] px-4 sm:px-0">
                Sigue recomendaciones priorizadas para reducir costes y aumentar ventas hoy mismo.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="py-16 sm:py-32">
          <div className="bg-gradient-to-r from-[#d98c21] to-[#8A3C00] rounded-2xl p-8 sm:p-12 text-center text-white shadow-xl">     
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#FFFCFF] mb-3 sm:mb-4">
              Listo para optimizar tu negocio?
            </h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90">
              Unete a cientos de comercios que ya aumentaron sus beneficios
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-gray-200 text-[#d98c21] px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-gray-100 transition text-base sm:text-lg font-semibold shadow-lg"
            >
              Empezar ahora gratis
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer con enlaces dinámicos */}
      <LandingFooter />
    </div>
  )
}