# Spec: E-Mail-Nurturing-Kanal (KiezPower)

**Datum:** 2026-06-25  
**Status:** Approved  
**Bezug:** Paperclip CEO Task #03

---

## Kontext

KiezPower hat eine funktionierende Waitlist (Supabase-Tabelle `waitlist`, Felder: `email`, `plz`, `role`), aber keinen E-Mail-Kanal. Passive Waitlist-Einträge kühlen bis zum Pilot-Start ab. Dieser Kanal verwandelt Einträge in eine engagierte Pilot-Community und ist der einzige owned Channel — unabhängig von Social-Algorithmen.

**Doppelter Zweck:** (1) Retention bis Pilot-Start, (2) Verdichtungs-Signal — wer öffnet/klickt, ist echter Pilot-Kandidat für das Stadtwerk-Gespräch.

---

## Technische Architektur

**ESP:** Brevo (DSGVO-konform, EU-Hosting Frankfurt, Free-Plan: 300 Mails/Tag)  
**Trigger:** ESP-native Automation via Supabase Database Webhook → Brevo API  
**Keine Code-Änderungen an der Astro-Site erforderlich.**

```
WaitlistForm.astro (unverändert)
  → Supabase INSERT (waitlist: email, plz, role)
  → Supabase Database Webhook (POST on INSERT)
  → Brevo API /v3/contacts: Kontakt + Attribute (PLZ, ROLE)
  → Brevo DOI-Automation → DOI-Mail an User
  → User klickt Bestätigungslink → Status "Confirmed"
  → Welcome Automation startet
  → Mail 1 (sofort) → Mail 2 (+3d) → Mail 3 (+7d) → Mail 4 (+14d)
```

### Brevo-Konfiguration

**Custom Contact Attributes:**
- `PLZ` (Text) ← `waitlist.plz`
- `ROLE` (Text) ← `waitlist.role` (Konsument / Produzent / Beides)

**Supabase Webhook Payload:**
```json
{
  "email": "{{record.email}}",
  "attributes": {
    "PLZ": "{{record.plz}}",
    "ROLE": "{{record.role}}"
  },
  "listIds": [<brevo-list-id>],
  "updateEnabled": false
}
```

**Webhook-Ziel:** `https://api.brevo.com/v3/contacts`  
**Headers:** `api-key: <BREVO_API_KEY>`, `Content-Type: application/json`

---

## DOI-Mail

Neutral, kein Marketing-Content (DSGVO-Pflicht vor Bestätigung).

**Betreff:** Bitte bestätige deine E-Mail-Adresse für KiezPower

> Hallo,
>
> du hast dich gerade auf der Warteliste von KiezPower eingetragen. Bitte bestätige deine E-Mail-Adresse, damit wir dich benachrichtigen können, sobald KiezPower in deiner PLZ verfügbar ist.
>
> [Button: Ja, ich möchte benachrichtigt werden →]
>
> Wenn du dich nicht angemeldet hast, kannst du diese Mail ignorieren.
>
> Christian Roessler · KiezPower · Dierhäger Str. 2, 18347 Dierhagen  
> [Abmelde-Link] · [Impressum]

---

## Welcome-Sequence (4 Mails)

**Absender:** Christian Roessler `<info@kiez-power.de>`  
**Scope:** Nur neue Subscriber ab Integration (keine Retroaktivierung)

---

### Mail 1 — Willkommen + Vision
**Säule:** Locality · **Timing:** sofort nach DOI-Bestätigung

**Betreff:** Du bist dabei — dein Kiez wird unabhängiger

> Hallo,
>
> danke, dass du dir kurz Zeit genommen hast, deine Mail zu bestätigen. Das bedeutet mir viel.
>
> Ich bin Christian, Gründer von KiezPower. Was ich aufbaue: eine Plattform, die Nachbarn direkt miteinander vernetzt — Solarstromerzeuger teilen ihren Überschuss mit Konsumenten im selben Kiez. Lokal, transparent, vollautomatisch.
>
> Du bist jetzt Teil einer Gemeinschaft, die wir Schritt für Schritt in einem Kiez nach dem anderen aufbauen. Je mehr Nachbarn in deiner PLZ dabei sind, desto schneller starten wir dort.
>
> **Was dich in den nächsten Wochen erwartet:** Ich werde dir erklären, wie Nachbarschaftsstrom funktioniert, warum gerade jetzt der richtige Zeitpunkt ist — und wie du deinen Kiez aktiv mitgestalten kannst. Kein Spam, versprochen.
>
> Bis bald,  
> Christian
>
> *KiezPower · Lokal. Grün. Automatisch.*  
> [Abmelde-Link] · [Impressum]

---

### Mail 2 — Education
**Säule:** Education · **Timing:** +3 Tage

**Betreff:** Wie funktioniert eigentlich Nachbarschaftsstrom?

> Hallo,
>
> ich bekomme diese Frage oft: „Wie geht das technisch überhaupt — Strom vom Nachbarn kaufen?"
>
> Kurze Antwort: § 42c des Energiewirtschaftsgesetzes (EnWG) macht es seit 2024 möglich. Er erlaubt es Plattformen wie KiezPower, als IT-Dienstleister Solarstromerzeuger und Konsumenten im selben Niederspannungsnetz zu verbinden.
>
> **Was KiezPower macht:** Wir übernehmen die Abrechnung, Messung und Vertragsgestaltung im Hintergrund — vollautomatisch. Du kaufst oder verkaufst Strom im Kiez, ohne selbst Verträge verhandeln zu müssen.
>
> **Was KiezPower nicht macht:** Wir sind kein Stromlieferant. Wir sind eine Plattform — wie ein digitaler Marktplatz für lokale Energie.
>
> Das Netz deines Stadtwerks bleibt dein Backup. Nichts ändert sich an deinem Hausanschluss.
>
> Hast du Fragen dazu? Antworte einfach auf diese Mail — ich lese jede Antwort.
>
> Christian  
> [Abmelde-Link] · [Impressum]

---

### Mail 3 — Regulation / Timing
**Säule:** Regulation · **Timing:** +7 Tage

**Betreff:** Warum gerade jetzt der richtige Zeitpunkt ist

> Hallo,
>
> ein kurzer Gedanke, der mir wichtig ist:
>
> Wer heute eine neue Solaranlage installiert, bekommt eine staatliche Einspeisevergütung — aber diese Förderung läuft für neue Anlagen ab 2027 aus. Was dann? Wer seinen Strom ins Netz einspeist, bekommt kaum noch etwas dafür.
>
> Nachbarschaftsstrom ist die Antwort darauf. Statt deinen Solarstrom für wenige Cent ins öffentliche Netz zu geben, bleibt er im Kiez — und schafft dort echten Mehrwert.
>
> **KiezPower nutzt genau dieses Zeitfenster.** Wir bauen jetzt die Infrastruktur auf, damit die ersten Pilotgemeinschaften 2026 loslegen können — bevor der Wechsel für Neubau-PV-Anlagen obligatorisch wird.
>
> Du bist früh dabei. Das zählt.
>
> Christian  
> [Abmelde-Link] · [Impressum]

---

### Mail 4 — Soft-Ask / Verdichtung
**Säule:** Product/Vision · **Timing:** +14 Tage

**Betreff:** Kennst du Nachbarn mit Solaranlage?

> Hallo,
>
> ich möchte dich um etwas bitten — und zwar ganz konkret.
>
> KiezPower funktioniert am besten, wenn in einer PLZ genug Nachbarn mitmachen: Erzeuger und Konsumenten, die sich lokal ergänzen. Je dichter das Netz, desto schneller können wir in deiner PLZ starten.
>
> **Meine Bitte an dich:** Wenn du einen Nachbarn, Freund oder Bekannten kennst, der eine Solaranlage hat oder günstigen Strom aus der Nachbarschaft beziehen möchte — leite ihnen einfach diese Mail oder unsere Webseite weiter.
>
> [Button: KiezPower weiterempfehlen →] (https://kiez-power.de)
>
> Das ist alles. Keine Provision, kein Druck — nur ein Kiez, der ein bisschen unabhängiger wird.
>
> Danke, dass du dabei bist.  
> Christian  
> [Abmelde-Link] · [Impressum]

---

## Compliance-Guardrails

| Regel | Anforderung | Umsetzung |
|---|---|---|
| DSGVO DOI | Keine Marketing-Mail vor Bestätigung | Brevo DOI-Flow; Automation startet erst nach DOI-Klick |
| Abmelde-Link | Pflicht in jeder Mail | Brevo `{unsubscribe}` im Footer-Template |
| Impressum | In jeder Mail | Footer: Christian Roessler, Dierhäger Str. 2, 18347 Dierhagen |
| § 5 UWG | Keine kWh-Preise, keine Ersparnis-Claims | Alle 4 Mails geprüft: kein "Spare X €", kein "X ct/kWh" |
| § 42c-Framing | Plattform/IT-Provider, nie Stromlieferant | Mail 2 explizit: "Wir sind kein Stromlieferant" |
| Absender | Founder-led | Von: Christian Roessler `<info@kiez-power.de>` |

**Tabu-Liste (dauerhaft für alle KiezPower-Mails):**
- ❌ "Spare X €" / "X % günstiger"
- ❌ kWh-Preisangaben jeglicher Art
- ❌ "Stromlieferant", "Energieversorger", "Tarif"
- ✅ "Plattform", "IT-Dienstleister", "Nachbarschaftsstrom", "Gemeinschaft"

---

## Segmentierungslogik

| Attribut | Werte | Jetzt | Später (Pilot-Vorbereitung) |
|---|---|---|---|
| `PLZ` | 5-stellig | Welcome Sequence identisch für alle | "X Nachbarn in deiner PLZ warten schon" |
| `ROLE` | Konsument / Produzent / Beides | Welcome Sequence identisch für alle | Segment-Kampagnen: Produzent → PV-Optimierung; Konsument → günstig beziehen |

---

## Einrichtungsschritte

1. **Brevo-Konto** — Account auf brevo.com, EU-Datenhaltung Frankfurt, Sender-Domain `kiez-power.de` verifizieren (SPF, DKIM, DMARC)
2. **Custom Attributes + Listen** — `PLZ` (Text), `ROLE` (Text); Liste "Waitlist" anlegen
3. **DOI-Template** — Standard-Template mit obigem Text überschreiben, Footer mit Impressum
4. **Mail-Templates 1–4** — Im Brevo-Editor erfassen, Absender: "Christian von KiezPower"
5. **Welcome Automation** — Trigger: Confirmed-Status nach DOI; Delay-Kette: sofort → +3d → +7d → +14d
6. **Supabase Webhook** — Dashboard → Database → Webhooks → New Webhook; Event: INSERT auf `waitlist`; Ziel: Brevo API
7. **End-to-End-Test** — Test-Signup → DOI-Mail → Klick → Mail 1 prüfen → Automation-Status prüfen

---

## Verifikation

- [ ] DOI-Mail kommt an, Bestätigungslink funktioniert
- [ ] Mail 1 folgt sofort nach DOI-Klick, Absender "Christian von KiezPower"
- [ ] Kein Preis-Claim in allen 4 Mails
- [ ] Abmelde-Link in jeder Mail aktiv
- [ ] Impressum im Footer sichtbar
- [ ] Brevo-Kontakt hat `PLZ` + `ROLE` als Attribute gesetzt
- [ ] Automation zeigt Delay-Kette: sofort → +3d → +7d → +14d
