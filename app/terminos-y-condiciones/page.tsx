// app/terminos-y-condiciones/page.tsx

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header con branding */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            re<span className="text-orange-500">K</span>alcula
          </h1>
          <div className="h-1 w-20 bg-orange-500 rounded"></div>
        </div>

        {/* Contenedor principal */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl p-8">
          
          <article className="prose prose-lg prose-invert max-w-none">
            
            {/* Título principal */}
            <h1 className="text-3xl font-bold text-white mb-2">
              Términos y Condiciones de Uso de Rekalcula
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              <strong>Última actualización: 19 de enero de 2026</strong>
            </p>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 1 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              1. ACEPTACIÓN DE LOS TÉRMINOS
            </h2>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Al registrarse y utilizar Rekalcula (en adelante, "la Plataforma"), 
              el usuario (en adelante, "el Usuario") acepta expresamente y sin reservas 
              estos Términos y Condiciones, así como la Política de Privacidad de la Plataforma.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
              <p className="text-orange-400 font-semibold mb-0">
                ⚠️ La aceptación de estos términos es condición indispensable para acceder y usar la Plataforma.
              </p>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 2 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              2. IDENTIFICACIÓN DEL PRESTADOR DEL SERVICIO
            </h2>
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <p className="text-gray-300 mb-2"><strong className="text-white">Denominación social:</strong> [Nombre de la empresa titular de Rekalcula]</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">NIF/CIF:</strong> [Número de identificación fiscal]</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Domicilio social:</strong> [Dirección completa]</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Correo electrónico:</strong> [email de contacto]</p>
              <p className="text-gray-300 mb-0"><strong className="text-white">Datos registrales:</strong> [Registro Mercantil, si aplica]</p>
            </div>
            <p className="text-gray-300 mb-4">Este servicio se presta conforme a la legislación española vigente.</p>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 3 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              3. OBJETO Y NATURALEZA DEL SERVICIO
            </h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Definición del servicio</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              Rekalcula es una <strong className="text-white">herramienta de gestión económica y fiscal automatizada</strong> que 
              proporciona funcionalidades de cálculo, registro contable, análisis de flujos de caja y 
              generación de informes orientados a pequeñas empresas, autónomos y sociedades en España.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Naturaleza del servicio</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Lo que NO es */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-3">❌ Rekalcula NO es:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Un asesor fiscal, contable o financiero profesional</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Un servicio de asesoría personalizada</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Un sustituto del asesoramiento profesional</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Un servicio que garantice el cumplimiento tributario</span>
                  </li>
                </ul>
              </div>
              
              {/* Lo que SÍ es */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-semibold mb-3">✅ Rekalcula es:</p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Una <strong className="text-white">herramienta de apoyo</strong> a la gestión</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Un <strong className="text-white">sistema automatizado</strong> basado en algoritmos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Un <strong className="text-white">recurso informativo</strong> para organización de datos</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 4 - CRÍTICA */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              4. EXENCIÓN DE RESPONSABILIDAD (DISCLAIMER)
            </h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Responsabilidad sobre la información</h3>
            <p className="text-gray-300 mb-4">El Usuario reconoce y acepta expresamente que:</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-[#2a2a2a] border-l-4 border-orange-500 p-4 rounded">
                <p className="text-white font-semibold mb-2">1. Carácter informativo</p>
                <p className="text-gray-300 mb-0">
                  Los cálculos, proyecciones, informes y recomendaciones generados por Rekalcula tienen 
                  carácter <strong className="text-orange-400">meramente informativo y orientativo</strong>.
                </p>
              </div>
              
              <div className="bg-[#2a2a2a] border-l-4 border-orange-500 p-4 rounded">
                <p className="text-white font-semibold mb-2">2. Responsabilidad del usuario</p>
                <p className="text-gray-300 mb-0">
                  La responsabilidad final sobre cualquier decisión económica, fiscal o financiera corresponde 
                  <strong className="text-orange-400"> única y exclusivamente al Usuario</strong>.
                </p>
              </div>
              
              <div className="bg-[#2a2a2a] border-l-4 border-red-500 p-4 rounded">
                <p className="text-white font-semibold mb-2">3. Rekalcula NO se responsabiliza de:</p>
                <ul className="space-y-2 text-gray-300 mt-2">
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">→</span>
                    <span>Errores derivados de información incorrecta del Usuario</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">→</span>
                    <span>Pérdidas económicas o sanciones fiscales</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">→</span>
                    <span>Cambios normativos posteriores a la actualización</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">→</span>
                    <span>Diferencias con interpretaciones de la Agencia Tributaria</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-400 mr-2">→</span>
                    <span>Daños indirectos o lucro cesante</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Recomendación de asesoramiento profesional</h3>
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50 rounded-lg p-6 mb-6">
              <p className="text-orange-400 font-bold text-lg mb-2">⚠️ IMPORTANTE</p>
              <p className="text-white font-semibold mb-0">
                SE RECOMIENDA EXPRESAMENTE AL USUARIO que consulte con un asesor fiscal, gestor contable 
                o profesional cualificado antes de tomar decisiones basadas en la información proporcionada 
                por Rekalcula.
              </p>
            </div>
            <p className="text-gray-300 mb-4">
              La Plataforma no sustituye el criterio profesional de un experto en materia fiscal, 
              contable o financiera.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Exclusión de garantías</h3>
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-3">Rekalcula no garantiza:</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>La ausencia de errores en los cálculos o algoritmos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>La actualización permanente de la normativa fiscal</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>La compatibilidad con todos los supuestos fiscales</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Resultados específicos de ahorro fiscal</span>
                </li>
              </ul>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.4 Limitación de responsabilidad</h3>
            <p className="text-gray-300 mb-4">
              En ningún caso la responsabilidad de Rekalcula superará el importe total abonado por el Usuario 
              durante los 12 meses anteriores al hecho que genere la reclamación.
            </p>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Sección 5 */}
            <h2 className="text-2xl font-semibold text-orange-500 mt-8 mb-4">
              5. OBLIGACIONES DEL USUARIO
            </h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Veracidad y exactitud de los datos</h3>
            <p className="text-gray-300 mb-3">El Usuario se compromete a:</p>
            <div className="grid md:grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-blue-400 font-medium mb-0">✓ Introducir información veraz y exacta</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-blue-400 font-medium mb-0">✓ Revisar periódicamente los datos</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-blue-400 font-medium mb-0">✓ No usar como único soporte fiscal</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-blue-400 font-medium mb-0">✓ Conservar documentación original</p>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Uso responsable</h3>
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
              <p className="text-white font-semibold mb-3">El Usuario se compromete a:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Usar la Plataforma conforme a la legalidad vigente</li>
                <li>• No intentar alterar o manipular el sistema</li>
                <li>• No utilizar para fines fraudulentos o ilícitos</li>
                <li>• Mantener la confidencialidad de credenciales</li>
              </ul>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            {/* Declaración final */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500 rounded-lg p-6 my-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                📋 DECLARACIÓN FINAL DE ACEPTACIÓN
              </h2>
              <p className="text-orange-400 font-semibold mb-4">
                AL MARCAR LA CASILLA DE ACEPTACIÓN Y COMPLETAR EL REGISTRO, EL USUARIO DECLARA:
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-green-400 font-bold mr-3 text-lg">1.</span>
                  <p className="text-gray-200 mb-0">Haber leído, comprendido y aceptado estos Términos y Condiciones</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 font-bold mr-3 text-lg">2.</span>
                  <p className="text-gray-200 mb-0">Ser mayor de edad o contar con autorización legal</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 font-bold mr-3 text-lg">3.</span>
                  <p className="text-gray-200 mb-0">Comprender que Rekalcula es una herramienta de apoyo, no un asesor profesional</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 font-bold mr-3 text-lg">4.</span>
                  <p className="text-gray-200 mb-0">Asumir la responsabilidad exclusiva de las decisiones adoptadas</p>
                </div>
                <div className="flex items-start">
                  <span className="text-green-400 font-bold mr-3 text-lg">5.</span>
                  <p className="text-gray-200 mb-0">Reconocer la recomendación de consultar con profesionales</p>
                </div>
              </div>
            </div>
            
            <hr className="border-gray-700 my-8" />
            
            <p className="text-center text-gray-400 mt-8 mb-0">
              <strong>Fecha de última actualización: 19 de enero de 2026</strong>
            </p>
            
          </article>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 Rekalcula - Todos los derechos reservados
          </p>
        </div>
        
      </div>
    </div>
  );
}