# Comparo3D — Design system skill

Use this document whenever you design for **Comparo3D** (marketing site or provider
dashboard). Everything below is the single source of truth; the tokens live in
`colors_and_type.css` and mirror `comparo3d-landing-page/src/index.css` + `docs/DESIGN.md`.

---

## 1. What Comparo3D is

Argentine marketplace for 3D printing. Two surfaces:

- **Landing / marketing site** (public) — audience toggle between *particular*
  and *empresa*. Goal: get uploads and quote submissions.
- **Provider dashboard** (authenticated) — operational panel for the printing
  shops that fulfill quotes. Goal: keep providers active, compliant, and visible.

Both surfaces share one visual language but use very different density and
chrome (see §7).

---

## 2. Wire up the tokens

Every HTML artifact you generate **must** link the stylesheet at the project
root so typography and color tokens are consistent:

```html
<link rel="stylesheet" href="../colors_and_type.css">
```

(Adjust the path to `./colors_and_type.css` or similar depending on folder depth.)
All tokens are exposed as CSS custom properties on `:root`.

---

## 3. Typography — Montserrat, exclusively

Comparo3D's brand is **Montserrat for everything**. Do not bring in Inter,
Space Grotesk, Roboto, system UI as display, etc. The font files are self-hosted
under `fonts/` and declared in the stylesheet with weights 400 / 500 / 600 /
700 / 800 / 900.

The scale:

| Role | Weight | Size | Notes |
|---|---|---|---|
| h1 / hero headline | 800 | clamp(30–48px) | letter-spacing -0.015em |
| h2 / section title | 700 | clamp(32–42px) | letter-spacing -0.01em |
| h3 / panel title | 700 | 17–22px | -0.005em |
| h4 / footer heading | 600 | 14–16px | slight uppercase OK |
| body / paragraph | 500 | 14–16px | line-height 1.6–1.7 |
| small / hint | 500 | 12–13px | muted color |
| eyebrow | 700 | 11px | UPPERCASE · 0.16em tracking · primary color |
| form label | 600 | 12px | UPPERCASE · 0.14em tracking · muted color |
| metric value | 800 | 22–30px | tabular-nums, -0.01em |
| mono / token readout | 500 | 13px | Montserrat with 0.02em tracking — not ui-monospace |

Whenever in doubt: **use Montserrat**. Pick the weight from this table.

---

## 4. Color

All colors are HSL triplets — wrap in `hsl(var(--foo))` when using.

**Foundations**
- `--background` `220 20% 97%` · page bg
- `--foreground` `220 30% 12%` · text
- `--card` `0 0% 100%` · surface
- `--muted` `220 15% 94%` · secondary surface
- `--muted-foreground` `220 10% 46%` · supporting text
- `--border` `220 15% 88%` · hairlines

**Brand**
- `--primary` `220 70% 45%` → `#2260c9` · Comparo3D blue, used for CTAs, icons, eyebrows, focus rings
- `--primary-foreground` `0 0% 100%` · text on primary

**Accent** (sparingly — used for the hero package-check moment, the accent gradient)
- `--accent` `38 92% 55%` → `#f0a118`

**Status**
- `--success` `152 68% 40%` · operativo
- `--warning` `38 92% 55%` · pendiente
- `--destructive` / `--danger` `0 84% 60%` · vencido
- `--info` `199 89% 48%` · en revisión

**Dark hero surface** (landing hero, dashboard sidebar, footer, final CTA)
- `--hero-bg` `220 30% 8%` → `#0e1219`
- `--hero-foreground` `220 15% 95%`
- `--hero-muted` `220 15% 65%`

**Gradients**
- `--gradient-primary`: `linear-gradient(135deg, hsl(220 70% 45%), hsl(200 80% 50%))` — primary CTAs, icon tiles
- `--gradient-dark`: `linear-gradient(180deg, hsl(220 30% 8%), hsl(220 25% 14%))` — hero, sidebar, footer
- `--gradient-accent`: use only for the warm "delivery done" moment in the hero panel

**Do not invent new blues or greys.** If you need intermediate shades, use
alpha on `hsl(var(--primary) / 0.12)` or `hsl(var(--foreground) / 0.06)` etc.

---

## 5. Brand marks — which to use

| File | When to use |
|---|---|
| `assets/logo_horizontal_color.png` | Full logo · black wordmark + blue "3D" + blue hexagon. Use on **light** surfaces (landing pages, print, app shell top-bar when the bar is light). |
| `assets/logo-white.png` | White wordmark + blue isotipo. Use on **dark** surfaces — navbar, `bg-gradient-dark`, hero, footer, dashboard sidebar. |
| `assets/isotipo.png`, `assets/isotipo_blue_on_white.jpg` | Isotipo only (hexagon mark) for favicons, avatars, tight spaces. |
| `assets/favicon.png` | Site favicon. |

**Do not tint the blue.** The hexagon blue in the logo sits naturally a touch
brighter than the UI `--primary`; that's fine and intentional.

---

## 6. Shape system

### Radii
- `--radius-sm` 6px · chips, tiny accents
- `--radius-md` 8px · buttons, inputs
- `--radius-lg` 10px · primary CTAs
- `--radius-xl` 12px · regular cards, icon tiles
- `--radius-2xl` 16px · section cards, feature tiles
- `--radius-panel` 20px · dashboard panels
- `--radius-page` 24px · dashboard page headers
- `--radius-feedback` 28px · empty / error / loading states
- `--radius-full` · pills, status chips, circular avatars

### Shadows
- `--shadow-card` — default surface elevation
- `--shadow-card-hover` — hover on hoverable cards
- `--shadow-cta` — the blue drop-glow under primary CTAs

### Spacing
Use the Tailwind-compatible scale exposed as `--space-1 … --space-24`. Sections
are typically `64px` (`--space-16`) top and bottom on landing, `24–32px` on
dashboard.

---

## 7. The two surfaces, at a glance

### 7.1 Landing page (marketing)

- Centered layout, max-width ~1080–1280px, container padding 28px.
- Section rhythm: dark hero → light section → muted section → light section…
  avoid stacking two light sections in a row.
- Hero uses `--gradient-dark` + a 3% grid-pattern overlay.
- Primary CTA: gradient blue pill + white text + `--shadow-cta` + arrow icon.
- Reference composition: see `preview/ui-kit-landing.html`.
- Key components: `Navbar` (fixed, dark, glass on scroll), `Hero` (2-col with
  process panel on the right), `HowItWorks` (4-card grid), `ProvidersSection`
  (logo marquee on muted surface), `MaterialsSection` (6-card filament grid),
  `FAQ` (hairline accordion with numbered bullets), `FinalCTA` (dark,
  centered), `Footer` (dark, 4-col).

### 7.2 Provider dashboard

- Wider: 1440–1600px max.
- **Dark sidebar** (`--gradient-dark`, 292px wide) + light workspace.
- Sidebar holds brand, provider identity card (name + status pills), full
  nav, and a "next phase" footer card.
- Top bar is sticky, translucent, contains audit trail (provider name /
  section / location) and session actions.
- Page body stacks:
  1. **Page header** — large, rounded 24px, pale white, eyebrow + h1 +
     description + meta pills + right-aligned actions.
  2. **Metric grid** — 4 KPI cards in a row.
  3. **Panel rows** — `row-2` (1.3fr / 1fr) or `row-3` for detail.
  4. **Feedback states** when loading / empty / error.
- Reference composition: see `preview/ui-kit-provider-dashboard.html`.
- Density: tighter than landing. Body text typically 13–14px.

---

## 8. Component vocabulary

Each atom has a preview card under `preview/`. Copy the markup from there if
you need the exact CSS.

| Atom | Preview |
|---|---|
| Brand logos | `preview/brand-logos.html` |
| Isotipo | `preview/brand-isotipo.html` |
| Icon style | `preview/brand-icons.html` |
| Filament pictograms | `preview/brand-materials.html` |
| Brand colors | `preview/colors-brand.html` |
| Neutrals | `preview/colors-neutrals.html` |
| Semantic colors | `preview/colors-semantic.html` |
| Display type | `preview/type-display.html` |
| Body type | `preview/type-body.html` |
| Labels / eyebrow | `preview/type-labels.html` |
| Spacing scale | `preview/spacing-scale.html` |
| Radii | `preview/spacing-radii.html` |
| Shadows | `preview/spacing-shadows.html` |
| Buttons | `preview/components-buttons.html` |
| Form field | `preview/components-forms.html` |
| Cards & panels | `preview/components-cards.html` |
| Nav — dark / glass | `preview/components-nav.html` |
| State pills | `preview/components-pills.html` |
| Quote card | `preview/components-quote-card.html` |

---

## 9. Voice

- Argentine Spanish, informal "vos". Sentences short and concrete.
- No hype words ("revolucionario", "disruptivo"). Concrete: "cotizá",
  "subí tu STL", "recibí opciones", "entrega coordinada".
- Eyebrow labels in UPPERCASE with tight phrasing: "PROCESO SIMPLE",
  "RED DE PROVEEDORES", "COTIZÁ TU PIEZA".
- Prefer verbs over nouns in CTAs: "Cotizar ahora" > "Ir a cotización".

---

## 10. Do / don't

**Do**
- Keep Montserrat everywhere.
- Use gradient primary only for CTAs and icon tiles.
- Prefer real provider logos and real materials pictograms when available
  under `assets/logos/` and `assets/materials/`.
- Use dashed-border empty states with a tinted icon tile for loading /
  empty / error.
- Reuse `bg-gradient-dark` for any "hero-like" surface (landing hero,
  dashboard sidebar, footer, final CTA).

**Don't**
- Don't introduce Inter, Space Grotesk, ui-monospace, or Google Fonts beyond
  Montserrat.
- Don't use the orange accent as a general-purpose accent — it's reserved for
  the package-check / delivery moment.
- Don't use emoji as iconography — use Material Symbols Rounded or the
  bespoke SVG icons already in the kit.
- Don't build from screenshots: read the actual components under
  `comparo3d-landing-page/src/components/landing/` and
  `comparo3d-landing-page/src/features/provider-dashboard/`.

---

## 11. When extending the system

If you need a token that doesn't exist:

1. First try an alpha of an existing token: `hsl(var(--primary) / 0.08)`.
2. If still insufficient, propose the addition to the user *before* shipping —
   don't silently add a new palette or a new type size.
3. Put new preview cards under `preview/` and register them with
   `register_assets` grouped under `Type`, `Colors`, `Spacing`, `Components`,
   or `Brand`.
