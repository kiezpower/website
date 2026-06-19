# Design: SEO Blog + /rechner/ Seite — KiezPower

**Datum:** 2026-06-19  
**Ziel:** Organischen SEO-Traffic durch 4 Blogartikel und eine eigenständige Rechner-Seite aufbauen.

---

## Kontext

KiezPower ist eine Astro-Static-Site (output: static, @astrojs/sitemap integriert). Sprache: Deutsch. Das Projekt hat bisher keine Blog-Infrastruktur. Ein `Calculator`-Komponente existiert bereits auf der Startseite und wird für `/rechner/` wiederverwendet.

---

## Ziel-Keywords

- "Strom an Nachbarn verkaufen"
- "P2P Stromhandel Deutschland"
- "§ 42c EnWG Energiegemeinschaft"
- "PV Strom besser verkaufen als Einspeisung"
- "Energiesharing Wohnanlage"
- "Einspeisevergütung 2026"
- "Energiegemeinschaft gründen"
- "günstig Strom kaufen vom Nachbarn"

---

## Neue Dateien

```
src/content/config.ts
src/content/blog/
  42c-enwg-p2p-stromhandel.md
  einspeiseverguetung-2026.md
  energiegemeinschaft-gruenden.md
  guenstiger-strom-nachbarn.md
src/pages/blog/index.astro
src/pages/blog/[...slug].astro
src/layouts/BlogLayout.astro
src/pages/rechner.astro
```

## Geänderte Dateien

```
src/components/Nav.astro   ← "Blog" + "Rechner" ins Menü (Desktop + Mobile)
```

---

## 1. Content Collection Schema (`src/content/config.ts`)

```ts
import { z, defineCollection } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.date(),
    keywords:    z.array(z.string()),
    readingTime: z.number().optional(), // Minuten, wird auto berechnet wenn fehlt
  }),
});

export const collections = { blog };
```

---

## 2. BlogLayout (`src/layouts/BlogLayout.astro`)

Erweitert `BaseLayout`. Props: `title`, `description`, `pubDate`, `keywords`, `readingTime`.

**Head-Ergänzungen:**
- `<meta name="keywords">` aus Article-Keywords
- JSON-LD `Article`-Schema: `headline`, `datePublished`, `author` (KiezPower), `publisher`

**Body-Struktur:**
```
<Nav />
<main class="blog-article">
  <div class="container">
    <nav class="breadcrumb">KiezPower → Blog → {title}</nav>
    <header>
      <span class="section-tag">Blog</span>
      <h1>{title}</h1>
      <p class="article-meta">{pubDate} · {readingTime} Min. Lesezeit</p>
    </header>
    <article class="prose">
      <slot />
    </article>
    <div class="article-cta">
      <!-- CTA-Block → Warteliste -->
    </div>
  </div>
</main>
<Footer />
```

**Prose-Styles:** Maximale Breite 720px, `line-height: 1.8`, `color: var(--muted)`, H2 in `var(--white)`, Links in `var(--green)`. Kein externes CSS-Framework.

---

## 3. Blog-Übersicht (`src/pages/blog/index.astro`)

- Lädt alle Einträge aus der `blog`-Collection via `getCollection('blog')`, sortiert nach `pubDate` absteigend.
- Rendert Article-Cards: Titel, Teaser (description), Datum, Lesezeit.
- SEO: `title="Blog — KiezPower"`, `description="P2P-Stromhandel, § 42c EnWG und Energiegemeinschaften erklärt."`

---

## 4. Article-Template (`src/pages/blog/[...slug].astro`)

- `getStaticPaths()` aus `getCollection('blog')`
- Rendert via `<Content />` (Astro Markdown-Renderer)
- Übergibt Frontmatter-Props an `BlogLayout`

---

## 5. /rechner/ Seite (`src/pages/rechner.astro`)

- Wiederverwendet `<Calculator />` Komponente direkt
- Eigene SEO-Meta: Title "Vorteilsrechner — KiezPower | Strom an Nachbarn verkaufen", Description mit Keywords
- FAQ-Akkordeon unterhalb (3 Fragen: Wie funktioniert der Preis? Was kostet KiezPower? Ab wann verfügbar?)
- CTA am Ende → `/#warteliste`
- Strukturiertes JSON-LD: `WebApplication` + `FAQPage`

---

## 6. Nav-Erweiterung (`src/components/Nav.astro`)

Desktop-Links erweitert um:
- "Blog" → `/blog/`
- "Rechner" → `/rechner/`

Beide zwischen den Anchor-Links und dem CTA-Button.  
Mobile-Menü: gleiche Links ergänzt.

---

## 7. Artikel-Inhalte

### Artikel 1: `42c-enwg-p2p-stromhandel.md`
**Titel:** § 42c EnWG einfach erklärt: So funktioniert P2P-Stromhandel legal  
**Primär-Keyword:** § 42c EnWG Energiegemeinschaft  
**Länge:** ~1000 Wörter  
**H2-Gliederung:**
1. Was regelt § 42c EnWG?
2. Wie funktioniert P2P-Stromhandel technisch?
3. Wer darf mitmachen?
4. Was KiezPower anders macht als klassische Versorger
5. Häufige Fragen zu § 42c EnWG
6. Fazit + interne Links

### Artikel 2: `einspeiseverguetung-2026.md`
**Titel:** Einspeisevergütung 2026: Warum deine PV-Anlage mehr verdienen kann  
**Primär-Keyword:** Einspeisevergütung 2026, PV Strom besser verkaufen  
**Länge:** ~1000 Wörter  
**H2-Gliederung:**
1. Aktuelle Einspeisevergütung 2026 im Überblick
2. Warum die Vergütung systematisch zu niedrig ist
3. Alternative: Strom direkt an Nachbarn verkaufen
4. Rechenbeispiel: EEG-Vergütung vs. P2P-Preis
5. Was du brauchst, um anzufangen
6. Fazit + CTA

### Artikel 3: `energiegemeinschaft-gruenden.md`
**Titel:** Energiegemeinschaft gründen: Checkliste für Stadtwerke & Wohnungsunternehmen  
**Primär-Keyword:** Energiegemeinschaft gründen, Energiesharing Wohnanlage  
**Länge:** ~1000 Wörter  
**H2-Gliederung:**
1. Was ist eine Energiegemeinschaft nach § 42c EnWG?
2. Rechtliche Voraussetzungen
3. Technische Anforderungen (Smartmeter, Messtechnik)
4. Schritt-für-Schritt Checkliste
5. Häufige Stolpersteine
6. Wie KiezPower den Aufwand abnimmt

### Artikel 4: `guenstiger-strom-nachbarn.md`
**Titel:** Günstig Strom kaufen vom Nachbarn: So sparst du 30–40 % in deinem Kiez  
**Primär-Keyword:** Strom vom Nachbarn kaufen, günstiger Strom Nachbarschaft  
**Länge:** ~1000 Wörter  
**H2-Gliederung:**
1. Warum Nachbar-Strom günstiger ist
2. Was "30–40 % Ersparnis" wirklich bedeutet (Energiepreis vs. Gesamtrechnung)
3. Wie P2P-Stromhandel im Alltag funktioniert
4. Was du brauchst als Konsument
5. Ist das überall möglich?
6. Fazit + CTA

---

## CTA-Block (Ende jedes Artikels)

```
╔══════════════════════════════════════════════════════════════╗
║  Bereit für günstigeren Strom aus der Nachbarschaft?        ║
║  Sichere dir jetzt deinen Platz auf der Warteliste.         ║
║  [Jetzt Platz sichern →]  (Link zu /#warteliste)            ║
╚══════════════════════════════════════════════════════════════╝
```

Styled analog zur bestehenden CTA-Komponente: grüner Border, `var(--green)` Button.

---

## Interne Verlinkungsstrategie

- Jeder Artikel verlinkt auf `/rechner/` an der inhaltlich passenden Stelle (z. B. "Berechne deinen Vorteil →")
- Jeder Artikel verlinkt auf `/faq/` für rechtliche Fragen
- Blog-Übersicht `/blog/` wird aus Nav verlinkt → alle Artikel bekommen PageRank über den Hub

---

## Sitemap

`@astrojs/sitemap` erkennt alle statisch generierten Seiten automatisch — `/blog/`, `/blog/[slug]` und `/rechner/` werden ohne weiteres Zutun eingetragen.

---

## Nicht im Scope

- Kommentarfunktion
- Newsletter-Integration
- Pagination auf der Blog-Übersicht (nur 4 Artikel)
- Mehrsprachigkeit
- Analytics-Events pro Artikel
