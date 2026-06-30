import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default withSupabase(
  { auth: ["publishable", "secret"] },
  async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY not configured");
      }

      const { record } = await req.json();

      if (!record || !record.email || !record.company) {
        throw new Error("Invalid payload: email and company required");
      }

      const { email, company, message } = record;

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
            <h2 style="color: #111827; margin-top: 0; font-size: 22px;">Danke für Ihre Demo-Anfrage! 🎉</h2>
            <p style="font-size: 16px; color: #4b5563;">Wir haben Ihre Anfrage von <strong>${company}</strong> erhalten und melden uns in Kürze bei Ihnen.</p>
            <p style="font-size: 16px; color: #4b5563;">In der Demo zeigen wir Ihnen, wie KiezPower lokale Energiegemeinschaften nach §42c EnWG für Netzbetreiber und Stadtwerke umsetzt — von der Registrierung bis zum aktiven Stromsharing.</p>

            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>Was Sie in der Demo erwartet:</strong></p>
              <ul style="margin: 12px 0 0; padding-left: 20px; font-size: 14px; color: #1e40af;">
                <li>Live-Walkthrough der KiezPower-Plattform</li>
                <li>Technische Integration in Ihre bestehende Infrastruktur</li>
                <li>Pilotprojekt-Planung für Ihr Versorgungsgebiet</li>
                <li>Regulatorische Anforderungen und Compliance</li>
              </ul>
            </div>

            <p style="font-size: 16px; color: #4b5563;">Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen unter <a href="mailto:${email}" style="color: #2563eb;">${email}</a>.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">KiezPower · Lokale Energiegemeinschaften nach §42c EnWG · <a href="mailto:info@kiez-power.de" style="color: #6b7280;">info@kiez-power.de</a></p>
          </div>
        </body>
      </html>
    `;

      const text = `
Danke für Ihre Demo-Anfrage!

Wir haben Ihre Anfrage von ${company} erhalten und melden uns in Kürze bei Ihnen.

In der Demo zeigen wir Ihnen, wie KiezPower lokale Energiegemeinschaften nach §42c EnWG für Netzbetreiber und Stadtwerke umsetzt — von der Registrierung bis zum aktiven Stromsharing.

Was Sie in der Demo erwartet:
- Live-Walkthrough der KiezPower-Plattform
- Technische Integration in Ihre bestehende Infrastruktur
- Pilotprojekt-Planung für Ihr Versorgungsgebiet
- Regulatorische Anforderungen und Compliance

Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen unter ${email}.

---
KiezPower · Lokale Energiegemeinschaften nach §42c EnWG · info@kiez-power.de
    `.trim();

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "KiezPower <demo@kiezpower.de>",
          to: [email],
          bcc: ["info@kiez-power.de"],
          subject: `Ihre Demo-Anfrage bei KiezPower — wir melden uns bald! 🎉`,
          html,
          text,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend API error: ${err}`);
      }

      const data = await res.json();

      const supabase = ctx.supabaseAdmin;
      await supabase.from("demo_email_log").insert({
        email,
        company,
        message: message || null,
        resend_id: data.id,
        status: "sent",
      });

      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      console.error("Demo email error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  },
);
