// ============================================================
// LIB: Email — lib/email.ts
// Envío de emails usando Resend
// ============================================================


import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ============================================================
// Sanitización XSS - Previene inyección de código en emails
// ============================================================
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface SendEmailNotificationParams {
  to: string
  subject: string
  body: string
  url?: string
}

export async function sendEmailNotification({
  to,
  subject,
  body,
  url
}: SendEmailNotificationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY no configurada')
      return { success: false, error: 'Servicio de email no configurado' }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rekalcula.com'
    const actionUrl = url ? `${appUrl}${url}` : appUrl

    const { data, error } = await resend.emails.send({
      from: 'ReKalcula <onboarding@resend.dev>',
      to: [to],
      subject: escapeHtml(subject),
      html: buildEmailHTML({
        subject: escapeHtml(subject),
        body: escapeHtml(body),
        actionUrl: encodeURI(actionUrl)
      })
    })

    if (error) {
      console.error('[Email] Error Resend:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err: any) {
    console.error('[Email] Error:', err)
    return { success: false, error: err.message || 'Error al enviar email' }
  }
}

// ============================================================
// Template HTML del email
// ============================================================
function buildEmailHTML({
  subject,
  body,
  actionUrl
}: {
  subject: string
  body: string
  actionUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f0f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f0f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%;">
          
          <!-- Header con logo reKalcula -->
          <tr>
            <td align="center" style="background-color: #262626; padding: 28px 24px; border-radius: 12px 12px 0 0;">
              <span style="font-size: 52px; font-weight: 800; letter-spacing: -1px;"><span style="color: #ffffff;">re</span><span style="color: #d98c21;">K</span><span style="color: #ffffff;">alcula</span></span>
            </td>
          </tr>
          
          <!-- Contenido principal -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 36px 28px 32px;">
              <!-- Icono campana -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" valign="middle" style="width: 48px; height: 48px; background-color: #d98c21; border-radius: 12px;">
                    <span style="font-size: 24px; line-height: 48px;">🔔</span>
                  </td>
                </tr>
              </table>
              
              <!-- Título -->
              <h2 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0; line-height: 1.4;">
                ${subject}
              </h2>
              
              <!-- Mensaje -->
              <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 0 0 28px 0;">
                ${body}
              </p>
              
              <!-- Botón CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color: #d98c21; border-radius: 8px;">
                    <a href="${actionUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none;">Ver en reKalcula</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f7f7f7; padding: 20px 28px; border-radius: 0 0 12px 12px; border-top: 1px solid #eeeeee;">
              <p style="font-size: 11px; color: #999999; line-height: 1.5; margin: 0;">
                Recibiste este correo porque tienes las notificaciones por email activadas en tu cuenta de reKalcula.<br>
                Si no deseas recibir estos correos, <a href="${actionUrl.split('/').slice(0, 3).join('/')}/dashboard/notifications" style="color: #d98c21; text-decoration: none;">gestiona tus preferencias aquí</a>.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================================
// Email de bienvenida para nuevos usuarios
// ============================================================
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Servicio de email no configurado' }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rekalcula.com'
    const safeName = escapeHtml(userName)

    const { error } = await resend.emails.send({
      from: 'ReKalcula <onboarding@resend.dev>',
      to: [to],
      subject: `¡Bienvenido a reKalcula, ${safeName}! 🎉`,
      html: buildWelcomeEmailHTML({ userName: safeName, appUrl })
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al enviar email de bienvenida' }
  }
}

function buildWelcomeEmailHTML({
  userName,
  appUrl
}: {
  userName: string
  appUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f0f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0f0f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #262626; padding: 28px 24px; border-radius: 12px 12px 0 0;">
              <span style="font-size: 52px; font-weight: 800; letter-spacing: -1px;">
                <span style="color: #ffffff;">re</span><span style="color: #d98c21;">K</span><span style="color: #ffffff;">alcula</span>
              </span>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 40px 36px 36px;">
              
              <!-- Emoji bienvenida -->
              <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
              
              <!-- Saludo -->
              <h2 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 12px 0;">
                ¡Hola, ${userName}!
              </h2>
              <p style="font-size: 15px; color: #444444; line-height: 1.6; margin: 0 0 28px 0;">
                Tu cuenta en <strong>reKalcula</strong> está lista. Ahora puedes gestionar tu negocio sin complicaciones fiscales.
              </p>

              <!-- Features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px; text-align: left;">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                    ✅ &nbsp;Registra y analiza tus facturas automáticamente
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                    ✅ &nbsp;Controla tu cashflow y previsión de tesorería
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                    ✅ &nbsp;Calcula IVA e IRPF sin errores
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #374151;">
                    ✅ &nbsp;Recibe análisis y recomendaciones con IA
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color: #d98c21; border-radius: 8px;">
                    <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">
                      Ir a mi panel →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f7f7f7; padding: 20px 28px; border-radius: 0 0 12px 12px; border-top: 1px solid #eeeeee;">
              <p style="font-size: 11px; color: #999999; line-height: 1.5; margin: 0;">
                Has recibido este correo porque te has registrado en reKalcula.<br>
                Si no deseas recibir estos correos, <a href="${appUrl}/dashboard/notifications" style="color: #d98c21; text-decoration: none;">gestiona tus preferencias aquí</a>.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}