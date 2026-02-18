import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import crypto from 'crypto'

const VALID_CONTRACT_VERSIONS = ['1.0']

const CONTRACT_TEXTS: Record<string, string> = {
  '1.0': `reKalcula - Plataforma de Gestión Económica y Fiscal
CONTRATO DE DESCARGO DE RESPONSABILIDAD Y CONDICIONES DE USO DE LA PLATAFORMA
Versión 1.0 - Febrero 2026

PREÁMBULO: El presente documento constituye un acuerdo legalmente vinculante entre el usuario y la plataforma reKalcula. Al acceder, registrarse o utilizar cualquiera de los servicios ofrecidos por reKalcula, el Usuario acepta íntegramente las condiciones aquí establecidas.

CLÁUSULA 1 - NATURALEZA DEL SERVICIO: reKalcula es una herramienta tecnológica de apoyo a la gestión económica y fiscal. NO es una asesoría fiscal, contable ni jurídica.

CLÁUSULA 2 - RESPONSABILIDAD DEL USUARIO: El Usuario es el único y exclusivo responsable de todas las decisiones económicas, fiscales, financieras y empresariales que adopte.

CLÁUSULA 3 - EXONERACIÓN DE RESPONSABILIDAD DE reKalcula: reKalcula queda expresamente exonerada de cualquier responsabilidad derivada de decisiones tomadas por el Usuario.

CLÁUSULA 4 - LIMITACIONES DE LA INTELIGENCIA ARTIFICIAL: Los módulos de IA generan estimaciones y no certezas. No sustituyen el criterio profesional de un asesor cualificado.

CLÁUSULA 5 - DATOS FISCALES Y OBLIGACIONES TRIBUTARIAS: El cumplimiento de las obligaciones tributarias es responsabilidad exclusiva del Usuario.

CLÁUSULA 6 - PROTECCIÓN DE DATOS: reKalcula trata los datos conforme al RGPD y la LOPDGDD.

CLÁUSULA 7 - DISPONIBILIDAD DEL SERVICIO: reKalcula no garantiza un funcionamiento ininterrumpido ni libre de errores.

CLÁUSULA 8 - MODIFICACIONES DEL CONTRATO: reKalcula podrá modificar los términos con preaviso de 15 días naturales.

CLÁUSULA 9 - LEGISLACIÓN APLICABLE: El contrato se rige conforme a la legislación española vigente.

CLÁUSULA 10 - ACEPTACIÓN: Al pulsar Acepto las condiciones de uso, el Usuario declara haber leído y comprendido íntegramente el presente documento.

© 2026 reKalcula. Todos los derechos reservados.`
}

// Rate limiting simple en memoria
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3600000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429 })
  }

  let contractVersion: string
  try {
    const body = await req.json()
    contractVersion = body?.contractVersion
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 })
  }

  if (!VALID_CONTRACT_VERSIONS.includes(contractVersion)) {
    return NextResponse.json({ error: 'Versión de contrato inválida' }, { status: 400 })
  }

  const contractText = CONTRACT_TEXTS[contractVersion]
  const contractHash = crypto.createHash('sha256').update(contractText, 'utf8').digest('hex')

  const headersList = await headers()
  const ip =
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const acceptedAt = new Date().toISOString()

  // Verificar idempotencia
  const { data: existing } = await supabase
    .from('terms_acceptance_log')
    .select('id, accepted_at')
    .eq('user_id', userId)
    .eq('contract_version', contractVersion)
    .single()

  if (!existing) {
    const { error: logError } = await supabase.from('terms_acceptance_log').insert({
      user_id: userId,
      contract_version: contractVersion,
      contract_hash: contractHash,
      accepted_at: acceptedAt,
      ip_address: ip,
      user_agent: userAgent,
      acceptance_method: 'dashboard_modal',
    })

    if (logError) {
      console.error('[Terms] Error insertando log:', logError)
      return NextResponse.json({ error: 'Error al registrar la aceptación' }, { status: 500 })
    }
  }

  // ✅ UPSERT — crea el registro si no existe (cubre Google OAuth sin webhook previo)
  let userEmail = 'unknown@oauth'
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || userEmail
  } catch (err) {
    console.warn('[Terms] No se pudo obtener email de Clerk:', err)
  }

  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: userId,
        email: userEmail,
        terms_accepted: true,
        terms_accepted_at: existing?.accepted_at || acceptedAt,
        terms_version: contractVersion,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    )

  if (upsertError) {
    console.error('[Terms] Error en upsert de users:', upsertError)
  }

  return NextResponse.json({ success: true, alreadyAccepted: !!existing })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ accepted: false })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('users')
    .select('terms_accepted, terms_accepted_at, terms_version')
    .eq('id', userId)
    .single()

  return NextResponse.json({
    accepted: data?.terms_accepted === true,
    acceptedAt: data?.terms_accepted_at || null,
  })
}