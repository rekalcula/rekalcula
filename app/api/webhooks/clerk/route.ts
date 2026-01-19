import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';

export async function POST(req: NextRequest) {
  try {
    // Verificar firma del webhook (recomendado en producción)
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET no configurado');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Obtener headers
    const svix_id = req.headers.get('svix-id');
    const svix_timestamp = req.headers.get('svix-timestamp');
    const svix_signature = req.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Obtener body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Verificar firma
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any;
    } catch (err) {
      console.error('Error verificando webhook:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // ⚠️ INICIALIZAR SUPABASE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Procesar evento de usuario creado
    if (evt.type === 'user.created') {
      const userData = evt.data;

      // Guardar en BD con términos aceptados
      const { error } = await supabase.from('users').insert({
        id: userData.id,
        email: userData.email_addresses[0].email_address,
        terms_accepted: userData.unsafe_metadata?.termsAccepted || false,
        terms_accepted_at: userData.unsafe_metadata?.termsAcceptedAt || null,
        terms_version: userData.unsafe_metadata?.termsVersion || null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error guardando usuario en BD:', error);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }

      // Log de auditoría
      if (userData.unsafe_metadata?.termsAccepted) {
        await supabase.from('terms_acceptance_log').insert({
          user_id: userData.id,
          terms_version: userData.unsafe_metadata.termsVersion || '1.0',
          accepted_at: userData.unsafe_metadata.termsAcceptedAt || new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error en webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}