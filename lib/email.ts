
// ============================================================
// LIB: Email — lib/email.ts
// Envío de emails usando Resend
// ============================================================

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      from: 'noreply@rekalcula.com',
      to: [to],
      subject: subject,
      html: buildEmailHTML({ subject, body, actionUrl })
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f0f0f0;
      padding: 32px 16px;
      color: #1a1a1a;
    }
    .wrapper { max-width: 520px; margin: 0 auto; }
    .header {
      background: #262626;
      padding: 28px 24px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .logo-text {
      color: #d98c21;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .card {
      background: #ffffff;
      padding: 36px 28px 32px;
    }
    .icon-wrap {
      width: 48px;
      height: 48px;
      background: #d98c21;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-wrap svg { width: 24px; height: 24px; }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    p.desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    a.cta {
      display: inline-block;
      background: #d98c21;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s;
    }
    a.cta:hover { background: #c47d1d; }
    .footer {
      background: #f7f7f7;
      padding: 20px 28px;
      border-radius: 0 0 12px 12px;
      border-top: 1px solid #eeeeee;
    }
    .footer p {
      font-size: 11px;
      color: #999;
      line-height: 1.5;
    }
    .footer a { color: #d98c21; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">reKalcula</div>
    </div>
    <div class="card">
      <div class="icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </div>
      <h2>${subject}</h2>
      <p class="desc">${body}</p>
      <a href="${actionUrl}" class="cta">Ver en reKalcula</a>
    </div>
    <div class="footer">
      <p>
        Recibiste este correo porque tienes las notificaciones por email activadas en tu cuenta de reKalcula.<br>
        Si no deseas recibir estos correos, <a href="${actionUrl.split('/').slice(0, 3).join('/')}/dashboard/notifications">gestiona tus preferencias aquí</a>.
      </p>
    </div>
  </div>
</body>
</html>`
}
