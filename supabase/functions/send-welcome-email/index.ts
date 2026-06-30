import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const { record } = await req.json();

    if (!record || !record.email || !record.plz) {
      throw new Error('Invalid payload: email and plz required');
    }

    const { email, plz, role, operator, confirmation_token } = record;

    const operatorLine = operator
      ? `Dein Netzbetreiber vor Ort: <strong>${operator}</strong>.`
      : '';

    const roleText = {
      Konsument: 'als Stromverbraucher günstigere Tarife nutzen',
      Produzent: 'deinen selbst erzeugten Solarstrom mit Nachbarn teilen',
      Beides: 'sowohl Strom beziehen als auch deine PV-Überschüsse teilen',
    }[role] || 'teilnehmen';

    const confirmUrl = `https://kiez-power.de/confirm?token=${confirmation_token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">KiezPower</h1>
            <p style="color: #93c5fd; margin: 8px 0 0; font-size: 16px;">Deine Energie. Dein Kiez.</p>
          </div>
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">Bestätige deine Anmeldung 🎉</h2>
            <p style="font-size: 16px; color: #4b5563;">Danke, dass du dich für KiezPower in <strong>${plz}</strong> eingetragen hast.</p>
            <p style="font-size: 16px; color: #4b5563;">${operatorLine}</p>
            <p style="font-size: 16px; color: #4b5563;">Du möchtest ${roleText}. Um deine Anmeldung abzuschließen, klicke bitte auf den folgenden Button:</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Anmeldung bestätigen →</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">Oder kopiere diesen Link in deinen Browser:</p>
            <p style="font-size: 12px; color: #2563eb; word-break: break-all;">${confirmUrl}</p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Was passiert als Nächstes?</strong></p>
              <ul style="margin: 12px 0 0; padding-left: 20px; font-size: 14px; color: #166534;">
                <li>Nach Bestätigung zählen wir dich in deiner PLZ</li>
                <li>Wir prüfen die Nachfrage in deiner Region</li>
                <li>Bei kritischer Masse kontaktieren wir den Netzbetreiber</li>
              </ul>
            </div>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">Kein Spam. Nur eine E-Mail, wenn es losgeht. Abmeldung jederzeit möglich.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">KiezPower · Lokale Energiegemeinschaften nach §42c EnWG</p>
          </div>
        </body>
      </html>
    `;

    const text = `
Bestätige deine Anmeldung 🎉

Danke, dass du dich für KiezPower in ${plz} eingetragen hast.
${operator ? `Dein Netzbetreiber vor Ort: ${operator}.` : ''}
Du möchtest ${roleText}. Um deine Anmeldung abzuschließen, klicke bitte auf den folgenden Link:

${confirmUrl}

Was passiert als Nächstes?
- Nach Bestätigung zählen wir dich in deiner PLZ
- Wir prüfen die Nachfrage in deiner Region
- Bei kritischer Masse kontaktieren wir den Netzbetreiber

Kein Spam. Nur eine E-Mail, wenn es losgeht. Abmeldung jederzeit möglich.

---
KiezPower · Lokale Energiegemeinschaften nach §42c EnWG
    `.trim();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KiezPower <warteliste@kiezpower.de>',
        to: [email],
        subject: `Du bist auf der KiezPower-Warteliste für ${plz} 🎉`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error: ${err}`);
    }

    const data = await res.json();

    // Log to Supabase for audit trail
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.from('email_log').insert({
      email,
      plz,
      role,
      operator,
      resend_id: data.id,
      status: 'sent',
    });

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Welcome email error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});