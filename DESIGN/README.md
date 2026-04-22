# Comparo3D — Design System

> Generated from the live landing+dashboard codebase (`3dneworld/comparo3d-landing-page` @ `landing-redesign`) and the brand's master `docs/DESIGN.md`. This is the single source of truth for anyone designing for Comparo3D — landing, proveedor dashboard, slides, mocks, or new surfaces.

## What is Comparo3D?

**Comparo3D** is an Argentine marketplace that lets users get quotes and compare 3D printing options from a vetted network of local providers. You upload an STL, the platform gathers real quotes (price, delivery time, ratings, materials), and you pick and pay — production and delivery stay inside the same flow. It serves two audiences with the same core product:

- **Particulares** — hobbyists, makers, home users ordering one-offs.
- **Empresas** — companies that want a single interlocutor for recurring 3D printing needs (prototypes, spare parts, short runs), with consolidated quoting, tracking and invoicing.

The provider-facing side is a Spanish-language dashboard where print shops manage their profile, printers, materials and incoming orders.

### Surfaces (products represented)

1. **Public landing** (`/`) — Spanish, marketing + embedded quote widget (upload → compare → pick → checkout → confirmation). Audience-aware: copy, CTAs and trust cards switch between **particular** and **empresa** modes.
2. **Provider login** (`/proveedores`) — dark hero-styled access page for print shops.
3. **Provider dashboard V2** (`/proveedores-v2/*`) — operational back-office: overview, profile, printers, materials, quotes, orders, financial. Sidebar + topbar shell, denser than the landing.
4. **Public provider listing / profile** — discovery pages for the public to browse the network.

## Sources this system was built from

None of these are assumed reachable by the reader — they are recorded for provenance.

| Source | Where |
|---|---|
| Landing + dashboard codebase | local mount `comparo3d-landing-page/` (GitHub: `3dneworld/comparo3d-landing-page` branch `landing-redesign`) |
| Authoritative visual spec | `comparo3d-landing-page/docs/DESIGN.md` (1294 lines of tokens + patterns) |
| CSS tokens | `comparo3d-landing-page/src/index.css` |
| Tailwind scales | `comparo3d-landing-page/tailwind.config.ts` |
| Logo & isotipo | uploaded by user (`uploads/logo_horizontal_light.svg`, `uploads/iso_transp.png`, etc.) |
| Montserrat fonts | uploaded by user (18 TTFs, all weights + italics) |
| Provider logos, materials, project photography | `comparo3d-landing-page/public/logos/`, `/src/assets/materials/`, `/src/assets/projects/` |

---

## Index of this design system

Root files:

- `README.md` — this file.
- `SKILL.md` — Claude Skill wrapper so this folder can be used as a portable Skill.
- `colors_and_type.css` — all tokens (colors, gradients, shadows, radii, spacing, type) + semantic element styles. Drop into any HTML artifact.

Folders:

- `fonts/` — Montserrat TTFs, weights 400–900 (display family).
- `assets/` — logos, isotipo, favicon, material beauty shots, project photos, provider logos, hero illustration.
- `preview/` — HTML cards populating the Design System tab (one concept per card).
- `ui_kits/landing/` — UI kit recreating the public landing (Hero, TrustStrip, HowItWorks, QuoteWidget, FAQ, FinalCTA, Footer) as a click-thru prototype.
- `ui_kits/provider_dashboard/` — UI kit recreating the provider dashboard shell + 2–3 core views.

---

## Content fundamentals

**Language:** Spanish (Argentina / rioplatense). `vos` voseo is the default conjugation for the particular audience (`subí`, `elegí`, `recibí`, `cotizá`). The empresa audience uses a more neutral, slightly more formal third-person operational voice (`centralizamos`, `recibimos`, `se coordina`) with fewer imperatives.

**Tone:**
- Direct, low-hype, operational. No "revolucionario" / "game-changer" copy.
- Reassuring about logistics and friction ("menos vueltas", "sin perder tiempo buscando proveedor por proveedor", "un solo interlocutor").
- Concrete verbs for CTAs: **Cotizar ahora**, **Cotizar para empresa**, **Ver solución empresa**.
- Section eyebrows are uppercase short phrases: `PROCESO SIMPLE`, `FLUJO OPERATIVO`, `PANEL DE PROVEEDORES`.

**Casing:** Sentence case for headings and body. Brand name renders as **COMPARO3D** (all caps) when appearing as a wordmark, `Comparo3D` in prose.

**Use of "I" vs "you":** The brand speaks to **you** (tú/vos), never uses "yo". For empresa it uses "nosotros" sparingly ("recibimos", "coordinamos").

**Emoji:** No emoji in product copy. No decorative unicode characters as icons.

**Voice examples:**
- Hero particular: *"Cotizá tu impresión 3D en minutos. Subí tu archivo, compará opciones reales de impresión 3D en Argentina y elegí la mejor sin perder tiempo buscando proveedor por proveedor."*
- Hero empresa: *"Centralizá compras de impresión 3D con un solo interlocutor."*
- Trust card: *"La red se evalúa por capacidad, calidad y cumplimiento antes de formar parte del proceso."* (short, factual, no superlatives).
- Step label: *"Paso 1 — Subí tu STL"*.
- State pill: *"Activo"* / *"Pendiente validación"* / *"Suspendido"*.

**Forbidden tropes (per DESIGN.md anti-patterns + tone observed):**
- Don't say "revolucionario", "el mejor", "único".
- Don't pad with adjectives. If a card says "comparación", not "comparación inteligente y rápida".
- Don't use exclamation marks in primary CTAs.

---

## Visual foundations

**Palette strategy.** Clear base + two surgical accents. Light neutrals (`hsl(220 20% 97%)` page, `#fff` surfaces) carry 90% of pixels. The brand blue `hsl(220 70% 45%)` appears only on primary CTAs, links, active icons, eyebrows, and focus rings. The warm orange `hsl(38 92% 55%)` is reserved for positive urgency ("Mejor precio") and accent moments — never for body copy.

**Dark counterpart.** Three sections live on `--gradient-dark` (a subtle `180deg` gradient from `#0e1219` → darker slate): Hero, Final CTA, Footer, Provider Login, and the Provider Dashboard sidebar. On dark, text uses `--hero-foreground` / `--hero-muted` for the two-level hierarchy.

**Gradients.** Only three, all from CSS variables:
- `--gradient-primary` (blue → cyan, `135deg`) — CTAs and brand icon chips only.
- `--gradient-accent` (orange, `135deg`) — reserved for "Mejor precio" future badge.
- `--gradient-dark` (dark slate, `180deg`) — hero/footer/login backgrounds.

Never apply `--gradient-primary` as a full-section background. Never invent a new gradient.

**Typography.** Three families:
- **Montserrat** — display. h1 at 800 (ExtraBold), h2/h3 at 700 (Bold). Tight tracking (`-0.01em`).
- **Inter** — body, UI, labels. Weights 400/500/600.
- **Space Grotesk** — footer headings and optional h4-h6 for tonal contrast.

Fluid scales: h1 `30 → 48px`, h2 `32 → 42px`, body `16 → 18px`. Never smaller than 11px, and 11px is reserved for uppercase eyebrows with `0.16em` tracking.

**Spacing.** Stock Tailwind scale, no extensions. Landing sections breathe: `py-16 md:py-24` standard, `py-20 md:py-28` for hero and final CTA. Dashboard is denser: `px-5 py-6 md:px-6 md:py-8`.

**Backgrounds.** No repeating patterns, no grain, no hand-drawn illustrations. Hero and login decorate with a *very* low-opacity SVG grid (`opacity: 0.03`, 40×40 stroke white), sometimes animated via a 20s linear loop on `background-position`. Full-bleed photography is used only in materials, projects gallery, and the provider-network hero illustration — always photographic, warm-neutral, real objects (printed parts, print-shop floors). No illustrations of people; no generic stock.

**Animation.** Restrained. Framer Motion with `ease: [0.25, 0.1, 0.25, 1]`, durations `0.25s–0.5s`. Patterns: `fade-up` (opacity 0→1, y 12→0) and `StaggerChildren` for grid reveals (0.05–0.12s stagger). Hover on cards: `-translate-y-0.5` + shadow swap. Respects `prefers-reduced-motion`.

**Hover states.** Subtle. CTAs fade opacity (`hover:opacity-90`). Cards lift 2px and shift shadow from `shadow-sm` to `shadow-card-hover`. Links on dark: `hero-muted → hero-foreground`. Icon buttons: `bg-hero-muted/10 → bg-hero-muted/20`.

**Press states.** None explicit — inherit default button press via opacity. No shrink transforms.

**Borders.** `hsl(var(--border))` = `#dcdfe5`, 1px. Often softened via `border-border/70` on panels. On dark surfaces, `border-white/10` or `border-hero-muted/10`. No dashed or dotted borders anywhere.

**Shadows.** Three levels, all in tokens — never hand-rolled:
- `--shadow-card` — resting panels and cards.
- `--shadow-card-hover` — hover-lifted cards.
- `--shadow-cta` — blue-tinted glow for primary CTA buttons only.

**Protection gradients vs capsules.** No protection-gradients (text-over-image scrims). Capsule pills (`rounded-full`, 2.5px padding, 11px text) are used everywhere: state, eyebrow chips, step markers, "Mejor precio" floating badge, disabled nav items.

**Layout rules.** Landing container: centered, max-width `1280px`, `1.5rem` horizontal padding. Navbar is fixed and transitions from transparent to `bg-hero/95 backdrop-blur-md` on scroll. Dashboard topbar is sticky; sidebar is fixed at `292px`. Back-to-top floating button is bottom-right.

**Transparency & blur.** Used sparingly but intentionally: `bg-white/90 backdrop-blur-sm` for dashboard headers and panels (subtle glass effect over decorative grid overlay); `bg-hero/95 backdrop-blur-md` for scrolled navbar; `bg-background/85 backdrop-blur` for sticky topbar.

**Imagery color vibe.** Neutral-warm: product shots on white or warm-beige, no heavy colorwashing, no duotones, no grain. Slightly desaturated. All real 3D-printed parts / real print-shop scenes.

**Corner radii.** Small and consistent. Base 10px (`--radius`); pills are full; cards `rounded-xl` (12) or `rounded-2xl` (16); dashboard panels step up to 20/24/28px for a softer operational feel. Never mix two non-adjacent radii in one layout.

**Card anatomy.** 1px border (`border-border`), white background, `rounded-2xl`, `p-5 md:p-6`, `shadow-card` (or `shadow-sm` with hover to `shadow-card-hover`). Icon slot top-left in a `rounded-xl bg-primary/12` chip, then title (16–17px, 600), then description (13–14px, muted).

---

## Iconography

**Primary icon system: Lucide Icons** (React). Every icon on the landing, dashboard and quote flow is imported from `lucide-react` — `ArrowRight`, `Upload`, `BarChart3`, `ShieldCheck`, `Clock`, `Truck`, `CheckCircle2`, `PackageCheck`, `MapPin`, `Eye`, `Loader2`, `AlertTriangle`, `Plus`, `Minus`, `Menu`, `X`, `ChevronDown`, `ChevronRight`, `ArrowLeft`, `Users`, `Layers`, `Lock`, `FileStack`, `Check`.

**Stroke + size.** Default `strokeWidth={2}`. Sizes vary by context: `size={12}` in pills, `size={14}` in links, `size={18}` in mini indicators, `size={20}` in CTAs, `size={22}` in step chips, `size={24}` in trust card icons.

**Color usage.** Icons on light backgrounds → `text-primary` (blue) by default; `text-muted-foreground` for tertiary; `text-destructive` / `text-emerald-600` / `text-amber-600` for semantic. On dark backgrounds → `text-primary` for brand accents, `text-hero-muted` for secondary, `text-accent` (orange) for success markers. Icons inside gradient chips use `text-primary-foreground` (white).

**Custom SVG icons.** Two proprietary trust icons exist in code: `TrayectoriaVerificada5Icon` and `TrayectoriaVerificada10Icon` (provider "Verified track-record 5y/10y" badges). They live at `comparo3d-landing-page/src/components/icons/`. *Not yet copied — the source paths appear unreachable at copy-time; if needed for a design, reattach the codebase.*

**Emoji.** Never used.
**Unicode symbols as icons.** Never used — everything is a Lucide SVG or a custom SVG.
**Icon fonts.** Not used.
**PNG icons.** Not used for UI; PNGs are reserved for logos of third-party providers (`assets/logos/`) and product/material photography.

**CDN for prototypes.** Lucide Icons is trivially reachable at `https://unpkg.com/lucide@latest` or via the React package. For HTML artifacts, use the official web font/SVG CDN: `<script src="https://unpkg.com/lucide@latest"></script>` then `data-lucide="upload"`. All prototypes in this design system use that pattern.

**Brand marks.**
- `assets/logo_horizontal_color.png` — canonical full-color horizontal logo: **black wordmark + blue "3D" + blue hexagon isotipo**. Use on light surfaces. The blue here is the same family as the primary brand blue (samples ≈ `#1c75f7`) — slightly brighter than the UI token `#2260c9` by design; the logo reads more vivid while the UI blue reads more operational.
- `assets/logo-white.png` — all-white wordmark + blue isotipo. Use on `bg-gradient-dark` / hero / footer / sidebar.
- `assets/isotipo.png` / `isotipo_blue_on_white.jpg` — isotipo (hexagon mark only) for favicons, tight spaces.
- `assets/favicon.png` — site favicon.

---

## Substitution notes / flags

- **Space Grotesk** and **Inter** are loaded via Google Fonts (matches live landing). No self-host substitution needed.
- **Montserrat** is self-hosted from the uploaded TTFs (regular, medium, semibold, bold, extrabold, black — covers all weights the codebase uses).
- **Custom trust-badge SVGs** (`trayectoria-verificada-5/10`) were not reachable during copy. If needed, reattach the codebase or share them separately; the design system currently uses the Lucide `ShieldCheck` as their visual stand-in.

## Iteration guide

Everything in `preview/` renders as a card in the Design System tab. Every card is generated from the real tokens in `colors_and_type.css`, so editing a token propagates everywhere. If you find something in this system that diverges from a live product screen, **the product screen is the truth** — update the tokens and the README, then re-render the cards.
