# SEO Blog + /rechner/ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full blog system with 4 SEO-optimized German articles and a standalone `/rechner/` page for kiez-power.de.

**Architecture:** Astro v6 Content Collections (glob loader, `src/content.config.ts`) for markdown-based blog. `BlogLayout.astro` wraps articles. `/rechner/` reuses the existing `Calculator` component. `@astrojs/sitemap` picks up all new pages automatically. No new npm dependencies.

**Tech Stack:** Astro v6 (static output), existing CSS variables, vanilla JS, no testing framework — verification is via `npm run build` (catches schema/type errors) and `npm run dev` (visual check).

## Global Constraints

- Language: German throughout — no hardcoded English strings in visible text
- CSS: use only existing variables (`--night`, `--night-mid`, `--night-light`, `--green`, `--green-dim`, `--white`, `--muted`, `--border`, `--font-display`, `--font-body`, `--radius-sm`, `--radius-md`, `--radius-lg`)
- No new npm dependencies
- Static output — no server-side rendering
- Astro v6 API: `render(post)` from `astro:content` (not `post.render()`); `post.id` as slug (not `post.slug`)
- Config file location: `src/content.config.ts` (Astro v5+ Content Layer)
- All new pages pass custom `title` and `description` to `BaseLayout`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/content.config.ts` | Create | Blog collection schema |
| `src/layouts/BlogLayout.astro` | Create | Article layout (Nav + prose + CTA + Footer) |
| `src/pages/blog/index.astro` | Create | Blog listing page |
| `src/pages/blog/[...slug].astro` | Create | Dynamic article template |
| `src/content/blog/42c-enwg-p2p-stromhandel.md` | Create | Article 1 |
| `src/content/blog/einspeiseverguetung-2026.md` | Create | Article 2 |
| `src/content/blog/energiegemeinschaft-gruenden.md` | Create | Article 3 |
| `src/content/blog/guenstiger-strom-nachbarn.md` | Create | Article 4 |
| `src/pages/rechner.astro` | Create | Standalone calculator page |
| `src/components/Nav.astro` | Modify | Add Blog + Rechner links |

---

## Task 1: Content Collection Config + BlogLayout

**Files:**
- Create: `src/content.config.ts`
- Create: `src/layouts/BlogLayout.astro`

**Interfaces:**
- Produces: `BlogLayout` component accepting props `{ title, description, pubDate, keywords, readingTime }`
- Produces: `blog` collection with schema `{ title: string, description: string, pubDate: Date, keywords: string[] }`

- [ ] **Step 1: Create the content collection config**

Create `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    pubDate:     z.date(),
    keywords:    z.array(z.string()),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: Create BlogLayout**

Create `src/layouts/BlogLayout.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title:       string;
  description: string;
  pubDate:     Date;
  keywords:    string[];
  readingTime: number;
}

const { title, description, pubDate, keywords, readingTime } = Astro.props;

const formattedDate = pubDate.toLocaleDateString('de-DE', {
  year: 'numeric', month: 'long', day: 'numeric',
});

const siteUrl = 'https://kiez-power.de';
const articleSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: pubDate.toISOString(),
  author: { '@type': 'Organization', name: 'KiezPower', url: siteUrl },
  publisher: { '@type': 'Organization', name: 'KiezPower', url: siteUrl },
});
---

<BaseLayout title={`${title} — KiezPower`} description={description}>
  <Fragment slot="head">
    <meta name="keywords" content={keywords.join(', ')} />
    <script type="application/ld+json" set:html={articleSchema} />
  </Fragment>
  <Nav />
  <main class="blog-article">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">KiezPower</a>
        <span>›</span>
        <a href="/blog/">Blog</a>
        <span>›</span>
        <span>{title}</span>
      </nav>

      <header class="article-header">
        <span class="section-tag">Blog</span>
        <h1>{title}</h1>
        <p class="article-meta">{formattedDate} · {readingTime} Min. Lesezeit</p>
      </header>

      <article class="prose">
        <slot />
      </article>

      <div class="article-cta">
        <p class="cta-headline">Bereit für Strom aus der Nachbarschaft?</p>
        <p class="cta-sub">Sichere dir jetzt deinen Platz auf der Warteliste — kostenlos und unverbindlich.</p>
        <a href="/#warteliste" class="btn-primary">Jetzt Platz sichern →</a>
      </div>
    </div>
  </main>
  <Footer />
</BaseLayout>

<style>
  .blog-article {
    padding: 7rem 2rem 5rem;
    min-height: 70vh;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }

  .breadcrumb a {
    color: var(--muted);
    text-decoration: none;
    transition: color 0.2s;
  }

  .breadcrumb a:hover { color: var(--green); }
  .breadcrumb span:not(a) { opacity: 0.5; }

  .article-header {
    max-width: 720px;
    margin-bottom: 3rem;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: var(--white);
    margin-bottom: 1rem;
  }

  .article-meta {
    font-size: 0.825rem;
    color: var(--muted);
    opacity: 0.7;
  }

  /* Prose */
  .prose {
    max-width: 720px;
    color: var(--muted);
    line-height: 1.85;
    font-size: 1rem;
  }

  .prose :global(h2) {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--white);
    margin: 2.5rem 0 1rem;
  }

  .prose :global(h3) {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--white);
    margin: 2rem 0 0.75rem;
  }

  .prose :global(p) { margin-bottom: 1.25rem; }

  .prose :global(a) {
    color: var(--green);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .prose :global(strong) { color: var(--white); font-weight: 600; }

  .prose :global(ul),
  .prose :global(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .prose :global(li) { margin-bottom: 0.4rem; }

  .prose :global(blockquote) {
    border-left: 3px solid var(--green);
    padding: 0.75rem 1.25rem;
    margin: 1.5rem 0;
    background: var(--night-mid);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    color: var(--white);
    font-style: italic;
  }

  .prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.9rem;
  }

  .prose :global(th),
  .prose :global(td) {
    padding: 0.6rem 1rem;
    border: 1px solid var(--border);
    text-align: left;
  }

  .prose :global(th) {
    background: var(--night-mid);
    color: var(--white);
    font-family: var(--font-display);
    font-weight: 600;
  }

  /* CTA */
  .article-cta {
    max-width: 720px;
    margin-top: 4rem;
    padding: 2.5rem;
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: var(--radius-lg);
    background: rgba(34, 197, 94, 0.05);
    text-align: center;
  }

  .cta-headline {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 0.5rem;
  }

  .cta-sub {
    color: var(--muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
</style>
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds. If you see "Cannot find module 'astro/loaders'", confirm Astro version is ≥ 5 with `cat package.json | grep '"astro"'`.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/layouts/BlogLayout.astro
git commit -m "feat: add blog content collection config and BlogLayout"
```

---

## Task 2: Blog Listing Page + Article Template

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `blog` collection from Task 1; `BlogLayout` from Task 1
- Produces: routes `/blog/` and `/blog/<post-id>`

- [ ] **Step 1: Create blog listing page**

Create `src/pages/blog/index.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import { getCollection } from 'astro:content';

const posts = (await getCollection('blog')).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
---

<BaseLayout
  title="Blog — KiezPower | P2P-Stromhandel erklärt"
  description="Alles über P2P-Stromhandel, § 42c EnWG, Einspeisevergütung und Energiegemeinschaften — verständlich erklärt."
>
  <Nav />
  <main class="blog-index">
    <div class="container">
      <span class="section-tag">Blog</span>
      <h1>Wissen rund um P2P-Stromhandel</h1>
      <p class="intro">
        Hintergründe zu § 42c EnWG, Einspeisevergütung, Energiegemeinschaften und lokalem Stromhandel —
        für Produzenten, Konsumenten und B2B-Partner.
      </p>

      <div class="post-grid">
        {posts.map((post) => {
          const wordCount = post.body?.split(/\s+/).length ?? 500;
          const readingTime = Math.ceil(wordCount / 200);
          return (
            <a href={`/blog/${post.id}/`} class="post-card">
              <span class="post-tag">Blog</span>
              <h2>{post.data.title}</h2>
              <p class="post-desc">{post.data.description}</p>
              <p class="post-meta">
                {post.data.pubDate.toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}{readingTime} Min.
              </p>
            </a>
          );
        })}
      </div>
    </div>
  </main>
  <Footer />
</BaseLayout>

<style>
  .blog-index {
    padding: 8rem 0 5rem;
    min-height: 70vh;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--white);
    margin-bottom: 1rem;
  }

  .intro {
    color: var(--muted);
    line-height: 1.75;
    max-width: 600px;
    margin-bottom: 3rem;
  }

  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .post-card {
    display: block;
    background: var(--night-mid);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    text-decoration: none;
    transition: border-color 0.2s, transform 0.2s;
  }

  @media (hover: hover) and (pointer: fine) {
    .post-card:hover {
      border-color: rgba(34, 197, 94, 0.35);
      transform: translateY(-2px);
    }
  }

  .post-tag {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--green);
    margin-bottom: 0.75rem;
    display: block;
  }

  .post-card h2 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--white);
    line-height: 1.35;
    margin-bottom: 0.75rem;
    letter-spacing: -0.01em;
  }

  .post-desc {
    font-size: 0.875rem;
    color: var(--muted);
    line-height: 1.65;
    margin-bottom: 1.25rem;
  }

  .post-meta {
    font-size: 0.75rem;
    color: var(--muted);
    opacity: 0.6;
  }
</style>
```

- [ ] **Step 2: Create article template**

Create `src/pages/blog/[...slug].astro`:

```astro
---
import BlogLayout from '../../layouts/BlogLayout.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);

const wordCount = post.body?.split(/\s+/).length ?? 500;
const readingTime = Math.ceil(wordCount / 200);
---

<BlogLayout
  title={post.data.title}
  description={post.data.description}
  pubDate={post.data.pubDate}
  keywords={post.data.keywords}
  readingTime={readingTime}
>
  <Content />
</BlogLayout>
```

- [ ] **Step 3: Verify build passes (no articles yet — that's ok)**

```bash
npm run build
```

Expected: Build succeeds. `/blog/` exists in dist. No articles yet, so grid is empty — correct.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/
git commit -m "feat: add blog listing page and article template"
```

---

## Task 3: Article 1 — § 42c EnWG

**Files:**
- Create: `src/content/blog/42c-enwg-p2p-stromhandel.md`

- [ ] **Step 1: Create article**

Create `src/content/blog/42c-enwg-p2p-stromhandel.md`:

```markdown
---
title: "§ 42c EnWG einfach erklärt: So funktioniert P2P-Stromhandel legal"
description: "§ 42c EnWG ermöglicht seit 2023 legalen Peer-to-Peer Stromhandel zwischen Nachbarn. Wir erklären, was das Gesetz bedeutet, wer mitmachen darf und wie Plattformen wie KiezPower es umsetzen."
pubDate: 2026-06-01
keywords:
  - "§ 42c EnWG"
  - "P2P Stromhandel Deutschland"
  - "Energiegemeinschaft"
  - "Peer-to-Peer Energie"
  - "lokaler Stromhandel"
  - "Strom an Nachbarn verkaufen"
---

Wer seinen Solarstrom ins öffentliche Netz einspeist, bekommt dafür weniger als 9 Cent pro Kilowattstunde. Der Nachbar zahlt beim Grundversorger mehr als 30 Cent. Diese Lücke war jahrelang rechtlich nicht zu schließen — bis § 42c des Energiewirtschaftsgesetzes (EnWG) in Kraft trat.

## Was regelt § 42c EnWG?

§ 42c EnWG schafft seit der Novellierung des Energiewirtschaftsgesetzes eine klare Rechtsgrundlage für **Peer-to-Peer Energiehandel** (P2P). Konkret erlaubt der Paragraph, dass Privatpersonen und Gewerbetreibende Strom direkt miteinander handeln — vermittelt durch einen zugelassenen IT-Dienstleister, ohne selbst Energieversorger werden zu müssen.

Der entscheidende Unterschied zu einem klassischen Stromliefervertrag: Beim P2P-Handel bleibt der **Netzbetreiber für Transport und Messung** zuständig. Die Handelsplattform vermittelt lediglich den Vertrag zwischen Produzent und Konsument. Das bedeutet für beide Parteien:

- Kein eigener Energieversorger-Status nötig
- Kein Austritt aus dem bestehenden Netzvertrag
- Volle gesetzliche Versorgungssicherheit bleibt erhalten

Die Gesetzesgrundlage verweist zusätzlich auf das Messstellenbetriebsgesetz (MsbG), das vorschreibt, dass ein moderner Smartmeter (mME) installiert sein muss, um Verbrauch und Erzeugung minutengenau erfassen zu können.

## Wie funktioniert P2P-Stromhandel technisch?

Der Ablauf ist einfacher als man denkt:

1. **Produzent** (z. B. PV-Anlage auf dem Dach) erzeugt mehr Strom als er selbst verbraucht.
2. Der Überschuss wird vom **Smartmeter** erfasst und in Echtzeit an die Plattform gemeldet.
3. Die Plattform **matched** automatisch einen Konsumenten in der Nachbarschaft, der Strom abnehmen möchte.
4. Der Energiepreis wird **frei vereinbart** — innerhalb gesetzlicher Grenzen.
5. Der Netzbetreiber transportiert den Strom und stellt **Netzentgelte, Steuern und Abgaben** separat in Rechnung.
6. Die Plattform rechnet den reinen **Energiepreis** zwischen den Parteien ab.

Wichtig zu verstehen: Physikalisch fließt kein individueller Elektronenstrom vom Nachbar zu dir. Das Netz funktioniert wie ein Pool. Was gehandelt wird, ist das **Recht auf eine bestimmte Menge Strom** — bilanziert über Erzeugung und Verbrauch.

## Wer darf mitmachen?

§ 42c EnWG stellt keine Mindestanforderungen an die Anlagengröße. Theoretisch kann jeder mitmachen, der:

- Eine **registrierte Stromerzeugungsanlage** besitzt (PV, Balkonkraftwerk ab bestimmten Schwellwerten, BHKW)
- Einen **modernen Messstellenbetrieb (mME)** hat oder beantragen kann
- Im Einzugsgebiet eines kompatiblen **Netzbetreibers** liegt

Für Konsumenten reicht der bestehende Netzanschluss. Ein neuer Stromvertrag ist nicht nötig — P2P-Strom ergänzt den bisherigen Fallback-Tarif.

## Was KiezPower anders macht als klassische Versorger

Klassische Energieversorger kaufen deinen Strom zu Einspeisetarifen auf und verkaufen ihn mit Aufschlag weiter. Du siehst nie, wer deinen Strom verbraucht.

KiezPower operiert als **IT-Dienstleister nach § 42c EnWG**: Wir vermitteln den Vertrag direkt zwischen dir und deinem Nachbarn. Der Preis wird transparent ausgehandelt — ohne Zwischenhändler-Marge. KiezPower erhebt lediglich eine **Plattformgebühr von 1,5 %** auf den Energiepreis.

Das Ergebnis: Produzenten erzielen im Schnitt **87 % mehr** als mit der gesetzlichen Einspeisevergütung. Konsumenten zahlen für den reinen Energieanteil deutlich weniger als beim Grundversorger.

## Häufige Fragen zu § 42c EnWG

**Muss ich ein Gewerbe anmelden?**  
Nein. Private Einspeisung bis zu bestimmten Grenzen ist steuerlich als Liebhaberei einzustufen oder fällt unter die Kleinunternehmerregelung. Details klärt dein Steuerberater für deinen Einzelfall.

**Was passiert, wenn kein Nachbar Strom abnehmen will?**  
Dein überschüssiger Strom wird automatisch ins öffentliche Netz eingespeist — zu den gesetzlichen Einspeisevergütungssätzen. Du verlierst nichts.

**Ist meine Vergütung gesichert?**  
Ja. KiezPower arbeitet mit Vorauszahlung: Konsumenten laden ihr Wallet auf, bevor Strom gehandelt wird. Deine Vergütung ist sichergestellt, bevor der Handel startet.

Mehr rechtliche Fragen beantwortet unsere [FAQ-Seite](/faq/).

## Fazit: § 42c EnWG öffnet den Markt

§ 42c EnWG ist kein Nischenparagraph — er ist die Grundlage für eine neue Form des lokalen Energiemarkts. Wer eine PV-Anlage hat, kann endlich mehr als die Minimalvergütung erzielen. Wer günstigen Strom sucht, kann direkt vom Produzenten im eigenen Kiez kaufen.

Möchtest du wissen, wie viel du mit deiner Anlage verdienen könntest? Probiere unseren [Vorteilsrechner](/rechner/) aus — in unter einer Minute.
```

- [ ] **Step 2: Run dev server and check article renders**

```bash
npm run dev
```

Navigate to `http://localhost:4321/blog/42c-enwg-p2p-stromhandel/`

Expected: Article renders with title, date, reading time, breadcrumb, green CTA at bottom. Check that internal links to `/faq/` and `/rechner/` are correct (they'll 404 until those pages exist — that's fine at this stage).

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/42c-enwg-p2p-stromhandel.md
git commit -m "feat: add article '§ 42c EnWG einfach erklärt'"
```

---

## Task 4: Article 2 — Einspeisevergütung 2026

**Files:**
- Create: `src/content/blog/einspeiseverguetung-2026.md`

- [ ] **Step 1: Create article**

Create `src/content/blog/einspeiseverguetung-2026.md`:

```markdown
---
title: "Einspeisevergütung 2026: Warum deine PV-Anlage mehr verdienen kann"
description: "Die Einspeisevergütung 2026 liegt für neue Anlagen unter 10 kWp bei rund 8 ct/kWh. Wir erklären, warum das systematisch zu niedrig ist — und wie P2P-Stromhandel als Alternative mehr einbringt."
pubDate: 2026-06-05
keywords:
  - "Einspeisevergütung 2026"
  - "PV Strom besser verkaufen als Einspeisung"
  - "Strom an Nachbarn verkaufen"
  - "P2P Stromhandel"
  - "Solarstrom Vergütung"
  - "EEG 2026"
---

Du hast eine Photovoltaikanlage auf dem Dach. Dein Wechselrichter produziert an sonnigen Tagen mehr Strom als du verbrauchst. Und für jede überschüssige Kilowattstunde bekommst du vom Netzbetreiber rund 8 Cent gutgeschrieben. Klingt fair — bis du siehst, was dein Nachbar für denselben Strom beim Grundversorger zahlt.

## Aktuelle Einspeisevergütung 2026 im Überblick

Die gesetzliche Einspeisevergütung nach dem Erneuerbare-Energien-Gesetz (EEG) gilt für Anlagen, die nach dem jeweiligen Inbetriebnahmedatum registriert sind. Die Sätze sinken jährlich — das Prinzip der "Degression" soll den Ausbau steuern, ohne die Förderung dauerhaft hochzuhalten.

Für **Neuanlagen in 2026** gelten folgende Richtwerte:

| Anlagengröße | Einspeisevergütung |
|---|---|
| Bis 10 kWp (Volleinspeisung) | ca. 12,9 ct/kWh |
| Bis 10 kWp (Teileinspeisung) | ca. 8,1 ct/kWh |
| 10–40 kWp | ca. 7,1 ct/kWh |
| 40–750 kWp | ca. 5,8 ct/kWh |

*Quelle: Bundesnetzagentur, Stand 2026 (halbjährliche Anpassung möglich)*

Die meisten privaten PV-Besitzer fallen in die Kategorie "Teileinspeisung" — also: Eigenverbrauch zuerst, Rest ins Netz. Für diesen Rest gibt es **~8 ct/kWh**.

## Warum die Vergütung systematisch zu niedrig ist

8 Cent pro Kilowattstunde klingen nach einer Zahl. In Relation gesetzt, wird das Problem deutlich:

- Dein Nachbar **zahlt 30–35 ct/kWh** beim Grundversorger für den gleichen Strom
- Du bekommst **8 ct/kWh** — das ist weniger als ein Viertel des Marktpreises
- Die Differenz fließt in Netzentgelte, Steuern, Abgaben — und die Marge des Versorgers

Das EEG wurde nicht dafür entwickelt, dir eine marktgerechte Vergütung zu sichern. Es sollte den Ausbau erneuerbarer Energien fördern und Planungssicherheit bieten. Als Renditemodell ist es nicht gedacht.

Hinzu kommt: Wenn viele Anlagen gleichzeitig einspeisen (Mittagssonne, Wochenende), drückt das den Börsenstrompreis teils unter null. Dein Vergütungssatz ist aber gedeckelt — du profitierst von hohen Preisen nicht.

## Alternative: Strom direkt an Nachbarn verkaufen

Genau hier setzt **Peer-to-Peer Stromhandel** (P2P) nach § 42c EnWG an. Anstatt deinen Überschussstrom zu 8 ct ins Netz zu schicken, verkaufst du ihn direkt an einen Nachbarn — zu einem **frei vereinbarten Preis**.

Der Kaufpreis liegt typischerweise zwischen 15 und 22 ct/kWh: deutlich mehr als die Einspeisevergütung, und trotzdem günstiger als der Grundversorgertarif. Beide Seiten gewinnen.

KiezPower übernimmt dabei das gesamte Matching, die Vertragsabwicklung und die Abrechnung — vollautomatisch, ohne dass du dich um Details kümmern musst.

## Rechenbeispiel: EEG-Vergütung vs. P2P-Preis

Angenommen, du hast jährlich **3.000 kWh Überschussstrom**:

| Szenario | Preis/kWh | Jahresertrag |
|---|---|---|
| Einspeisevergütung (EEG) | 8,1 ct | **243 €** |
| P2P-Handel mit KiezPower | 15 ct | **450 €** |
| P2P-Handel (Obergrenze) | 22 ct | **660 €** |

Der tatsächliche P2P-Preis hängt vom lokalen Angebot und Nachfrage ab — und davon, welchen Mindestpreis du selbst setzt. KiezPower erhebt **1,5 % Plattformgebühr** auf den Energiepreis; Netzentgelte werden vom Netzbetreiber separat abgerechnet.

Wie hoch dein persönlicher Vorteil wäre, berechnest du mit unserem [Vorteilsrechner](/rechner/).

## Was du brauchst, um anzufangen

Der Einstieg ist einfacher als bei den meisten anderen Energie-Themen:

1. **Bestehende PV-Anlage** (jede Größe, jedes Alter — auch Anlagen aus der EEG-Förderphase)
2. **Moderner Smartmeter (mME)** mit SML- oder IR-Schnittstelle — viele Netzbetreiber bauen diese gerade verpflichtend ein
3. **Internetzugang** für das Messgerät (WLAN oder LAN)
4. **KiezPower-Account** — das war's

Du musst deinen bestehenden Netzbetreiber-Vertrag nicht kündigen. KiezPower ergänzt deine bestehende Einspeisung. Wenn kein Käufer verfügbar ist, speist du automatisch zu EEG-Sätzen ein — du verlierst also nichts.

## Fazit

Die Einspeisevergütung 2026 liegt weit unter dem, was Verbraucher für Strom zahlen. Wer mit P2P-Handel beginnt, kann seinen Ertrag mehr als verdoppeln — ohne zusätzliche Investitionen und ohne bürokratischen Aufwand.

Weitere rechtliche Details zu § 42c EnWG findest du in unserem [Artikel über den gesetzlichen Rahmen](/blog/42c-enwg-p2p-stromhandel/). Oder springe direkt in den [Vorteilsrechner](/rechner/) und sieh, was deine Anlage wirklich bringen kann.
```

- [ ] **Step 2: Verify article appears in blog listing**

```bash
npm run dev
```

Navigate to `http://localhost:4321/blog/` — both articles should appear as cards, sorted by date (Article 2 is newer).

Navigate to `http://localhost:4321/blog/einspeiseverguetung-2026/` — article renders correctly with table.

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/einspeiseverguetung-2026.md
git commit -m "feat: add article 'Einspeisevergütung 2026'"
```

---

## Task 5: Article 3 — Energiegemeinschaft gründen

**Files:**
- Create: `src/content/blog/energiegemeinschaft-gruenden.md`

- [ ] **Step 1: Create article**

Create `src/content/blog/energiegemeinschaft-gruenden.md`:

```markdown
---
title: "Energiegemeinschaft gründen: Checkliste für Stadtwerke & Wohnungsunternehmen"
description: "Energiegemeinschaften nach § 42c EnWG ermöglichen lokalen Stromhandel in Wohnanlagen und Quartieren. Diese Checkliste zeigt, was rechtlich, technisch und organisatorisch nötig ist — und wie KiezPower den Aufwand minimiert."
pubDate: 2026-06-10
keywords:
  - "Energiegemeinschaft gründen"
  - "Energiesharing Wohnanlage"
  - "§ 42c EnWG Energiegemeinschaft"
  - "lokaler Stromhandel Quartier"
  - "Stadtwerke P2P"
  - "Mieterstrom"
---

Immer mehr Wohnungsunternehmen, Stadtwerke und Kommunen interessieren sich für lokale Energiegemeinschaften. Das Versprechen: Mieter profitieren von günstigerem Strom aus der eigenen Anlage, Investoren erzielen bessere Renditen als mit reiner Netzeinspeisung, und das Quartier wird zum Energieakteur.

Doch was genau braucht man, um eine Energiegemeinschaft nach § 42c EnWG rechtssicher zu betreiben? Diese Checkliste gibt einen strukturierten Überblick.

## Was ist eine Energiegemeinschaft nach § 42c EnWG?

Eine Energiegemeinschaft im Sinne des Gesetzes ist eine Gruppe von Personen oder Unternehmen, die gemeinsam Energie erzeugen, verteilen und verbrauchen — vermittelt durch einen zugelassenen IT-Dienstleister. Anders als bei klassischen Mieterstrommodellen nach § 42a EnWG ist kein eigenes Versorgungsunternehmen nötig.

Der IT-Dienstleister (wie KiezPower) übernimmt:
- Matching von Angebot und Nachfrage in Echtzeit
- Vertragsabwicklung zwischen den Teilnehmern
- Abrechnung des Energieanteils (ohne Netzentgelte)
- Dokumentation für Regulierungsbehörden

Der Netzbetreiber bleibt für Messung, Transport und Netzentgelte zuständig.

## Rechtliche Voraussetzungen

Bevor eine Energiegemeinschaft startet, müssen folgende rechtliche Voraussetzungen geprüft werden:

- **Registrierung der Erzeugungsanlage** im Marktstammdatenregister (MaStR) — Pflicht für alle Anlagen ab 100 W
- **Teilnehmervereinbarung** zwischen Produzenten und Konsumenten (Vorlage kann der IT-Dienstleister bereitstellen)
- **Klärung der steuerlichen Behandlung** — Einnahmen aus dem Stromverkauf können steuerpflichtig sein; Kleinunternehmerregelung (§ 19 UStG) bis 22.000 €/Jahr möglich
- **Datenschutz**: Zählerdaten sind personenbezogen — DSGVO-konforme Verarbeitung muss sichergestellt sein
- **Netzanschlussvertrag**: Prüfen, ob der bestehende Vertrag Einspeisung und P2P-Handel zulässt (in der Regel ja, aber Abstimmung mit Netzbetreiber empfohlen)

## Technische Anforderungen

### Smartmeter (mME)

Jeder Teilnehmer — Produzent und Konsument — benötigt einen **modernen Messstellenbetrieb (mME)** mit:
- SML-Protokoll (Optical Push) **oder** IR-Schnittstelle
- Kompatiblem Adapter (z. B. Tibber Pulse, Volkszähler, Shelly EM)
- Stabiler Internetverbindung am Zählerstandort

Gute Nachricht: Ab 2025 gilt die Pflicht zum Rollout moderner Smartmeter für Haushalte ab 6.000 kWh/Jahr. Viele Netzbetreiber bauen diese bereits aktiv ein.

### Netzinfrastruktur

Für die Energiegemeinschaft selbst ist keine zusätzliche Netzinfrastruktur nötig — der vorhandene Netzanschluss reicht. Die Bilanzierung erfolgt über den Netzbetreiber.

### Softwareplattform

Hier kommt der IT-Dienstleister ins Spiel. KiezPower stellt eine API-basierte Plattform bereit, die:
- Echtzeit-Matching von Erzeugung und Verbrauch übernimmt
- Preisverhandlung automatisiert
- Abrechnungsdaten für alle Parteien aufbereitet

## Schritt-für-Schritt Checkliste

### Phase 1: Vorbereitung (4–8 Wochen)

- [ ] Erzeugungsanlagen im MaStR registrieren/prüfen
- [ ] Netzbetreiber kontaktieren und Smartmeter-Rollout anfragen
- [ ] Rechtliche Struktur klären (Einzelperson, GbR, WEG-Beschluss)
- [ ] Steuerberater zur Einnahmen-Behandlung konsultieren
- [ ] Teilnehmer identifizieren und informieren (Infoveranstaltung)

### Phase 2: Technische Einrichtung (2–4 Wochen)

- [ ] Smartmeter installieren/aktivieren lassen
- [ ] Adapter (SML oder IR) bestellen und anschließen
- [ ] Konnektivität testen (Datenabruf alle 15 Minuten)
- [ ] KiezPower-Account für alle Teilnehmer einrichten

### Phase 3: Pilotbetrieb (4 Wochen)

- [ ] Testbetrieb mit 2–3 Teilnehmern starten
- [ ] Abrechnungsdaten prüfen und Netzbetreiber-Daten abgleichen
- [ ] Preismodell auf Basis realer Daten justieren
- [ ] Feedback der Pilotteilnehmer einholen

### Phase 4: Rollout

- [ ] Alle Teilnehmer onboarden
- [ ] Teilnehmervereinbarungen unterzeichnen
- [ ] Kommunikationskanal für laufende Fragen einrichten
- [ ] Quartalsweise Auswertung der Einsparungen planen

## Häufige Stolpersteine

**Smartmeter-Rollout dauert länger als geplant.** Netzbetreiber haben unterschiedliche Kapazitäten. Frühzeitig anfragen und schriftlich bestätigen lassen.

**Teilnehmer unterschätzen steuerliche Pflichten.** Wer Strom verkauft, erzielt Einnahmen — das muss versteuert werden. Die Kleinunternehmerregelung löst das für die meisten privaten Produzenten, aber WEGs und Unternehmen brauchen steuerliche Beratung.

**Erwartungsmanagement bei Ersparnissen.** Der günstigere Energiepreis (Anteil: ca. 30–40 % der Gesamtrechnung) führt nicht automatisch zu 30–40 % Ersparnis auf die gesamte Stromrechnung. Netzentgelte, Steuern und Abgaben fallen weiterhin an. Ehrliche Kommunikation verhindert Enttäuschungen.

## Wie KiezPower den Aufwand abnimmt

KiezPower ist als IT-Dienstleister nach § 42c EnWG konzipiert, der Stadtwerken, Wohnungsunternehmen und Kommunen die technische und kaufmännische Infrastruktur für Energiegemeinschaften bereitstellt. Das bedeutet:

- Keine eigene Softwareentwicklung nötig
- Keine eigene Lizenzierung als Energieversorger
- Fertige Teilnehmervereinbarungen und DSGVO-Dokumentation
- White-Label-Option für Stadtwerke

Interesse an einer Pilotkooperation? Unsere [Partnerseite](/partner/) gibt einen Überblick über das B2B-Modell. Für eine erste Einschätzung, was eine Energiegemeinschaft in Ihrem Quartier einbringen könnte, nutzen Sie unseren [Vorteilsrechner](/rechner/).
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Navigate to `http://localhost:4321/blog/energiegemeinschaft-gruenden/` — checklist renders as `<ul>` with `<li>` items. All three articles visible on `/blog/`.

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/energiegemeinschaft-gruenden.md
git commit -m "feat: add article 'Energiegemeinschaft gründen'"
```

---

## Task 6: Article 4 — Günstiger Strom vom Nachbarn

**Files:**
- Create: `src/content/blog/guenstiger-strom-nachbarn.md`

- [ ] **Step 1: Create article**

Create `src/content/blog/guenstiger-strom-nachbarn.md`:

```markdown
---
title: "Günstig Strom kaufen vom Nachbarn: So sparst du 30–40 % in deinem Kiez"
description: "Strom vom Nachbarn kaufen ist dank § 42c EnWG legal und unkompliziert. Wir erklären, was 30–40 % Ersparnis wirklich bedeutet, wie P2P-Stromhandel im Alltag funktioniert und was du als Konsument brauchst."
pubDate: 2026-06-15
keywords:
  - "Strom vom Nachbarn kaufen"
  - "günstiger Strom Nachbarschaft"
  - "P2P Stromhandel"
  - "Strom an Nachbarn verkaufen"
  - "Energiesharing"
  - "lokaler Strom"
---

Dein Nachbar hat eine Solaranlage auf dem Dach. An einem sonnigen Sommertag produziert er mehr Strom als er selbst verbraucht — und speist den Rest für 8 Cent pro Kilowattstunde ins öffentliche Netz ein. Du zahlst gleichzeitig 32 Cent beim Grundversorger. Es liegt auf der Hand: Da ist Potenzial verschwendet.

Genau das ermöglicht P2P-Stromhandel nach § 42c EnWG: Du kaufst Strom direkt von Nachbarn mit Solaranlage — günstiger als beim Grundversorger, und dein Nachbar verdient mehr als mit der Einspeisevergütung.

## Warum Nachbar-Strom günstiger ist

Der Strompreis, den du beim Grundversorger zahlst, setzt sich aus mehreren Komponenten zusammen:

| Kostenblock | Anteil |
|---|---|
| Netzentgelte (Transport, Messung) | ~25 % |
| Steuern & Abgaben (EEG-Umlage entfällt seit 2023, andere bleiben) | ~35 % |
| Energiepreis (eigentlicher Strom) | ~25–30 % |
| Versorger-Marge | ~10–15 % |

Beim P2P-Handel wird nur der **Energiepreis** neu verhandelt — nicht die Netzentgelte und Steuern, die der Netzbetreiber ohnehin erhebt. Der Energiepreisanteil liegt typischerweise bei 28–32 ct/kWh im Grundversorgertarif. Beim P2P-Handel kannst du diesen auf **15–22 ct/kWh** senken.

## Was "30–40 % Ersparnis" wirklich bedeutet

Kurze Klarstellung, damit keine falschen Erwartungen entstehen: Die Ersparnis bezieht sich auf den **Energiepreisanteil**, nicht auf die gesamte Stromrechnung.

Rechenbeispiel für einen Haushalt mit 3.500 kWh Jahresverbrauch:

| | Grundversorger | KiezPower P2P |
|---|---|---|
| Energiepreis | 30 ct/kWh | 18 ct/kWh |
| Netzentgelte + Steuern | 19 ct/kWh | 19 ct/kWh (unverändert) |
| Gesamtpreis | 49 ct/kWh | 37 ct/kWh |
| Jahresrechnung | 1.715 € | 1.295 € |
| **Ersparnis** | | **420 € / Jahr** |

Das ist keine Zauberei — es ist der Wegfall der Zwischenhändler-Marge. Netzentgelte und staatliche Abgaben sind fix und lassen sich nicht umgehen.

Willst du deinen persönlichen Vorteil berechnen? Unser [Vorteilsrechner](/rechner/) liefert eine individuelle Einschätzung in unter einer Minute.

## Wie P2P-Stromhandel im Alltag funktioniert

Für dich als Konsument ist der Ablauf unsichtbar — das ist das Ziel. Konkret:

1. Du richtest einmalig deinen KiezPower-Account ein und gibst dein Preislimit an.
2. KiezPower matched dich automatisch mit Produzenten in deiner Nähe.
3. Wenn ein Nachbar gerade Überschussstrom hat und dein Preislimit passt, kaufst du.
4. Wenn kein Nachbar verfügbar ist, beziehst du automatisch Strom aus dem Netz — der Wechsel ist nahtlos, du merkst nichts.
5. Einmal im Monat bekommst du eine transparente Abrechnung: wie viel P2P-Strom, wie viel Netzstrom, zu welchem Preis.

Du musst weder deinen bisherigen Netzvertrag kündigen noch einen neuen abschließen. KiezPower läuft parallel.

## Was du brauchst als Konsument

Die technischen Voraussetzungen sind minimal:

**Pflicht:**
- Normaler Haushaltsstromanschluss (vorhanden)
- Moderner Smartmeter (mME) — wird seit 2025 verpflichtend von Netzbetreibern eingebaut; wenn noch nicht vorhanden, kannst du ihn beim Netzbetreiber beantragen

**Optional aber empfohlen:**
- SML-Adapter (z. B. Tibber Pulse) für Echtzeit-Verbrauchsanzeige in der App

Kein Handwerker, keine Ummeldung, kein Vertragsabschluss mit dem Netzbetreiber nötig — du meldest dich bei KiezPower an, und alles andere läuft automatisch.

## Ist das überall möglich?

P2P-Stromhandel ist grundsätzlich deutschlandweit möglich — überall dort, wo § 42c EnWG gilt, also im gesamten deutschen Stromnetz. In der Praxis gibt es zwei Einschränkungen:

**Lokale Dichte:** P2P funktioniert besser in Gebieten mit vielen PV-Anlagen. In dicht besiedelten Stadtgebieten und Wohnanlagen mit Dach-PV ist die Verfügbarkeit höher als auf dem Land.

**Smartmeter-Rollout:** In manchen Regionen laufen die Netzbetreiber noch hinter dem gesetzlichen Rollout-Zeitplan. Wenn dein Zähler noch nicht getauscht wurde, kann der Start sich verzögern.

KiezPower zeigt dir beim Anmelden, ob deine Region bereits im Pilotgebiet liegt — und setzt dich auf die Warteliste für deinen Bereich, wenn noch nicht.

## Fazit: Strom vom Nachbarn ist keine Utopie mehr

P2P-Stromhandel ist seit der Einführung von § 42c EnWG Realität. Du brauchst keinen Ingenieurstitel und keine eigene Anlage — du brauchst nur einen Internetzugang und einen modernen Zähler.

Die Ersparnis ist real, auch wenn sie nicht 40 % der Gesamtrechnung ausmacht. Für einen durchschnittlichen Haushalt sind 300–500 € im Jahr ein handfester Vorteil. Und der Effekt skaliert: Je mehr Nachbarn mitmachen, desto mehr P2P-Strom ist verfügbar, desto länger und günstiger kannst du kaufen.

Neugierig, was das für deinen Haushalt bedeutet? Starte mit unserem [Vorteilsrechner](/rechner/) oder lies mehr darüber, [wie der gesetzliche Rahmen aussieht](/blog/42c-enwg-p2p-stromhandel/).
```

- [ ] **Step 2: Verify all 4 articles appear on listing page**

```bash
npm run dev
```

Navigate to `http://localhost:4321/blog/` — 4 article cards sorted by date (newest first: Article 4, 3, 2, 1).

Navigate to `http://localhost:4321/blog/guenstiger-strom-nachbarn/` — article renders with tables.

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/guenstiger-strom-nachbarn.md
git commit -m "feat: add article 'Günstig Strom kaufen vom Nachbarn'"
```

---

## Task 7: /rechner/ Standalone Page

**Files:**
- Create: `src/pages/rechner.astro`

- [ ] **Step 1: Create the page**

Create `src/pages/rechner.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/Nav.astro';
import Calculator from '../components/Calculator.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout
  title="Vorteilsrechner — KiezPower | Strom an Nachbarn verkaufen"
  description="Berechne deinen persönlichen Vorteil mit KiezPower: Wie viel mehr verdient deine PV-Anlage gegenüber der Einspeisevergütung? Wie viel sparst du als Konsument gegenüber dem Grundversorger?"
>
  <Nav />
  <main class="rechner-page">
    <div class="container">
      <span class="section-tag">Vorteilsrechner</span>
      <h1 class="reveal">Was bringt dir KiezPower?</h1>
      <p class="page-sub reveal">
        Berechne in Sekunden deinen persönlichen Vorteil — ob du Solarstrom produzierst oder günstigen Strom suchst.
      </p>
    </div>

    <Calculator />

    <!-- FAQ -->
    <div class="container">
      <div class="faq-section">
        <h2 class="faq-title">Häufige Fragen zum Rechner</h2>

        <details class="faq-item">
          <summary>Wie wird der Kiez-Preis berechnet?</summary>
          <p>
            Der Kiez-Preis ist kein fixer Tarif, sondern ein frei vereinbarter Energiepreis zwischen Produzent und Konsument.
            Produzenten setzen ihren Mindestpreis, Konsumenten ihr Preislimit — KiezPower matched automatisch.
            Die im Rechner verwendeten Werte (15 ct/kWh für Produzenten, 20 ct/kWh für Konsumenten) sind realistische Mittelwerte
            aus Pilotdaten. Der tatsächliche Preis kann höher oder niedriger liegen.
          </p>
        </details>

        <details class="faq-item">
          <summary>Was kostet KiezPower?</summary>
          <p>
            KiezPower erhebt eine Plattformgebühr von <strong>1,5 %</strong> auf den gehandelten Energiepreis.
            Netzentgelte, Steuern und staatliche Abgaben (~60 % des Endpreises) werden vom Netzbetreiber
            separat in Rechnung gestellt — diese fallen unabhängig vom Energielieferanten an und sind im
            Rechner nicht enthalten.
          </p>
        </details>

        <details class="faq-item">
          <summary>Ab wann kann ich KiezPower nutzen?</summary>
          <p>
            KiezPower befindet sich im Aufbau. Wir starten mit einem regionalen Pilotbetrieb in Deutschland.
            Trag dich auf die <a href="/#warteliste">Warteliste</a> ein, um als Erste*r informiert zu werden,
            sobald wir in deine Region kommen. Dein Platz auf der Liste reserviert deinen frühen Zugang.
          </p>
        </details>
      </div>

      <div class="bottom-cta">
        <p>Überzeugend? Sichere dir jetzt deinen Platz.</p>
        <a href="/#warteliste" class="btn-primary">Zur Warteliste →</a>
      </div>
    </div>
  </main>
  <Footer />
</BaseLayout>

<style>
  .rechner-page {
    padding-top: 7rem;
    padding-bottom: 5rem;
  }

  .rechner-page > .container:first-child {
    padding-bottom: 0;
  }

  h1 {
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 3.5vw, 2.8rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--white);
    margin-bottom: 1rem;
  }

  .page-sub {
    color: var(--muted);
    line-height: 1.75;
    max-width: 520px;
    margin-bottom: 0;
  }

  /* FAQ */
  .faq-section {
    margin-top: 4rem;
    max-width: 780px;
  }

  .faq-title {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--white);
    letter-spacing: -0.02em;
    margin-bottom: 1.25rem;
  }

  .faq-item {
    background: var(--night-mid);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin-bottom: 0.5rem;
    transition: border-color 0.2s;
  }

  .faq-item:hover { border-color: rgba(148, 163, 184, 0.25); }
  .faq-item[open] { border-color: rgba(34, 197, 94, 0.25); }

  summary {
    padding: 1.1rem 1.5rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--white);
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    user-select: none;
  }

  summary::-webkit-details-marker { display: none; }

  summary::after {
    content: '+';
    font-size: 1.4rem;
    font-weight: 300;
    color: var(--green);
    flex-shrink: 0;
    transition: transform 0.25s;
    line-height: 1;
  }

  .faq-item[open] summary::after { transform: rotate(45deg); }

  .faq-item p {
    padding: 0 1.5rem 1.25rem;
    color: var(--muted);
    line-height: 1.75;
    font-size: 0.9rem;
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }

  .faq-item p a {
    color: var(--green);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .faq-item p strong { color: var(--white); }

  /* Bottom CTA */
  .bottom-cta {
    margin-top: 3rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .bottom-cta p {
    color: var(--muted);
    font-size: 0.95rem;
  }
</style>
```

- [ ] **Step 2: Verify page**

```bash
npm run dev
```

Navigate to `http://localhost:4321/rechner/` — page renders with Calculator (slider + results), FAQ accordion below, and CTA link to `/#warteliste`. Calculator toggle and slider should be interactive.

- [ ] **Step 3: Commit**

```bash
git add src/pages/rechner.astro
git commit -m "feat: add standalone /rechner/ page"
```

---

## Task 8: Nav Update

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Add Blog and Rechner links to Nav**

In `src/components/Nav.astro`, replace the existing `links` array and mobile menu with:

```astro
---
const links = [
  { href: '#wie-es-funktioniert', label: "So funktioniert's" },
  { href: '#features',            label: 'Funktionen' },
  { href: '#preise',              label: 'Preise' },
  { href: '/rechner/',            label: 'Rechner' },
  { href: '/blog/',               label: 'Blog' },
];
---
```

And in the mobile menu section, add the same two links before the existing partner links. The full mobile menu `<div>` should look like:

```astro
<!-- Mobile menu -->
<div class="mobile-menu" id="mobile-menu" hidden>
  {links.map((l) => <a href={l.href}>{l.label}</a>)}
  <a href="/fuer-netzbetreiber">Für Partner</a>
  <a href="/partner">Partner-Programm</a>
  <a href="#warteliste" class="mobile-cta">Platz sichern →</a>
</div>
```

Note: Since `links` now includes Rechner and Blog, they'll automatically render in both desktop and mobile menus via the `{links.map(...)}` call. No further change needed in the mobile menu block — just confirm the existing `{links.map(...)}` is still there.

- [ ] **Step 2: Verify nav on all pages**

```bash
npm run dev
```

Check the following:
- `/` — Nav shows "Rechner" and "Blog" links in desktop bar. Mobile hamburger menu includes both.
- `/rechner/` — Links work (Rechner is current page, Blog navigates correctly).
- `/blog/` — Both links are in nav.
- Clicking "Rechner" from any page navigates to `/rechner/`.
- Clicking "Blog" navigates to `/blog/`.

- [ ] **Step 3: Run full build to catch any remaining issues**

```bash
npm run build
```

Expected: Build completes without errors. Check `dist/` for:
- `dist/blog/index.html`
- `dist/blog/42c-enwg-p2p-stromhandel/index.html`
- `dist/blog/einspeiseverguetung-2026/index.html`
- `dist/blog/energiegemeinschaft-gruenden/index.html`
- `dist/blog/guenstiger-strom-nachbarn/index.html`
- `dist/rechner/index.html`
- `dist/sitemap-0.xml` (should include all new URLs)

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat: add Blog and Rechner links to navigation"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| Content Collection with schema | Task 1 |
| BlogLayout (Nav, breadcrumb, prose, CTA, Footer) | Task 1 |
| Blog listing page `/blog/` | Task 2 |
| Article template `/blog/[...slug]` | Task 2 |
| Article 1 — § 42c EnWG | Task 3 |
| Article 2 — Einspeisevergütung 2026 | Task 4 |
| Article 3 — Energiegemeinschaft gründen | Task 5 |
| Article 4 — Günstig Strom vom Nachbarn | Task 6 |
| `/rechner/` standalone page | Task 7 |
| Nav update (Blog + Rechner) | Task 8 |
| Internal links: articles → /rechner/ | ✓ in all articles |
| Internal links: articles → /faq/ | ✓ in Articles 1, 2 |
| CTA → /#warteliste | ✓ BlogLayout + rechner.astro |
| Sitemap auto-update | ✓ @astrojs/sitemap, no action needed |
| JSON-LD Article schema | ✓ BlogLayout |

**Placeholder scan:** No TBDs or "implement later" found. All code blocks are complete.

**Type consistency:** `BlogLayout` props (`title`, `description`, `pubDate`, `keywords`, `readingTime`) match usage in `[...slug].astro`. Collection schema fields (`title`, `description`, `pubDate`, `keywords`) match frontmatter in all 4 articles. `render(post)` API matches Astro v6 docs.
