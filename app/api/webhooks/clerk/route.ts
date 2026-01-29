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

    // Inicializar Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Procesar evento de usuario creado
    if (evt.type === 'user.created') {
      const userData = evt.data;

      // 1. Guardar en BD con términos aceptados
      const { error: userError } = await supabase.from('users').insert({
        id: userData.id,
        email: userData.email_addresses[0].email_address,
        terms_accepted: userData.unsafe_metadata?.termsAccepted || false,
        terms_accepted_at: userData.unsafe_metadata?.termsAcceptedAt || null,
        terms_version: userData.unsafe_metadata?.termsVersion || null,
        created_at: new Date().toISOString(),
      });

      if (userError) {
        console.error('Error guardando usuario en BD:', userError);
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        );
      }

      // 2. Obtener configuración del trial
      const { data: trialConfig } = await supabase
        .from('trial_config')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Usar valores de la BD o por defecto
      const trialDays = trialConfig?.trial_days || 7;
      const invoicesLimit = trialConfig?.invoices_limit || 10;
      const ticketsLimit = trialConfig?.tickets_limit || 10;
      const analysesLimit = trialConfig?.analyses_limit || 5;

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialDays);

      // 3. Crear suscripción trial
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: userData.id,
        status: 'trialing',
        plan: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString()
      });

      if (subError) {
        console.error('Error creando suscripción:', subError);
      }

      // 4. Crear créditos iniciales
      const { error: creditsError } = await supabase.from('user_credits').insert({
        user_id: userData.id,
        invoices_available: invoicesLimit,
        tickets_available: ticketsLimit,
        analyses_available: analysesLimit,
        invoices_used_this_month: 0,
        tickets_used_this_month: 0,
        analyses_used_this_month: 0,
        is_trial: true,
        last_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      });

      if (creditsError) {
        console.error('Error creando créditos:', creditsError);
      }

      // 5. Registrar transacción de créditos
      await supabase.from('credit_transactions').insert({
        user_id: userData.id,
        transaction_type: 'trial_start',
        credit_type: 'invoices',
        amount: invoicesLimit,
        description: `Créditos de prueba gratuita (${trialDays} días): ${invoicesLimit} facturas, ${ticketsLimit} tickets, ${analysesLimit} análisis`
      });

      // 6. Log de auditoría de términos
      if (userData.unsafe_metadata?.termsAccepted) {
        await supabase.from('terms_acceptance_log').insert({
          user_id: userData.id,
          terms_version: userData.unsafe_metadata.termsVersion || '1.0',
          accepted_at: userData.unsafe_metadata.termsAcceptedAt || new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown',
        });
      }

      console.log(`Usuario ${userData.id} creado con trial de ${trialDays} días y ${invoicesLimit}/${ticketsLimit}/${analysesLimit} créditos`);
    }

    // Procesar evento de usuario eliminado
    if (evt.type === 'user.deleted') {
      const userData = evt.data;

      // Limpiar datos del usuario en orden (por foreign keys)
      await supabase.from('credit_transactions').delete().eq('user_id', userData.id);
      await supabase.from('user_credits').delete().eq('user_id', userData.id);
      await supabase.from('invoices').delete().eq('user_id', userData.id);
      await supabase.from('sales').delete().eq('user_id', userData.id);
      await supabase.from('subscriptions').delete().eq('user_id', userData.id);
      await supabase.from('terms_acceptance_log').delete().eq('user_id', userData.id);
      await supabase.from('users').delete().eq('id', userData.id);

      console.log(`Usuario ${userData.id} eliminado completamente`);
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