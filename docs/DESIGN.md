# DESIGN.md — Sistema visual Comparo3D

> Fuente de verdad para construir UI coherente en landing pública + dashboard V2 + páginas nuevas. Generado desde tokens reales del código. Versión viva: se actualiza cuando un subproyecto introduce un patrón nuevo.

---

## 1. Principios de marca

- **Base clara + acentos gradient.** Fondos `bg-background` o `bg-card`. `bg-gradient-primary` y `bg-gradient-accent` se reservan para CTAs de conversión y acentos puntuales. Nunca como fondo de lectura.
- **Tipografía jerárquica.** Montserrat (800) → h1; Montserrat (700) → h2, h3. Inter para body y UI operativa. Space Grotesk (`font-display`) solo en display hero cuando haga falta contraste.
- **Densidad equilibrada.** Landing: padding generoso (`py-16–py-28`), aire como jerarquía. Dashboard: densidad operativa, más info por pantalla.
- **Contraste alto en texto crítico.** `text-foreground` sobre fondo claro. Nunca `text-muted-foreground` en labels de acciones principales.
- **Shadows sutiles como única escala de elevación.** `shadow-card` en reposo, `shadow-card-hover` en hover. No crear shadows custom.
- **Radius consistente.** Base `0.625rem`. Cards, inputs, buttons: mismo vocabulario (`rounded-lg` / `rounded-xl` / `rounded-2xl`).
- **`bg-gradient-primary`** (azul → cyan): solo CTAs de conversión y acentos de marca.
- **`bg-gradient-accent`** (naranja): solo urgencia positiva ("Mejor precio"). No en textos de lectura.
- **No dark mode todavía.** No incluir variantes dark salvo que el subproyecto lo pida explícitamente.
- Animaciones en `src/components/animations/` — ver `AnimateOnScroll`, `StaggerChildren`.

**Anti-patterns:**
- ❌ Usar `bg-gradient-primary` como fondo de sección completa — pierde jerarquía.
- ❌ Mezclar radius distintos en elementos adyacentes (card `1.25rem` + input `0.375rem`).

---

## 2. Tokens

### 2.1 Paleta (HSL)

Fuente: `src/index.css` — variables en `:root`.

| Variable CSS | Valor HSL | Uso |
|---|---|---|
| `--background` | `220 20% 97%` | Fondo general de páginas |
| `--foreground` | `220 30% 12%` | Texto base |
| `--card` | `0 0% 100%` | Superficie elevada (cards, panels) |
| `--popover` | `0 0% 100%` | Superficie popover/dropdown |
| `--primary` | `220 70% 45%` | Azul de marca, CTAs primarios |
| `--primary-foreground` | `0 0% 100%` | Texto sobre primary |
| `--secondary` | `220 15% 92%` | Superficies secundarias neutras |
| `--muted` | `220 15% 94%` | Fondos de iconos, chips, placeholders |
| `--muted-foreground` | `220 10% 46%` | Texto secundario / ayuda |
| `--accent` | `38 92% 55%` | Naranja, urgencia positiva |
| `--destructive` | `0 84% 60%` | Errores, acciones destructivas |
| `--border` / `--input` | `220 15% 88%` | Bordes e inputs |
| `--ring` | `220 70% 45%` | Focus ring |
| `--hero-bg` | `220 30% 8%` | Fondo oscuro (hero, login, footer, sidebar) |
| `--hero-foreground` | `220 15% 95%` | Texto principal sobre fondo oscuro |
| `--hero-muted` | `220 15% 65%` | Texto secundario sobre fondo oscuro |
| `--surface-elevated` | `0 0% 100%` | Superficies flotantes premium |

Tokens `--sidebar-*` definidos en `:root` pero no consumidos en dashboard V2 (el sidebar usa `bg-gradient-dark` directamente). Ver discrepancias.

### 2.2 Gradientes

Fuente: `src/index.css`.

```text
bg-gradient-primary → linear-gradient(135deg, hsl(220,70%,45%), hsl(200,80%,50%))
  Uso: Hero CTA, Navbar CTA, FinalCTA, ProveedoresLogin, DashboardStates actions.

bg-gradient-accent  → linear-gradient(135deg, hsl(38,92%,55%), hsl(28,90%,50%))
  Uso: disponible para badge "Mejor precio" futuro.

bg-gradient-dark    → linear-gradient(180deg, hsl(220,30%,8%), hsl(220,25%,14%))
  Uso: Hero landing, FinalCTA, ProveedoresLogin bg, Dashboard sidebar.
```

Variante de texto: `.text-gradient-primary` aplica el gradiente primary como clip sobre texto.

### 2.3 Tipografía

| Familia | Tailwind | Pesos | Aplicación |
|---|---|---|---|
| Montserrat | CSS directo | 500–800 | h1 (800), h2+h3 (700) |
| Inter | `font-body` (body default) | 400, 500, 600 | Body, UI operativa |
| Space Grotesk | `font-display` | 400–700 | Display hero, h4-h6 via `font-display` |

Escalas reales: h1 landing `text-3xl→md:text-5xl extrabold`; h1 dashboard `text-3xl md:text-[2rem] extrabold`; h2 sección `text-[32px] md:text-[42px] bold`; eyebrow `text-[11px] semibold uppercase tracking-[0.16em]`.

### 2.4 Spacing

Escala estándar de Tailwind — no se extiende. Container: centrado, padding `1.5rem`, max-width `1280px` en `2xl`.

### 2.5 Border radius

Base: `--radius: 0.625rem`. `rounded-sm` ≈ `0.375rem` · `rounded-md` ≈ `0.505rem` · `rounded-lg` = `0.625rem`. Valores custom frecuentes: `rounded-[1.25rem]` (DashboardPanel), `rounded-[1.5rem]` (DashboardPageHeader), `rounded-[1.75rem]` (DashboardFeedbackState). `rounded-full` para pills y avatares.

### 2.6 Shadows

```text
shadow-card       → 0 1px 3px hsl(220 30% 12% / 0.06), 0 4px 12px hsl(220 30% 12% / 0.04)
shadow-card-hover → 0 4px 16px hsl(220 30% 12% / 0.1), 0 8px 32px hsl(220 30% 12% / 0.06)
shadow-cta        → 0 4px 20px hsl(220, 70%, 45% / 0.35)  [ver discrepancias]
```

### 2.7 Breakpoints

`sm:640px` · `md:768px` · `lg:1024px` · `xl:1280px` · `2xl:1536px`. El container tiene tope `1280px` en `2xl`.

---

## 3. Patrones compuestos

### 3.1 Page header con eyebrow

**Intent**: cabecera estructurada de vista de dashboard — título, contexto y acciones de página.

**Cuándo usarlo**: al inicio de cada vista del dashboard (Resumen, Perfil, Produccion…).

**Cuándo NO usarlo**: dentro de cards internas. No usar en landing.

**Anatomía**:
```text
<header> rounded-[1.5rem] bg-white/90 shadow-card backdrop-blur-sm px-6 py-6
 └─ flex col→lg:row justify-between
     ├─ Eyebrow?: text-[11px] uppercase tracking-[0.18em] text-primary
     ├─ h1: Montserrat extrabold text-3xl md:text-[2rem]
     ├─ description?: text-sm text-muted-foreground
     ├─ meta?: flex wrap gap-2 (pills)
     └─ actions?: shrink-0 flex gap-3
```

**Variantes**: con/sin eyebrow, con/sin description, con/sin actions.

**Implementación de referencia**: [`src/features/provider-dashboard/components/DashboardPageHeader.tsx`](../src/features/provider-dashboard/components/DashboardPageHeader.tsx)

**Snippet**:
```tsx
<DashboardPageHeader
  eyebrow="Panel de proveedores"
  title="Resumen operativo"
  description="Estado actual de tu perfil y capacidad."
  actions={<Button>Guardar</Button>}
/>
```

---

### 3.2 Surface panel

**Intent**: contenedor de contenido elevado en el dashboard. Equivale a "card" operativa.

**Cuándo usarlo**: agrupar campos relacionados dentro de una vista de dashboard.

**Cuándo NO usarlo**: wrapping de listas completas con scroll propio.

**Anatomía**:
```text
<Card> rounded-[1.25rem] bg-white/95 shadow-card border-border/70
 ├─ <CardHeader> p-6 flex row justify-between [condicional si hay title/desc/headerAction]
 │   ├─ title: Montserrat bold text-lg
 │   └─ description: text-sm text-muted-foreground
 └─ <CardContent> p-6 (pt-0 si hay header)
```

**Variantes**: sin header (solo contenido), con header completo, con headerAction a la derecha.

**Implementación de referencia**: [`src/features/provider-dashboard/components/DashboardPanel.tsx`](../src/features/provider-dashboard/components/DashboardPanel.tsx)

**Snippet**:
```tsx
<DashboardPanel title="Perfil" description="Datos del proveedor.">
  <p>Contenido del panel.</p>
</DashboardPanel>
```

---

### 3.3 State pill

**Intent**: indicador de estado compacto con semántica de color.

**Cuándo usarlo**: estado de entidad (activo, pausado, bloqueado), etiqueta semántica compacta.

**Cuándo NO usarlo**: para acciones clickeables (usar Button). Para texto descriptivo largo.

**Anatomía**:
```text
<span> inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em]
 └─ {tone-classes} + children
```

**Variantes**:

| Tono | Clases |
|---|---|
| `default` | `bg-background text-foreground border-border/80` |
| `success` | `bg-emerald-50 text-emerald-700 border-emerald-200` |
| `warning` | `bg-amber-50 text-amber-700 border-amber-200` |
| `danger` | `bg-rose-50 text-rose-700 border-rose-200` |
| `info` | `bg-sky-50 text-sky-700 border-sky-200` |
| `muted` | `bg-muted/60 text-muted-foreground border-border/70` |

**Implementación de referencia**: [`src/features/provider-dashboard/components/DashboardStatePill.tsx`](../src/features/provider-dashboard/components/DashboardStatePill.tsx)

**Snippet**:
```tsx
<DashboardStatePill tone="success">Activo</DashboardStatePill>
<DashboardStatePill tone="danger">Suspendido</DashboardStatePill>
```

---

### 3.4 Estados de vista (loading / empty / error)

**Intent**: estado de pantalla completa cuando la vista está cargando, sin datos o falló.

**Cuándo usarlo**: como contenido principal de una vista mientras carga, sin datos o con error accionable.

**Cuándo NO usarlo**: dentro de un panel parcial — ahí usar skeleton inline.

**Anatomía**:
```text
<div> min-h-[60vh] flex items-center justify-center
 └─ <div> max-w-xl rounded-[1.75rem] border bg-white/95 p-8 text-center shadow-card
     ├─ Icon: h-14 w-14 rounded-2xl bg-muted text-primary
     ├─ h1: Montserrat bold text-2xl
     ├─ description: text-sm text-muted-foreground
     └─ actions?: Button bg-gradient-primary + secondaryAction
```

**Variantes**: `DashboardLoadingState` (spinner animate-spin), `DashboardEmptyState` (AlertTriangle customizable), `DashboardErrorState` (AlertTriangle + CTA reintento).

**Implementación de referencia**: [`src/features/provider-dashboard/components/DashboardStates.tsx`](../src/features/provider-dashboard/components/DashboardStates.tsx)

**Snippet**:
```tsx
<DashboardLoadingState />
<DashboardEmptyState
  title="Sin impresoras configuradas"
  description="Agregá al menos una para habilitar cotizaciones."
  actionLabel="Agregar" onAction={handleAdd}
/>
```

---

### 3.5 Form field

**Intent**: campo de formulario consistente: label uppercase + control + ayuda/error.

**Cuándo usarlo**: todo campo editable en vistas de dashboard.

**Cuándo NO usarlo**: en landing — los inputs van con label inline o placeholder.

**Anatomía**:
```text
<div> space-y-2.5
 ├─ <Label> text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground [+ " *" si required]
 ├─ children (Input, Select, Switch u otro control)
 └─ error: text-xs text-rose-600  |  hint: text-xs text-muted-foreground
```

**Variantes**: con/sin hint, con/sin error, required.

**Implementación de referencia**: [`src/features/provider-dashboard/components/DashboardField.tsx`](../src/features/provider-dashboard/components/DashboardField.tsx)

**Snippet**:
```tsx
<DashboardField label="Nombre comercial" htmlFor="nombre" hint="Como aparece en cotizaciones." required>
  <Input id="nombre" value={nombre} onChange={setNombre} />
</DashboardField>
```

---

### 3.6 App shell (sidebar + topbar)

**Intent**: layout de aplicación del dashboard V2. Sidebar oscuro en desktop, topbar sticky + tabs scroll horizontal en mobile.

**Cuándo usarlo**: wrappear todas las vistas del dashboard V2.

**Cuándo NO usarlo**: landing pública ni páginas standalone como login.

**Anatomía**:
```text
<div> min-h-screen bg-background
 ├─ Grid overlay: fixed inset-0 opacity-[0.035] SVG 72×72
 └─ flex min-h-screen
     ├─ <aside> hidden lg:flex w-[292px] bg-gradient-dark
     │   ├─ Header: logo + eyebrow + nombre proveedor + DashboardStatePill
     │   ├─ <nav>: NavLink rounded-2xl (active: bg-white/10 text-hero-foreground)
     │   └─ Footer card: bg-white/5 border-white/10 rounded-[1.25rem] p-4
     └─ flex col flex-1
         ├─ <header> sticky top-0 bg-background/85 backdrop-blur border-b
         │   ├─ eyebrow + nombre + sección + ubicación | botones Logout
         │   └─ Nav mobile: scroll-x de rounded-full pills
         └─ <main> max-w-[1600px] px-5 py-6 md:px-6 md:py-8 xl:px-8
```

**Variantes**: en mobile el sidebar se oculta, la topbar sirve como nav principal.

**Implementación de referencia**: [`src/features/provider-dashboard/components/ProviderDashboardShell.tsx`](../src/features/provider-dashboard/components/ProviderDashboardShell.tsx)

**Snippet**:
```tsx
<ProviderDashboardShell user={user} provider={provider} onLogout={handleLogout}>
  <ProviderSummaryView providerId={provider.id} />
</ProviderDashboardShell>
```

---

### 3.7 Quote result card

**Intent**: card de proveedor en el listado de cotizaciones. Compara precio, rating, distancia y tiempo de entrega.

**Cuándo usarlo**: listado de cotizaciones del widget de cotización.

**Cuándo NO usarlo**: en listado público de proveedores (será el patrón "Provider summary card expandible").

**Anatomía**:
```text
<div> relative rounded-xl border p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-card-hover
 ├─ Badge flotante "Mejor precio": absolute -top-2.5 left-4, rounded-full, bg-gradient emerald→green
 └─ flex col→md:row
     ├─ Avatar: logo img 48×48 rounded-full | fallback: inicial en bg-primary/10 rounded-full
     ├─ Info: nombre font-bold + StarRating + ubicación/distancia + delivery dot + badge Certificado
     └─ Precio text-[20px] extrabold + botón CTA
```

**Variantes**: `isBestPrice=true` → borde `emerald-200`, fondo `from-emerald-50 to-white`, badge flotante visible. Delivery dot: `emerald-500` (≤3d), `amber-400` (≤7d), `sky-500` (>7d).

**Extensión futura (Subproyecto 1)**: badge "Selección Fundador", tooltips por badge, contador B2B.

**Implementación de referencia**: [`src/components/landing/quote/StepQuotes.tsx:217`](../src/components/landing/quote/StepQuotes.tsx)

**Snippet**:
```tsx
<ProviderCard
  option={quote}
  isBestPrice={quote.price_ars === lowestPrice}
  onSelect={() => onSelectQuote(quote.quote_option_uid)}
/>
```

---

### 3.8 Badge con icono

**Intent**: chip visual compacto con icono + texto. Comunica un atributo sin ser interactivo.

**Cuándo usarlo**: indicar calidad (Certificado), ventaja (Mejor precio), material, dimensión u otro tag de atributo.

**Cuándo NO usarlo**: acciones clickeables. Estados de vista completa — usar StatePill.

**Anatomía**:
```text
<span> inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold
 └─ <Icon size={12} /> + texto
```

**Variantes**:

| Instancia | Clases |
|---|---|
| Certificado | `bg-emerald-50 text-emerald-700` + `ShieldCheck` |
| Mejor precio | `bg-gradient(emerald→green) text-white font-bold` (badge flotante absoluto) |
| Tag material/dimensión | `border border-border bg-muted/50 text-foreground` + icono custom |

**Implementación de referencia**: [`src/components/landing/quote/StepQuotes.tsx:282`](../src/components/landing/quote/StepQuotes.tsx)

**Snippet**:
```tsx
<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
  <ShieldCheck size={12} /> Certificado
</span>
```

---

### 3.9 Hero dark con grid pattern

**Intent**: página standalone con fondo `bg-gradient-dark` y grid SVG sutil. Para contextos de acceso o alto impacto visual.

**Cuándo usarlo**: login de proveedores, onboarding standalone.

**Cuándo NO usarlo**: dentro del dashboard. Para secciones parciales de landing usar FinalCTA o Hero.

**Anatomía**:
```text
<div> min-h-screen bg-gradient-dark overflow-hidden
 ├─ Grid overlay: absolute inset-0 opacity-[0.03] SVG 40×40 stroke white 0.5
 ├─ <header>: logo blanco + link volver
 └─ container grid lg:grid-cols-2 min-h-[calc(100vh-4rem)] items-center
     ├─ Visual col (lg:flex hidden mobile): imagen + stats
     └─ Form col: eyebrow + h1 text-hero-foreground + form card (rounded-2xl border-hero-muted/10 bg-hero-muted/5 p-6)
```

**Variantes**: una sola col (solo form) vs dos cols con imagen lateral en desktop.

**Implementación de referencia**: [`src/pages/ProveedoresLogin.tsx`](../src/pages/ProveedoresLogin.tsx)

**Snippet**:
```tsx
<div className="relative min-h-screen overflow-hidden bg-gradient-dark">
  <div className="absolute inset-0 opacity-[0.03]"
    style={{ backgroundImage: "url(\"data:image/svg+xml,...\")" }} />
  {/* header + contenido */}
</div>
```

---

### 3.10 Landing hero

**Intent**: primera sección de la landing. Fondo oscuro, grid animado, copy de conversión y visualización de proceso en desktop.

**Cuándo usarlo**: solo como hero principal de la landing.

**Cuándo NO usarlo**: páginas internas ni dashboard.

**Anatomía**:
```text
<section> relative bg-gradient-dark pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden
 ├─ Grid overlay animado (motion.div opacity-[0.03])
 └─ container max-w-6xl → flex col→lg:row gap-12 lg:gap-16
     ├─ Left copy: h1 text-3xl→md:text-5xl extrabold text-hero-foreground + CTA bg-gradient-primary + secondary CTA border
     └─ Right panel (hidden lg:block): bg-hero-muted/5 rounded-2xl p-6 (pasos visualizados)
```

**Variantes**: audience-aware (particular / empresa) — copy y CTA cambian via `useAudience()`. Mismo layout visual.

**Implementación de referencia**: [`src/components/landing/Hero.tsx`](../src/components/landing/Hero.tsx)

**Snippet**: `<Hero />` — en `Index.tsx:25`. Sin props; consume `useAudience()` internamente.

---

### 3.11 Trust strip

**Intent**: grilla de 4 cards de credibilidad con icono + título + descripción.

**Cuándo usarlo**: sección de confianza debajo del hero en landing.

**Cuándo NO usarlo**: dashboard. Grillas de >4 ítems.

**Anatomía**: `<section> bg-background py-16 md:py-24` → container `max-w-6xl`. Header centrado: h2 + p. Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Cada `<article>`: `flex col items-center rounded-2xl border bg-card p-5 md:p-6` — Icon `h-12 w-12 rounded-xl bg-primary/[0.12]` + h3 + p `text-muted-foreground`.

**Variantes**: audience-aware — ítems y headline cambian via `useAudience()`.

**Implementación de referencia**: [`src/components/landing/TrustStrip.tsx`](../src/components/landing/TrustStrip.tsx)

**Snippet**: `<TrustStrip />` — en `Index.tsx:26`. Sin props; consume contexto de audiencia.

---

### 3.12 Final CTA

**Intent**: sección de cierre de página con fondo oscuro y un único CTA de alta conversión.

**Cuándo usarlo**: al final de la landing pública, antes del footer.

**Cuándo NO usarlo**: en medio de la página o en el dashboard.

**Anatomía**: `<section> py-20 md:py-28 bg-gradient-dark` → container `max-w-6xl text-center`. h2 `text-2xl→lg:text-4xl font-bold text-hero-foreground max-w-2xl mx-auto`. p `text-hero-muted`. CTA: `bg-gradient-primary px-10 py-4 rounded-lg font-semibold text-lg shadow-cta`.

**Variantes**: audience-aware — headline, subtexto y CTA label cambian.

**Implementación de referencia**: [`src/components/landing/FinalCTA.tsx`](../src/components/landing/FinalCTA.tsx)

**Snippet**: `<FinalCTA />` — en `Index.tsx:34`. Sin props; consume contexto de audiencia.

---

### 3.13 Navbar

**Intent**: barra de navegación fija de la landing. Transparente en top, solidifica con blur al scrollear.

**Cuándo usarlo**: solo en la landing pública.

**Cuándo NO usarlo**: dashboard (usa topbar del shell).

**Anatomía**: `<nav> fixed top-0 z-50 transition-all`. Sin scroll: `bg-transparent`. Con scroll: `bg-hero/95 backdrop-blur-md border-b shadow-lg`. Contenido: container `max-w-6xl h-16` — logo `h-8`, links desktop `text-sm text-hero-muted`, CTA `bg-gradient-primary rounded-lg shadow-cta`, botón hamburguesa mobile → drawer `bg-hero`.

**Variantes**: estado scrolled vs unscrolled. Drawer mobile.

**Implementación de referencia**: [`src/components/landing/Navbar.tsx`](../src/components/landing/Navbar.tsx)

**Snippet**: `<Navbar />` — en `Index.tsx:22`. Fijo al top via `fixed`; sin props.

---

### 3.14 Footer

**Intent**: pie de página de la landing. Fondo oscuro, 4 columnas, logo + links + social.

**Cuándo usarlo**: al final de la landing pública.

**Cuándo NO usarlo**: dashboard.

**Anatomía**: `<footer> bg-hero border-t border-hero-muted/10 py-12` → container `max-w-6xl`. Grid `sm:grid-cols-2 lg:grid-cols-4 gap-8`: col 1 logo + tagline; cols 2-3 links `text-sm text-hero-muted`; col 4 email + iconos redes `h-9 w-9 rounded-lg bg-hero-muted/10`. Bottom bar `border-t text-xs text-hero-muted`.

**Variantes**: ninguna — estático.

**Implementación de referencia**: [`src/components/landing/Footer.tsx`](../src/components/landing/Footer.tsx)

**Snippet**: `<Footer />` — en `Index.tsx:36`. Sin props.

---

### 3.15 FAQ accordion

**Intent**: lista de preguntas frecuentes expandibles. Numeración con pill primary, apertura animada con Framer Motion.

**Cuándo usarlo**: sección FAQ en landing pública.

**Cuándo NO usarlo**: dashboard — ahí usar `Accordion` de Shadcn directamente.

**Anatomía**: `<section> bg-background py-16 md:py-24` → container `max-w-6xl`. Header centrado: h2 + p. Lista `StaggerChildren divide-y divide-border border-t`. Cada ítem: `<button> flex w-full gap-4 py-5` — número `h-7 w-7 rounded-full bg-primary text-primary-foreground font-bold` + pregunta `text-[15px] font-medium` + Plus/Minus. Cuerpo: `AnimatePresence motion.div` height 0→auto 0.25s + respuesta `pl-11 text-[14px] text-muted-foreground`.

**Variantes**: audience-aware — preguntas y eyebrow cambian vía `useAudience()`.

**Implementación de referencia**: [`src/components/landing/FAQ.tsx`](../src/components/landing/FAQ.tsx)

**Snippet**: `<FAQ />` — en `Index.tsx:33`. Sin props; consume contexto de audiencia.

---

### 3.16 Section rhythm (landing)

**Intent**: patrón de spacing vertical entre secciones — no es un componente único.

**Cuándo usarlo**: referencia al diseñar o agregar secciones nuevas a la landing.

**Cuándo NO usarlo**: en el dashboard (ahí usar `py-6 md:py-8` del shell).

**Anatomía**:

| Sección | Padding desktop | Padding mobile | Container |
|---|---|---|---|
| Hero | `pt-36 pb-28` | `pt-28 pb-20` | `max-w-6xl` |
| TrustStrip | `py-24` | `py-16` | `max-w-6xl` |
| FAQ | `py-24` | `py-16` | `max-w-6xl` |
| FinalCTA | `py-28` | `py-20` | `max-w-6xl` |
| Footer | `py-12` | `py-12` | `max-w-6xl` |

Alternancia de fondo: oscuro (Hero, FinalCTA, Footer) → claro (TrustStrip, FAQ, mayoría) → oscuro. Padding horizontal del container: `1.5rem`.

**Variantes**: ninguna — convención fija.

**Implementación de referencia**: [`src/pages/Index.tsx`](../src/pages/Index.tsx)

**Snippet**: ver composición de secciones en `Index.tsx:24-35`.

---

## 4. Primitivos Shadcn (mapeo)

| Primitivo | Path | Intención de uso en Comparo3D |
|---|---|---|
| `Button` | `src/components/ui/button.tsx` | CTAs. Para gradient-primary: clase custom `bg-gradient-primary text-white` sobre variant `default`. |
| `Card` | `src/components/ui/card.tsx` | Base interna de `DashboardPanel`. No usar directamente en dashboard — usar `DashboardPanel`. |
| `Dialog` | `src/components/ui/dialog.tsx` | Modales de detalle (ej: portfolio, Subproyecto 2). |
| `Popover` | `src/components/ui/popover.tsx` | Tooltips de badges (Subproyecto 1). Preferir sobre `Tooltip` para textos >15 palabras. |
| `Tooltip` | `src/components/ui/tooltip.tsx` | Hover hints cortos (<15 palabras). |
| `Accordion` | `src/components/ui/accordion.tsx` | FAQ landing. Listas colapsables en dashboard (Subproyecto 2). |
| `Badge` | `src/components/ui/badge.tsx` | Chips neutros sin color semántico. Para badges con color e icono ver patrón 3.8. |
| `Avatar` | `src/components/ui/avatar.tsx` | Reviewers (Subproyecto 2). Fallback: inicial + color por hash. |
| `Tabs` | `src/components/ui/tabs.tsx` | Navegación interna secundaria en vistas del dashboard. |
| `Label` | `src/components/ui/label.tsx` | Base de `DashboardField`. |
| `Switch` | `src/components/ui/switch.tsx` | Toggles en StepQuotes (Solo certificados, Cerca mío). |

Otros primitivos disponibles: Alert, AlertDialog, AspectRatio, Breadcrumb, Calendar, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Drawer, DropdownMenu, Form, HoverCard, Input, InputOTP, Menubar, NavigationMenu, Pagination, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Table, Textarea, Toast, Toaster, Toggle, ToggleGroup. Ver `src/components/ui/`.

---

## 5. Roadmap (patrones pendientes)

- **Floating ranking explainer** — Widget flotante con panel expandible que explica el algoritmo de ranking (Subproyecto 1).
- **Badge tooltip trigger** — Signo "?" junto a un badge que abre un Popover explicativo (Subproyecto 1).
- **Provider profile hero** — Header de perfil individual: logo grande + nombre + badges + stats + ubicación (Subproyecto 2).
- **Portfolio gallery with modal** — Grid de thumbnails con hover overlay y modal de detalle (Subproyecto 2).
- **Reviews carousel** — Carrusel horizontal: avatar + stars + fecha + texto (Subproyecto 2).
- **Provider summary card expandible** — Card de listado público que se expande inline (Subproyecto 3).
- **Filters sidebar** — Sidebar de filtros con checkboxes/selects para listado público (Subproyecto 3).

---

## 6. Discrepancias detectadas

- **Color hardcoded fuera de paleta** (`StepQuotes.tsx:299`): el botón "Comprar" en `ProviderCard` usa `bg-[#667eea]` / `hover:bg-[#5b6fd6]`. No corresponde a `--primary` (HSL 220 70% 45%) ni a `bg-gradient-primary`. Debería unificarse con la paleta.
- **Conflicto tipográfico en `src/index.css`**: `h2, h4, h5, h6` reciben `@apply font-display` (Space Grotesk), pero inmediatamente después `h2, h3` reciben `font-family: 'Montserrat'` vía CSS directo. La segunda regla gana. Resultado correcto en práctica, pero la intención se lee contradictoria.
- **Sintaxis inconsistente en `--shadow-cta`**: `0 4px 20px hsl(220, 70%, 45% / 0.35)` mezcla coma dentro de `hsl()` con barra para alpha — no es sintaxis CSS estándar. Los demás shadows usan `hsl(x y% z% / alpha)` sin comas.
- **Sidebar tokens con escala de grises distinta**: los tokens `--sidebar-*` usan hue `240` en lugar de `220` del resto de la paleta. No impacta hoy (dashboard V2 usa `bg-gradient-dark` directamente), pero puede crear confusión si se adopta el sistema de sidebar de Shadcn.
