// app/api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  
  if (payload.type === 'user.created') {
    // Guardar en tu BD con términos aceptados
    await supabase.from('users').insert({
      id: payload.data.id,
      email: payload.data.email_addresses[0].email_address,
      terms_accepted: payload.data.unsafe_metadata.termsAccepted,
      terms_accepted_at: payload.data.unsafe_metadata.termsAcceptedAt,
      terms_version: payload.data.unsafe_metadata.termsVersion,
    });
  }
}