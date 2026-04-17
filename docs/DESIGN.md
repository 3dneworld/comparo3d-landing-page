# DESIGN.md — Sistema visual Comparo3D

> Fuente de verdad para construir UI coherente en landing publica + dashboard V2 + paginas nuevas. Generado desde tokens reales del codigo. Version viva: se actualiza cuando un subproyecto introduce un patron nuevo.

---

## 1. Principios de marca

- **Base clara + acentos gradient.** Fondos `bg-background` (HSL 220 20% 97%) o `bg-card` (blanco puro). Los gradientes `bg-gradient-primary` y `bg-gradient-accent` se reservan exclusivamente para CTAs de conversion y acentos puntuales de alta jerarquia. Nunca como fondo de lectura ni como fondo de seccion completa.
- **Tipografia jerarquica.** Montserrat (800) para h1; Montserrat (700) para h2 y h3. Inter (400-600) para body, labels y toda UI operativa. Space Grotesk (`font-display`) solo para display hero o h4-h6 cuando haga falta contraste tipografico.
- **Densidad equilibrada.** Landing: padding generoso (`py-16` a `py-28`), aire como jerarquia visual. Dashboard: densidad operativa, mas info por pantalla, panels compactos con `p-6`.
- **Contraste alto en texto critico.** `text-foreground` (HSL 220 30% 12%) sobre fondo claro. Nunca usar `text-muted-foreground` en labels de acciones principales ni en headings.
- **Shadows sutiles como unica escala de elevacion.** `shadow-card` en reposo, `shadow-card-hover` en hover. `shadow-cta` solo en botones primarios con gradiente. No crear shadows custom fuera de estos tres niveles.
- **Radius consistente.** Base `--radius: 0.625rem`. Cards, inputs y buttons usan el mismo vocabulario derivado: `rounded-sm` (0.375rem), `rounded-md` (0.505rem), `rounded-lg` (0.625rem), `rounded-xl`, `rounded-2xl`. Valores custom solo en dashboard: `rounded-[1.25rem]` (panels), `rounded-[1.5rem]` (page headers), `rounded-[1.75rem]` (feedback states).
- **`bg-gradient-primary`** (azul -> cyan 135deg): solo CTAs de conversion y acentos de marca. Nunca como fondo de seccion ni como color de texto sin clip.
- **`bg-gradient-accent`** (naranja 135deg): solo urgencia positiva ("Mejor precio"). No en textos de lectura ni en estados de error.
- **No dark mode todavia.** No incluir variantes dark salvo que el subproyecto lo pida explicitamente. El sistema de tokens esta preparado (`:root` HSL) pero no hay `:root.dark` definido.
- **Animaciones controladas.** Toda animacion de scroll usa `AnimateOnScroll` o `StaggerChildren` de `src/components/`. Framer Motion con ease `[0.25, 0.1, 0.25, 1]` y duraciones entre 0.25s y 0.5s. Respetar `prefers-reduced-motion`.

**Anti-patterns:**
- Usar `bg-gradient-primary` como fondo de seccion completa — pierde jerarquia y fatiga visual.
- Mezclar radius distintos en elementos adyacentes (card `rounded-[1.25rem]` + input `rounded-sm`) — rompe ritmo visual.
- Poner `text-muted-foreground` en un boton de accion primaria — contraste insuficiente.
- Crear una shadow custom en vez de usar `shadow-card` / `shadow-card-hover` / `shadow-cta`.
- Usar `font-display` (Space Grotesk) para body text — rompe la jerarquia tipografica.
- Hardcodear colores hex en vez de usar tokens HSL — ver discrepancia `#667eea` en StepQuotes.

---

## 2. Tokens

### 2.1 Paleta (HSL)

Fuente: `src/index.css` — variables CSS en `:root`. Consumidas via Tailwind como `hsl(var(--token))`.

| Variable CSS | Valor HSL | Hex aprox. | Uso |
|---|---|---|---|
| `--background` | `220 20% 97%` | `#f5f6f8` | Fondo general de paginas |
| `--foreground` | `220 30% 12%` | `#161d2b` | Texto base de maxima legibilidad |
| `--card` | `0 0% 100%` | `#ffffff` | Superficie elevada (cards, panels, popovers) |
| `--card-foreground` | `220 30% 12%` | `#161d2b` | Texto sobre cards |
| `--popover` | `0 0% 100%` | `#ffffff` | Superficie de popover/dropdown |
| `--popover-foreground` | `220 30% 12%` | `#161d2b` | Texto sobre popover |
| `--primary` | `220 70% 45%` | `#2260c9` | Azul de marca — CTAs, links, iconos activos, focus ring |
| `--primary-foreground` | `0 0% 100%` | `#ffffff` | Texto sobre superficies primary |
| `--secondary` | `220 15% 92%` | `#e7e9ed` | Superficies secundarias neutras |
| `--secondary-foreground` | `220 30% 12%` | `#161d2b` | Texto sobre secondary |
| `--muted` | `220 15% 94%` | `#edeef1` | Fondos de iconos, chips, placeholders, skeletons |
| `--muted-foreground` | `220 10% 46%` | `#6a7085` | Texto secundario, ayuda, timestamps |
| `--accent` | `38 92% 55%` | `#f0a118` | Naranja — urgencia positiva, ratings, acentos calidos |
| `--accent-foreground` | `220 30% 12%` | `#161d2b` | Texto sobre accent |
| `--destructive` | `0 84% 60%` | `#ef4444` | Errores, acciones destructivas, validaciones |
| `--destructive-foreground` | `0 0% 100%` | `#ffffff` | Texto sobre destructive |
| `--border` | `220 15% 88%` | `#dcdfe5` | Bordes de cards, panels, dividers |
| `--input` | `220 15% 88%` | `#dcdfe5` | Bordes de inputs (mismo que border) |
| `--ring` | `220 70% 45%` | `#2260c9` | Focus ring (mismo hue que primary) |
| `--hero-bg` | `220 30% 8%` | `#0e1219` | Fondo oscuro: hero, login, footer, sidebar dashboard |
| `--hero-foreground` | `220 15% 95%` | `#f0f1f3` | Texto principal sobre fondo oscuro |
| `--hero-muted` | `220 15% 65%` | `#97a0b3` | Texto secundario sobre fondo oscuro |
| `--surface-elevated` | `0 0% 100%` | `#ffffff` | Superficies flotantes premium |

**Tokens sidebar (Shadcn defaults — no consumidos activamente):**

Los tokens `--sidebar-*` estan definidos en `:root` pero el dashboard V2 usa `bg-gradient-dark` directamente en el aside. Incluidos como referencia por si se adopta el sistema de sidebar de Shadcn en el futuro.

| Variable CSS | Valor HSL | Nota |
|---|---|---|
| `--sidebar-background` | `0 0% 98%` | Hue 0 (gris neutro, no 220) |
| `--sidebar-foreground` | `240 5.3% 26.1%` | Hue 240 (no 220) — ver discrepancias |
| `--sidebar-primary` | `240 5.9% 10%` | Hue 240 |
| `--sidebar-accent` | `240 4.8% 95.9%` | Hue 240 |
| `--sidebar-border` | `220 13% 91%` | Este si usa hue 220 |
| `--sidebar-ring` | `217.2 91.2% 59.8%` | Azul brillante |

### 2.2 Gradientes

Fuente: `src/index.css` — variables CSS custom, expuestas como utility classes en `@layer utilities`.

```css
/* bg-gradient-primary — azul tecnico → cyan */
--gradient-primary: linear-gradient(135deg, hsl(220, 70%, 45%), hsl(200, 80%, 50%));
/* Uso: Hero CTA, Navbar CTA, FinalCTA, ProveedoresLogin boton, DashboardStates actions */
/* Tailwind: className="bg-gradient-primary text-primary-foreground shadow-cta" */

/* bg-gradient-accent — naranja calido */
--gradient-accent: linear-gradient(135deg, hsl(38, 92%, 55%), hsl(28, 90%, 50%));
/* Uso: reservado para badge "Mejor precio" futuro. No activo en v1. */

/* bg-gradient-dark — fondo hero oscuro */
--gradient-dark: linear-gradient(180deg, hsl(220, 30%, 8%), hsl(220, 25%, 14%));
/* Uso: Hero landing, FinalCTA, ProveedoresLogin bg, Dashboard sidebar, Footer */
/* Tailwind: className="bg-gradient-dark" */
```

**Variante de texto gradiente:**
```css
.text-gradient-primary {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```
Usar como: `className="text-gradient-primary"` — aplica el gradiente primary como clip sobre texto. Util para headings de alto impacto.

### 2.3 Tipografia

| Familia | Tailwind class | Pesos cargados | Aplicacion |
|---|---|---|---|
| Montserrat | CSS directo `font-family` | 500, 600, 700, 800 | h1 (800 extrabold), h2 y h3 (700 bold) |
| Inter | `font-body` (default de body) | 400, 500, 600 | Body text, labels, UI operativa, descriptions |
| Space Grotesk | `font-display` | 400, 500, 600, 700 | Display hero alternativo, h4-h6 via `@apply font-display`, footer headings |

**Escalas tipograficas reales del codigo:**

| Contexto | Clases | Resultado |
|---|---|---|
| h1 landing hero | `text-3xl sm:text-4xl md:text-5xl font-extrabold text-hero-foreground leading-tight tracking-tight` | Montserrat 800, 30px→48px |
| h1 dashboard page header | `font-[Montserrat] text-3xl font-extrabold tracking-tight md:text-[2rem]` | Montserrat 800, 30px→32px |
| h2 seccion landing | `text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]` | Montserrat 700, 32px→42px |
| h2 FinalCTA | `text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground` | Montserrat 700, 24px→36px |
| Eyebrow dashboard | `text-[11px] font-semibold uppercase tracking-[0.16em] text-primary` | Inter 600, 11px |
| Eyebrow dashboard (variante) | `text-[11px] font-semibold uppercase tracking-[0.18em] text-primary` | Inter 600, 11px |
| Body seccion landing | `text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]` | Inter 400, 16px→18px |
| Label form dashboard | `text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground` | Inter 600, 12px |
| Footer heading | `font-display font-semibold text-hero-foreground text-sm` | Space Grotesk 600, 14px |

**Nota sobre conflicto CSS:** En `index.css`, `h2, h4, h5, h6` reciben `@apply font-display` (Space Grotesk), pero inmediatamente despues `h2, h3` reciben `font-family: 'Montserrat'` via CSS directo. La segunda regla gana por especificidad CSS (propiedad directa > @apply). Resultado correcto en practica, pero la intencion se lee contradictoria. Ver discrepancias.

### 2.4 Spacing

Escala estandar de Tailwind — no se extiende. No hay tokens custom de spacing.

**Container:** centrado, padding `1.5rem`, max-width `1280px` en pantallas `2xl`. Definido en `tailwind.config.ts`:
```ts
container: {
  center: true,
  padding: "1.5rem",
  screens: { "2xl": "1280px" },
},
```

**Spacing frecuente por contexto:**
- Landing secciones: `py-16 md:py-24` (estandar), `py-20 md:py-28` (alto impacto)
- Dashboard main: `px-5 py-6 md:px-6 md:py-8 xl:px-8`
- Card padding: `p-5 md:p-6` (landing), `p-6` (dashboard panels)
- Gap entre cards: `gap-4 md:gap-5` (grid), `gap-3` (inline)
- Stack vertical: `space-y-1` (compacto), `space-y-2.5` (form fields), `space-y-4` (sections)

### 2.5 Border radius

Base: `--radius: 0.625rem` (10px). Derivaciones en `tailwind.config.ts`:

| Tailwind class | Valor real | Uso tipico |
|---|---|---|
| `rounded-sm` | `calc(0.625rem - 4px)` = `0.375rem` (6px) | Chips internos, sub-badges |
| `rounded-md` | `calc(0.625rem - 2px)` = `0.505rem` (8px) | Botones Shadcn (default) |
| `rounded-lg` | `0.625rem` (10px) | Botones CTA, CTAs landing, containers generales |
| `rounded-xl` | Tailwind default (12px) | Cards landing (ProviderCard), icon containers |
| `rounded-2xl` | Tailwind default (16px) | Sections landing, sidebar nav items, login form |
| `rounded-full` | `9999px` | Pills, avatares, badges, delivery dots |
| `rounded-[1.25rem]` | 20px | DashboardPanel (custom) |
| `rounded-[1.5rem]` | 24px | DashboardPageHeader (custom) |
| `rounded-[1.75rem]` | 28px | DashboardFeedbackState (custom) |

### 2.6 Shadows

Definidas como variables CSS en `src/index.css`, expuestas como utility classes:

```css
/* shadow-card — elevacion base de cards y panels */
--shadow-card: 0 1px 3px hsl(220 30% 12% / 0.06),
               0 4px 12px hsl(220 30% 12% / 0.04);
/* Dos capas: sombra cercana sutil + sombra lejana difusa */

/* shadow-card-hover — elevacion hover, transicion de card */
--shadow-card-hover: 0 4px 16px hsl(220 30% 12% / 0.1),
                     0 8px 32px hsl(220 30% 12% / 0.06);
/* Salto notable de elevacion para feedback visual en hover */

/* shadow-cta — resplandor azul para CTAs primarios */
--shadow-cta: 0 4px 20px hsl(220, 70%, 45% / 0.35);
/* NOTA: sintaxis con comas en hsl() — ver discrepancias */
/* Uso: solo en botones con bg-gradient-primary */
```

**Patron de uso:**
```tsx
// Card en reposo
<div className="shadow-card" />

// Card con hover transition
<div className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-hover" />

// CTA primario con glow
<a className="bg-gradient-primary shadow-cta" />
```

### 2.7 Breakpoints

Escala estandar de Tailwind — no se modifica:

| Breakpoint | Ancho | Uso principal |
|---|---|---|
| `sm` | `640px` | Grid 2 cols, layout adaptativo basico |
| `md` | `768px` | Cambio a layout horizontal, escalas tipograficas mayores |
| `lg` | `1024px` | Sidebar dashboard visible, hero 2 cols, grids 4 cols |
| `xl` | `1280px` | Padding extra en dashboard main |
| `2xl` | `1536px` | Container tope a 1280px |

---

## 3. Patrones compuestos

### 3.1 Page header con eyebrow

**Intent**: cabecera estructurada de vista de dashboard — titulo, contexto y acciones de pagina.

**Cuando usarlo**: al inicio de cada vista del dashboard (Resumen, Perfil, Produccion, Materiales...).

**Cuando NO usarlo**: dentro de cards internas del dashboard. No usar en landing — ahi los headings van directamente en la seccion.

**Anatomia**:
```text
<header>
  className="rounded-[1.5rem] border border-border/70 bg-white/90 px-6 py-6
             shadow-card backdrop-blur-sm"
  └─ <div> flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between
      ├─ <div> space-y-1
      │   ├─ Eyebrow (opcional):
      │   │   className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
      │   ├─ h1:
      │   │   className="font-[Montserrat] text-3xl font-extrabold tracking-tight
      │   │              text-foreground md:text-[2rem]"
      │   ├─ description (opcional):
      │   │   className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground"
      │   └─ meta (opcional): flex flex-wrap gap-2 → DashboardStatePill children
      └─ actions (opcional): <div> shrink-0 flex gap-3 → Button children
```

**Variantes**: con/sin eyebrow, con/sin description, con/sin meta pills, con/sin actions.

**Implementacion de referencia**: [`src/features/provider-dashboard/components/DashboardPageHeader.tsx`](../src/features/provider-dashboard/components/DashboardPageHeader.tsx)

**Snippet**:
```tsx
<DashboardPageHeader
  eyebrow="Panel de proveedores"
  title="Resumen operativo"
  description="Estado actual de tu perfil, capacidad productiva y logistica."
  meta={
    <>
      <DashboardStatePill tone="success">Activo</DashboardStatePill>
      <DashboardStatePill tone="muted">ID 42</DashboardStatePill>
    </>
  }
  actions={
    <Button className="bg-gradient-primary text-white shadow-cta">
      Guardar cambios
    </Button>
  }
/>
```

---

### 3.2 Surface panel

**Intent**: contenedor de contenido elevado en el dashboard. Equivale a "card" operativa con header opcional.

**Cuando usarlo**: agrupar campos relacionados dentro de una vista de dashboard.

**Cuando NO usarlo**: wrapping de listas completas con scroll propio. No usar `Card` de Shadcn directamente en dashboard — siempre `DashboardPanel`.

**Anatomia**:
```text
<Card>
  className="overflow-hidden rounded-[1.25rem] border-border/70
             bg-white/95 shadow-card backdrop-blur-sm"
  ├─ <CardHeader> (condicional: si hay title, description o headerAction)
  │   className="flex flex-row items-start justify-between gap-4 p-6"
  │   ├─ <div>
  │   │   ├─ <CardTitle>
  │   │   │   className="font-[Montserrat] text-lg font-bold tracking-tight"
  │   │   └─ <CardDescription>
  │   │       className="text-sm text-muted-foreground"
  │   └─ headerAction (opcional): ReactNode alineado a la derecha
  └─ <CardContent>
      className="p-6" + (pt-0 si hay header arriba)
```

**Variantes**: sin header (solo contenido), con header completo, con headerAction a la derecha.

**Implementacion de referencia**: [`src/features/provider-dashboard/components/DashboardPanel.tsx`](../src/features/provider-dashboard/components/DashboardPanel.tsx)

**Snippet**:
```tsx
<DashboardPanel
  title="Datos comerciales"
  description="Informacion visible en tu perfil publico."
  headerAction={<Button variant="outline" size="sm">Editar</Button>}
>
  <div className="grid gap-6 md:grid-cols-2">
    <DashboardField label="Nombre comercial" htmlFor="nombre" required>
      <Input id="nombre" value={nombre} onChange={setNombre} />
    </DashboardField>
    <DashboardField label="CUIT" htmlFor="cuit">
      <Input id="cuit" value={cuit} readOnly />
    </DashboardField>
  </div>
</DashboardPanel>
```

---

### 3.3 State pill

**Intent**: indicador de estado compacto con semantica de color. Comunicacion rapida del estado de una entidad.

**Cuando usarlo**: estado de proveedor (activo, pausado, bloqueado), etiqueta semantica compacta en headers, IDs, contadores.

**Cuando NO usarlo**: para acciones clickeables (usar Button). Para texto descriptivo largo (usar description). Para navegacion (usar tabs/pills del shell).

**Anatomia**:
```text
<span>
  className="inline-flex items-center rounded-full border px-2.5 py-1
             text-[11px] font-semibold tracking-[0.04em]"
  + tone-specific classes (ver tabla)
  └─ {children} — texto corto (1-3 palabras)
```

**Variantes**:

| Tono | Clases de color | Uso tipico |
|---|---|---|
| `default` | `bg-background text-foreground border-border/80` | Neutro sin semantica |
| `success` | `bg-emerald-50 text-emerald-700 border-emerald-200` | Activo, completado, OK |
| `warning` | `bg-amber-50 text-amber-700 border-amber-200` | Pendiente, requiere atencion |
| `danger` | `bg-rose-50 text-rose-700 border-rose-200` | Suspendido, bloqueado, error |
| `info` | `bg-sky-50 text-sky-700 border-sky-200` | Informativo, onboarding |
| `muted` | `bg-muted/60 text-muted-foreground border-border/70` | IDs, metadata, "Luego" |

**Variante sidebar (sobre fondo oscuro):**
```text
className="border-white/10 bg-white/10 text-hero-foreground"   // estado
className="border-white/10 bg-white/5 text-hero-muted"         // ID
```

**Implementacion de referencia**: [`src/features/provider-dashboard/components/DashboardStatePill.tsx`](../src/features/provider-dashboard/components/DashboardStatePill.tsx)

**Snippet**:
```tsx
<DashboardStatePill tone="success">Activo</DashboardStatePill>
<DashboardStatePill tone="danger">Suspendido</DashboardStatePill>
<DashboardStatePill tone="warning">Pendiente validacion</DashboardStatePill>
<DashboardStatePill tone="muted">ID 42</DashboardStatePill>
```

---

### 3.4 Estados de vista (loading / empty / error)

**Intent**: estado de pantalla completa cuando la vista esta cargando, sin datos o fallo. Centered visual con icono grande, titulo y acciones.

**Cuando usarlo**: como contenido principal de una vista mientras carga, sin datos o con error accionable.

**Cuando NO usarlo**: dentro de un panel parcial — ahi usar skeleton inline o un mensaje simple.

**Anatomia**:
```text
<div> className="min-h-[60vh] flex items-center justify-center"
  └─ <div> className="mx-auto max-w-xl rounded-[1.75rem] border border-border/70
                       bg-white/95 p-8 text-center shadow-card"
      ├─ Icon container:
      │   className="mx-auto flex h-14 w-14 items-center justify-center
      │              rounded-2xl bg-muted text-primary"
      │   └─ <Icon className="h-7 w-7" /> (animate-spin para loading)
      ├─ h1: className="mt-5 font-[Montserrat] text-2xl font-bold tracking-tight"
      ├─ description:
      │   className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground"
      └─ actions (opcional):
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
          ├─ Primary: <Button className="bg-gradient-primary text-white shadow-cta">
          └─ Secondary: <Button variant="outline">
```

**Variantes**:
- `DashboardLoadingState` — Loader2 con `animate-spin`, sin acciones.
- `DashboardEmptyState` — AlertTriangle (customizable via `icon` prop), con acciones opcionales.
- `DashboardErrorState` — AlertTriangle + CTA reintento + CTA secundario "Volver".

**Implementacion de referencia**: [`src/features/provider-dashboard/components/DashboardStates.tsx`](../src/features/provider-dashboard/components/DashboardStates.tsx)

**Snippet**:
```tsx
<DashboardLoadingState />

<DashboardEmptyState
  title="Sin impresoras configuradas"
  description="Agrega al menos una impresora para habilitar cotizaciones automaticas."
  actionLabel="Agregar impresora"
  onAction={handleAdd}
/>

<DashboardErrorState
  title="Error al cargar datos"
  description="No pudimos obtener la informacion. Intenta de nuevo."
  retryLabel="Reintentar"
  onRetry={handleRetry}
/>
```

---

### 3.5 Form field

**Intent**: campo de formulario consistente con label uppercase + control + ayuda/error. Estandariza la presentacion de todos los campos editables del dashboard.

**Cuando usarlo**: todo campo editable en vistas de dashboard — inputs, selects, switches, textareas.

**Cuando NO usarlo**: en landing — los inputs van con label inline o placeholder directamente. En cards de solo lectura.

**Anatomia**:
```text
<div> className="space-y-2.5"
  ├─ <Label>
  │   htmlFor={htmlFor}
  │   className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
  │   └─ {label} + (" *" si required, en text-rose-500)
  ├─ {children} — Input, Select, Switch, Textarea u otro control Shadcn
  └─ Feedback:
      ├─ error: <p className="text-xs text-rose-600">{error}</p>
      └─ hint:  <p className="text-xs text-muted-foreground">{hint}</p>
```

**Variantes**: con/sin hint, con/sin error, required (agrega asterisco rojo).

**Implementacion de referencia**: [`src/features/provider-dashboard/components/DashboardField.tsx`](../src/features/provider-dashboard/components/DashboardField.tsx)

**Snippet**:
```tsx
<DashboardField
  label="Nombre comercial"
  htmlFor="nombre"
  hint="Como aparece en las cotizaciones."
  required
>
  <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
</DashboardField>

<DashboardField label="Notas internas" htmlFor="notas" error={errors.notas}>
  <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
</DashboardField>
```

---

### 3.6 App shell (sidebar + topbar)

**Intent**: layout de aplicacion del dashboard V2. Sidebar oscuro persistente en desktop, topbar sticky con tabs scroll horizontal en mobile.

**Cuando usarlo**: wrappear todas las vistas del dashboard V2 (`/proveedores-v2/*`).

**Cuando NO usarlo**: landing publica, paginas standalone como login, paginas de error.

**Anatomia**:
```text
<div> className="min-h-screen bg-background text-foreground"
  ├─ Grid overlay decorativo:
  │   className="pointer-events-none fixed inset-0 opacity-[0.035]"
  │   style={{ backgroundImage: SVG grid 72x72 stroke #0f172a 0.8 }}
  └─ <div> className="relative flex min-h-screen"
      ├─ <aside> className="hidden w-[292px] shrink-0 border-r border-white/10
      │          bg-gradient-dark text-hero-foreground lg:flex lg:flex-col"
      │   ├─ Header (border-b border-white/10 px-7 py-6):
      │   │   ├─ Logo: <img className="h-8" />
      │   │   ├─ Eyebrow: text-[11px] uppercase tracking-[0.16em] text-primary/90
      │   │   ├─ Nombre: font-[Montserrat] text-2xl font-bold text-hero-foreground
      │   │   ├─ Tagline: text-sm text-hero-muted
      │   │   └─ Pills: DashboardStatePill (estado + ID)
      │   ├─ <nav> flex-1 px-4 py-5:
      │   │   └─ NavLink items (10 total):
      │   │       Active:  "bg-white/10 text-hero-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      │   │       Inactive: "text-hero-muted hover:bg-white/6 hover:text-hero-foreground"
      │   │       Disabled: "text-hero-muted/80" + pill "Luego"
      │   │       Cada item: rounded-2xl px-4 py-3 con Icon + label + ChevronRight
      │   └─ Footer card (border-t border-white/10 px-6 py-5):
      │       rounded-[1.25rem] border-white/10 bg-white/5 p-4
      └─ <div> className="flex min-h-screen flex-1 flex-col"
          ├─ <header> className="sticky top-0 z-20 border-b border-border/70
          │           bg-background/85 backdrop-blur"
          │   └─ <div> max-w-[1600px] px-5 py-4 md:px-6 xl:px-8
          │       ├─ Info bar: eyebrow + nombre + seccion + ubicacion + botones
          │       └─ Nav mobile (lg:hidden): scroll-x overflow de NavLink pills
          │           Active:  "border-primary/20 bg-primary/10 text-primary"
          │           Inactive: "border-border/80 bg-white text-muted-foreground"
          └─ <main> className="flex-1"
              └─ <div> max-w-[1600px] px-5 py-6 md:px-6 md:py-8 xl:px-8
```

**Variantes**: en mobile (< `lg`) el sidebar se oculta completamente; la topbar sirve como nav principal con pills scrolleables.

**Implementacion de referencia**: [`src/features/provider-dashboard/components/ProviderDashboardShell.tsx`](../src/features/provider-dashboard/components/ProviderDashboardShell.tsx)

**Snippet**:
```tsx
<ProviderDashboardShell user={user} provider={provider} onLogout={handleLogout}>
  <ProviderSummaryView providerId={provider.id} />
</ProviderDashboardShell>
```

---

### 3.7 Quote result card

**Intent**: card de proveedor en el listado de cotizaciones. Compara precio, rating, distancia, tiempo de entrega y certificacion.

**Cuando usarlo**: listado de cotizaciones del widget de cotizacion.

**Cuando NO usarlo**: en listado publico de proveedores (sera el patron "Provider summary card expandible" — ver roadmap).

**Anatomia**:
```text
<div>
  className="relative rounded-xl border p-4 shadow-sm transition-all
             hover:-translate-y-0.5 hover:shadow-card-hover"
  + isBestPrice ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
                : "border-border bg-card"
  ├─ Badge flotante "Mejor precio" (si isBestPrice):
  │   className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r
  │              from-emerald-500 to-green-600 px-3 py-0.5
  │              text-[11px] font-bold text-white"
  └─ <div> className="flex flex-col gap-4 md:flex-row md:items-center"
      ├─ Avatar:
      │   Con logo: <img className="h-12 w-12 rounded-full object-cover" />
      │   Sin logo: <div className="flex h-12 w-12 items-center justify-center
      │              rounded-full bg-primary/10 text-[18px] font-bold text-primary">
      │              {inicial}
      ├─ Info:
      │   ├─ Nombre: text-[16px] font-bold text-foreground
      │   ├─ Rating: StarRating + score text-amber-600 font-semibold + (count)
      │   ├─ Ubicacion: MapPin size=12 text-red-500 + texto + distancia km
      │   ├─ Delivery: dot coloreado + Truck size=12 + "N dias"
      │   │   Dot: emerald-500 (<=3d), amber-400 (<=7d), sky-500 (>7d)
      │   └─ Badge Certificado: bg-emerald-50 text-emerald-700 + ShieldCheck
      └─ Precio + CTA:
          ├─ Precio: text-[20px] font-extrabold text-foreground
          └─ Boton: bg-[#667eea] rounded-lg px-4 py-2 text-[13px] font-bold text-white
             NOTA: color hardcoded — ver discrepancias
```

**Variantes**: `isBestPrice=true` activa borde emerald, fondo gradiente y badge flotante. `is_certified=true` muestra badge Certificado.

**Extension futura (Subproyecto 1)**: badge "Seleccion Fundador", tooltips por badge, contador B2B, ranking explainer.

**Implementacion de referencia**: [`src/components/landing/quote/StepQuotes.tsx:217`](../src/components/landing/quote/StepQuotes.tsx)

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

**Cuando usarlo**: indicar calidad (Certificado), ventaja (Mejor precio), material, dimension u otro tag de atributo.

**Cuando NO usarlo**: acciones clickeables (usar Button). Estados de vista completa (usar StatePill). Listas de tags editables.

**Anatomia**:
```text
<span>
  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5
             text-[11px] font-semibold"
  └─ <Icon size={12} /> + texto
```

**Variantes**:

| Instancia | Clases | Icono |
|---|---|---|
| Certificado | `bg-emerald-50 text-emerald-700` | `ShieldCheck` size=12 |
| Mejor precio (flotante) | `bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold` | ninguno (solo texto) |
| Tag material/dimension | `border border-border bg-muted/50 text-foreground` | icono custom |
| Nav disabled (sidebar) | `border-white/8 bg-white/5 text-hero-muted` | ninguno (texto "Luego") |

**Implementacion de referencia**: [`src/components/landing/quote/StepQuotes.tsx:282`](../src/components/landing/quote/StepQuotes.tsx)

**Snippet**:
```tsx
{/* Badge Certificado */}
<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
  <ShieldCheck size={12} />
  Certificado
</span>

{/* Badge Mejor precio (flotante absoluto) */}
<span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-0.5 text-[11px] font-bold text-white">
  Mejor precio
</span>
```

---

### 3.9 Hero dark con grid pattern

**Intent**: pagina standalone con fondo `bg-gradient-dark` y grid SVG sutil. Para contextos de acceso o alto impacto visual donde se necesita la estetica dark de marca.

**Cuando usarlo**: login de proveedores, onboarding standalone, paginas de acceso.

**Cuando NO usarlo**: dentro del dashboard (el shell ya tiene su propia estetica). Para secciones parciales de landing, usar FinalCTA o Hero directamente.

**Anatomia**:
```text
<div> className="relative min-h-screen overflow-hidden bg-gradient-dark"
  ├─ Grid overlay:
  │   className="absolute inset-0 opacity-[0.03]"
  │   style={{ backgroundImage: SVG grid 40x40 stroke white 0.5 }}
  ├─ <header> className="relative z-10 border-b border-hero-muted/10"
  │   └─ container h-16: logo blanco h-8 + link "Volver" con ArrowLeft
  └─ <div> className="relative z-10 container flex min-h-[calc(100vh-4rem)]
                       items-center justify-center"
      └─ <div> className="grid w-full max-w-5xl items-center gap-12 py-12
                          lg:grid-cols-2 lg:gap-20"
          ├─ Visual col (hidden lg:flex):
          │   imagen + estadisticas + blur decorativo bg-primary/5
          └─ Form col:
              ├─ Eyebrow: text-[11px] uppercase tracking-[0.18em] text-primary
              ├─ h1: text-3xl md:text-4xl font-extrabold text-hero-foreground
              ├─ p: text-hero-muted leading-relaxed
              └─ Form card:
                  className="rounded-2xl border border-hero-muted/10
                             bg-hero-muted/5 p-6 space-y-4"
```

**Variantes**: una sola col (solo form, mobile) vs dos cols con imagen lateral (desktop `lg`).

**Implementacion de referencia**: [`src/pages/ProveedoresLogin.tsx`](../src/pages/ProveedoresLogin.tsx)

**Snippet**:
```tsx
<div className="relative min-h-screen overflow-hidden bg-gradient-dark">
  <div
    className="absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
    }}
  />
  <header className="relative z-10 border-b border-hero-muted/10">
    <div className="container flex h-16 items-center justify-between">
      <a href="/"><img src={logoWhite} alt="COMPARO3D" className="h-8" /></a>
      <a href="/" className="flex items-center gap-1.5 text-sm text-hero-muted hover:text-hero-foreground">
        <ArrowLeft size={14} /> Volver al sitio principal
      </a>
    </div>
  </header>
  {/* Grid 2 cols con form */}
</div>
```

---

### 3.10 Landing hero

**Intent**: primera seccion de la landing. Fondo oscuro con grid animado, copy de conversion audience-aware y visualizacion de proceso en desktop.

**Cuando usarlo**: solo como hero principal de la landing.

**Cuando NO usarlo**: paginas internas, dashboard, login.

**Anatomia**:
```text
<section> className="relative bg-gradient-dark pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden"
  ├─ Grid animado:
  │   <motion.div> absolute inset-0 opacity-[0.03]
  │   SVG grid 40x40, animate backgroundPosition 0→40px en 20s linear infinite
  └─ container max-w-6xl relative z-10
      └─ flex col→lg:row items-center gap-12 lg:gap-16
          ├─ Left copy (flex-1 max-w-xl):
          │   <motion.div> key={audience} initial opacity:0 y:12 → animate opacity:1 y:0
          │   ├─ h1: text-3xl sm:text-4xl md:text-5xl font-extrabold text-hero-foreground
          │   ├─ p: mt-5 text-base md:text-lg text-hero-muted leading-relaxed
          │   ├─ CTA row: flex col sm:row gap-4
          │   │   ├─ Primary: bg-gradient-primary px-8 py-3.5 rounded-lg font-semibold shadow-cta
          │   │   └─ Secondary: border border-hero-muted/25 px-6 py-3.5 rounded-lg text-sm
          │   └─ Mobile indicators (lg:hidden): flex gap-6→sm:gap-8
          │       Cada: icon container h-11 w-11 rounded-xl border-hero-muted/15 bg-hero-muted/10
          └─ Right panel (hidden lg:block, flex-1 max-w-md):
              bg-hero-muted/5 border-hero-muted/10 rounded-2xl p-6 space-y-4
              └─ 4 steps visualizados (upload, preview, quotes, delivery)
```

**Variantes**: audience-aware (particular / empresa) — copy, CTA label y subtexto cambian via `useAudience()`. Mismo layout visual.

**Implementacion de referencia**: [`src/components/landing/Hero.tsx`](../src/components/landing/Hero.tsx)

**Snippet**:
```tsx
{/* Uso en Index.tsx — sin props, consume useAudience() */}
<Hero />

{/* CTA primario interno */}
<a
  href="#cotizar"
  className="bg-gradient-primary text-primary-foreground px-8 py-3.5 rounded-lg
             font-semibold text-base hover:opacity-90 transition-opacity shadow-cta
             flex items-center gap-2"
>
  Cotizar ahora <ArrowRight size={18} />
</a>
```

---

### 3.11 Trust strip

**Intent**: grilla de 4 cards de credibilidad con icono + titulo + descripcion. Refuerza confianza despues del hero.

**Cuando usarlo**: seccion de confianza debajo del hero en landing.

**Cuando NO usarlo**: dashboard. Grillas de >4 items (considerar otro layout).

**Anatomia**:
```text
<section> className="bg-background py-16 md:py-24"
  └─ container max-w-6xl
      ├─ Header centrado (AnimateOnScroll fade-up):
      │   ├─ h2: text-[32px] md:text-[42px] font-bold leading-[1.08] text-foreground
      │   └─ p: mt-4 max-w-xl text-[16px] md:text-[18px] leading-[1.7] text-muted-foreground
      └─ Grid (StaggerChildren):
          className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2
                     lg:grid-cols-4 md:gap-5"
          └─ Cada card (StaggerItem):
              <article> className="flex h-full flex-col items-center rounded-2xl border
                        border-border bg-card p-5 text-center transition-all duration-200
                        hover:border-primary/20 hover:shadow-md md:p-6"
              ├─ Icon: <div className="flex h-12 w-12 items-center justify-center
              │         rounded-xl bg-primary/[0.12]">
              │         <Icon size={24} strokeWidth={2} className="text-primary" />
              ├─ h3: mt-3 text-[16px] md:text-[17px] font-semibold leading-[1.2]
              └─ p: mt-2 text-[13px] md:text-[14px] leading-[1.65] text-muted-foreground
```

**Variantes**: audience-aware — items y headline cambian via `useAudience()`. Particular: BarChart3, ShieldCheck, Clock, Truck. Empresa: Users, Layers, ShieldCheck, Lock.

**Implementacion de referencia**: [`src/components/landing/TrustStrip.tsx`](../src/components/landing/TrustStrip.tsx)

**Snippet**:
```tsx
{/* Uso en Index.tsx */}
<TrustStrip />

{/* Card individual (referencia de patron) */}
<article className="flex h-full flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-all duration-200 hover:border-primary/20 hover:shadow-md md:p-6">
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.12]">
    <ShieldCheck size={24} strokeWidth={2} className="text-primary" />
  </div>
  <h3 className="mt-3 text-[16px] font-semibold leading-[1.2] text-foreground md:text-[17px]">
    Proveedores verificados
  </h3>
  <p className="mt-2 text-[13px] leading-[1.65] text-muted-foreground md:text-[14px]">
    La red se evalua por capacidad, calidad y cumplimiento.
  </p>
</article>
```

---

### 3.12 Final CTA

**Intent**: seccion de cierre de pagina con fondo oscuro y un unico CTA de alta conversion. Ultimo empujon antes del footer.

**Cuando usarlo**: al final de la landing publica, justo antes del footer.

**Cuando NO usarlo**: en medio de la pagina, en el dashboard, ni como componente reutilizable generico.

**Anatomia**:
```text
<section> className="py-20 md:py-28 bg-gradient-dark"
  └─ container max-w-6xl text-center
      └─ AnimateOnScroll variant="fade-up"
          ├─ h2: text-2xl md:text-3xl lg:text-4xl font-bold text-hero-foreground max-w-2xl mx-auto
          ├─ p: mt-4 text-hero-muted max-w-lg mx-auto
          └─ CTA:
              className="mt-8 inline-flex items-center gap-2 bg-gradient-primary
                         text-primary-foreground px-10 py-4 rounded-lg font-semibold
                         text-lg hover:opacity-90 transition-opacity shadow-cta"
              └─ {label} + <ArrowRight size={20} />
```

**Variantes**: audience-aware — headline, subtexto y CTA label cambian via `useAudience()`.

**Implementacion de referencia**: [`src/components/landing/FinalCTA.tsx`](../src/components/landing/FinalCTA.tsx)

**Snippet**:
```tsx
<FinalCTA />

{/* CTA interno (referencia) */}
<a
  href="#cotizar"
  className="mt-8 inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-10 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-cta"
>
  Cotizar ahora <ArrowRight size={20} />
</a>
```

---

### 3.13 Navbar

**Intent**: barra de navegacion fija de la landing. Transparente en top, solidifica con blur al scrollear. Incluye CTA primario y drawer mobile.

**Cuando usarlo**: solo en la landing publica.

**Cuando NO usarlo**: dashboard (usa topbar del shell). Login (usa header propio simple).

**Anatomia**:
```text
<nav>
  className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
  + scrolled ? "bg-hero/95 backdrop-blur-md border-b border-hero-muted/10 shadow-lg"
             : "bg-transparent border-b border-transparent"
  └─ container max-w-6xl flex items-center justify-between h-16
      ├─ Logo: <img className="h-8" />
      ├─ Desktop nav (hidden md:flex gap-8):
      │   ├─ Links: text-sm text-hero-muted hover:text-hero-foreground transition-colors
      │   └─ CTA: bg-gradient-primary text-primary-foreground px-5 py-2 rounded-lg
      │           text-sm font-semibold shadow-cta
      └─ Mobile toggle (md:hidden):
          <button> text-hero-foreground → Menu/X icon size=24
          └─ Drawer: bg-hero border-t border-hero-muted/10 pb-4
              Links: text-sm text-hero-muted py-2
              CTA: bg-gradient-primary rounded-lg text-center
```

**Variantes**: scrolled vs unscrolled (cambio de fondo y shadow). Mobile drawer abierto/cerrado.

**Implementacion de referencia**: [`src/components/landing/Navbar.tsx`](../src/components/landing/Navbar.tsx)

**Snippet**:
```tsx
<Navbar />

{/* Link interno de referencia */}
<a href="#como-funciona" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">
  Como funciona
</a>

{/* CTA navbar */}
<a href="#cotizar" className="bg-gradient-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-cta">
  Cotizar ahora
</a>
```

---

### 3.14 Footer

**Intent**: pie de pagina de la landing. Fondo oscuro, grid de 4 columnas con logo, links, contacto y redes sociales.

**Cuando usarlo**: al final de la landing publica, despues de FinalCTA.

**Cuando NO usarlo**: dashboard (no tiene footer).

**Anatomia**:
```text
<footer> className="bg-hero border-t border-hero-muted/10 py-12"
  └─ container max-w-6xl
      ├─ AnimateOnScroll variant="fade-up" delay={0.1}
      │   └─ Grid: sm:grid-cols-2 lg:grid-cols-4 gap-8
      │       ├─ Col 1: logo h-8 + tagline text-sm text-hero-muted
      │       ├─ Col 2: h4 font-display font-semibold text-hero-foreground text-sm
      │       │         + <ul> links text-sm text-hero-muted hover:text-hero-foreground
      │       ├─ Col 3: h4 + links (misma estructura)
      │       └─ Col 4: h4 "Contacto"
      │           ├─ Ubicacion: text-sm text-hero-muted
      │           ├─ Email: link hover:text-hero-foreground
      │           └─ Social icons: flex gap-3
      │               Cada: className="flex h-9 w-9 items-center justify-center rounded-lg
      │                      bg-hero-muted/10 text-hero-muted hover:bg-hero-muted/20
      │                      hover:text-hero-foreground transition-colors"
      └─ Bottom bar:
          className="mt-10 pt-6 border-t border-hero-muted/10 text-center"
          └─ <p> text-xs text-hero-muted: copyright
```

**Variantes**: ninguna — contenido estatico.

**Implementacion de referencia**: [`src/components/landing/Footer.tsx`](../src/components/landing/Footer.tsx)

**Snippet**:
```tsx
<Footer />

{/* Social icon de referencia */}
<a
  href="https://www.instagram.com/comparo3d"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Instagram"
  className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-muted/10 text-hero-muted transition-colors hover:bg-hero-muted/20 hover:text-hero-foreground"
>
  {/* SVG icon */}
</a>
```

---

### 3.15 FAQ accordion

**Intent**: lista de preguntas frecuentes expandibles. Numeracion con pill primary, apertura animada con Framer Motion height 0→auto.

**Cuando usarlo**: seccion FAQ en landing publica.

**Cuando NO usarlo**: dashboard — ahi usar `Accordion` de Shadcn directamente si hace falta contenido colapsable.

**Anatomia**:
```text
<section> id="faq" className="scroll-mt-24 bg-background py-16 md:scroll-mt-28 md:py-24"
  └─ container max-w-6xl
      ├─ Header centrado (AnimateOnScroll fade-up):
      │   ├─ h2: text-[32px] md:text-[42px] font-bold leading-[1.08] text-foreground
      │   └─ p: mt-5 max-w-3xl text-[16px] md:text-[18px] leading-[1.7] text-muted-foreground
      └─ Lista (StaggerChildren staggerDelay={0.05}):
          className="divide-y divide-border border-t border-border"
          └─ Cada item (StaggerItem):
              ├─ <button> type="button" aria-expanded={isOpen}
              │   className="flex w-full items-center gap-4 py-5 text-left md:py-6"
              │   ├─ Numero pill:
              │   │   className="flex h-7 w-7 shrink-0 items-center justify-center
              │   │              rounded-full bg-primary text-[12px] font-bold
              │   │              text-primary-foreground"
              │   ├─ Pregunta:
              │   │   className="flex-1 text-[15px] font-medium leading-[1.45]
              │   │              text-foreground md:text-[16px]"
              │   └─ Toggle icon: Plus/Minus size=18 text-muted-foreground
              └─ <AnimatePresence>
                  └─ <motion.div>
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                      └─ <div> className="pb-5 pl-11 pr-10 md:pb-6"
                          └─ <p> text-[14px] md:text-[15px] leading-[1.75] text-muted-foreground
```

**Variantes**: audience-aware — preguntas, respuestas y eyebrow cambian via `useAudience()`. Particular: 8 preguntas. Empresa: 8 preguntas.

**Implementacion de referencia**: [`src/components/landing/FAQ.tsx`](../src/components/landing/FAQ.tsx)

**Snippet**:
```tsx
<FAQ />

{/* Numero pill de referencia */}
<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-primary-foreground">
  {index + 1}
</span>
```

---

### 3.16 Section rhythm (landing)

**Intent**: patron de spacing vertical y alternancia de fondo entre secciones — no es un componente, sino una convencion de layout.

**Cuando usarlo**: referencia al disenar o agregar secciones nuevas a la landing.

**Cuando NO usarlo**: en el dashboard (ahi usar `py-6 md:py-8` del shell main).

**Anatomia**:

| Seccion | Padding desktop | Padding mobile | Container | Fondo |
|---|---|---|---|---|
| Hero | `pt-36 pb-28` | `pt-28 pb-20` | `max-w-6xl` | `bg-gradient-dark` |
| TrustStrip | `py-24` | `py-16` | `max-w-6xl` | `bg-background` |
| ProvidersSection | `py-24` | `py-16` | `max-w-6xl` | `bg-background` |
| HowItWorks | `py-24` | `py-16` | `max-w-6xl` | `bg-background` |
| QuoteSection | `py-24` | `py-16` | `max-w-6xl` | `bg-background` |
| FAQ | `py-24` | `py-16` | `max-w-6xl` | `bg-background` |
| FinalCTA | `py-28` | `py-20` | `max-w-6xl` | `bg-gradient-dark` |
| Footer | `py-12` | `py-12` | `max-w-6xl` | `bg-hero` |

**Alternancia de fondo:** oscuro (Hero) → claro (TrustStrip → ... → FAQ) → oscuro (FinalCTA, Footer). Padding horizontal del container: `1.5rem` via config.

**Implementacion de referencia**: [`src/pages/Index.tsx`](../src/pages/Index.tsx)

**Snippet**: ver composicion de secciones en `Index.tsx:24-35`.

---

## 4. Primitivos Shadcn (mapeo)

| Primitivo | Path | Intencion de uso en Comparo3D |
|---|---|---|
| `Button` | `src/components/ui/button.tsx` | CTAs de todas las superficies. Variants: `default` (bg-primary), `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default` (h-10 px-4), `sm` (h-9 px-3), `lg` (h-11 px-8), `icon` (h-10 w-10). Para gradient CTA: usar variant `default` + className override `bg-gradient-primary text-white shadow-cta`. |
| `Card` | `src/components/ui/card.tsx` | Base interna de `DashboardPanel`. **No usar directamente en dashboard** — siempre usar `DashboardPanel` que agrega radius, blur y shadow correctos. |
| `Dialog` | `src/components/ui/dialog.tsx` | Modales de detalle (ej: portfolio, Subproyecto 2). Overlay + centered content. |
| `Popover` | `src/components/ui/popover.tsx` | Tooltips de badges (Subproyecto 1). Preferir sobre `Tooltip` para textos >15 palabras o contenido rico. |
| `Tooltip` | `src/components/ui/tooltip.tsx` | Hover hints cortos (<15 palabras, texto plano). |
| `Accordion` | `src/components/ui/accordion.tsx` | FAQ landing (via componente custom con Framer Motion). Listas colapsables en dashboard (Subproyecto 2). Keyframes: `accordion-down` 0.2s ease-out, `accordion-up` 0.2s ease-out. |
| `Badge` | `src/components/ui/badge.tsx` | Chips neutros sin color semantico. Para badges con color semantico e icono, ver patron 3.8. |
| `Avatar` | `src/components/ui/avatar.tsx` | Reviewers (Subproyecto 2). Fallback: inicial + color por hash. |
| `Tabs` | `src/components/ui/tabs.tsx` | Navegacion interna secundaria en vistas del dashboard. |
| `Label` | `src/components/ui/label.tsx` | Base interna de `DashboardField`. |
| `Switch` | `src/components/ui/switch.tsx` | Toggles en StepQuotes (Solo certificados, Cerca mio). |
| `Input` | `src/components/ui/input.tsx` | Campos de texto en formularios del dashboard. |
| `Textarea` | `src/components/ui/textarea.tsx` | Campos de texto multi-linea en dashboard (notas, descripciones). |
| `Select` | `src/components/ui/select.tsx` | Dropdowns de seleccion (provincia, material, estado). |

Otros primitivos disponibles pero no usados activamente: Alert, AlertDialog, AspectRatio, Breadcrumb, Calendar, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Drawer, DropdownMenu, Form, HoverCard, InputOTP, Menubar, NavigationMenu, Pagination, Progress, RadioGroup, Resizable, ScrollArea, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Table, Toast, Toaster, Toggle, ToggleGroup. Ver `src/components/ui/`.

---

## 5. Iconografia

**Libreria**: `lucide-react` — unica fuente de iconos. No mezclar con otras librerias.

**Sizing por contexto:**

| Contexto | Size | strokeWidth | Ejemplo |
|---|---|---|---|
| Dentro de badge/pill | `12` | default (2) | `<ShieldCheck size={12} />` |
| Inline con texto | `14`-`16` | default (2) | `<MapPin size={12} />`, `<ArrowRight size={18} />` |
| Card icon container | `24` | `2` | `<BarChart3 size={24} strokeWidth={2} />` |
| Estado/feedback grande | `28` via className | default (2) | `<AlertTriangle className="h-7 w-7" />` |
| CTA icon | `18`-`20` | default (2) | `<ArrowRight size={20} />` |
| Navbar hamburger | `24` | default (2) | `<Menu size={24} />` |

**Iconos frecuentes por area:**

| Area | Iconos |
|---|---|
| Dashboard nav | Boxes, ClipboardList, Printer, PackageCheck, Truck, ReceiptText, PackageOpen, MapPinned, ShieldCheck, Star |
| Landing hero | ArrowRight, ChevronDown, Upload, BarChart3, PackageCheck, Eye, CheckCircle2 |
| Trust strip | ShieldCheck, Clock, Lock, Truck, BarChart3, Layers, Users |
| Quote card | MapPin, Truck, ShieldCheck, Star |
| Login | ArrowLeft |
| Navbar | Menu, X |
| FAQ | Plus, Minus |
| Footer | SVGs custom (Instagram, TikTok) |

**Color por contexto:**
- Sobre fondo claro: `className="text-primary"` (azul) o `text-muted-foreground` (gris)
- Sobre fondo oscuro: `className="text-primary"` o `text-hero-muted` o `text-accent`
- En icon container: siempre `text-primary` sobre `bg-primary/[0.12]` o `bg-muted`

---

## 6. Motion y transiciones

### 6.1 AnimateOnScroll

Componente wrapper que anima hijos cuando entran en viewport usando Framer Motion `useInView`.

**Path**: `src/components/AnimateOnScroll.tsx`

**Props:**

| Prop | Default | Descripcion |
|---|---|---|
| `variant` | `"fade-up"` | Tipo de animacion |
| `delay` | `0` | Delay en segundos |
| `duration` | `0.5` | Duracion en segundos |
| `once` | `true` | Animar solo una vez |
| `amount` | `0.15` | Porcentaje de visibilidad para trigger |

**Variantes disponibles:**

| Variant | Hidden state | Visible state |
|---|---|---|
| `fade-up` | `opacity: 0, y: 40` | `opacity: 1, y: 0` |
| `fade-down` | `opacity: 0, y: -40` | `opacity: 1, y: 0` |
| `fade-left` | `opacity: 0, x: -40` | `opacity: 1, x: 0` |
| `fade-right` | `opacity: 0, x: 40` | `opacity: 1, x: 0` |
| `scale` | `opacity: 0, scale: 0.85` | `opacity: 1, scale: 1` |
| `fade` | `opacity: 0` | `opacity: 1` |

**Easing global**: `[0.25, 0.1, 0.25, 1]` — cubic-bezier similar a `ease-out` pero mas suave.

**Uso:**
```tsx
<AnimateOnScroll variant="fade-up" delay={0.1}>
  <h2>Titulo de seccion</h2>
</AnimateOnScroll>
```

### 6.2 StaggerChildren

Contenedor que aplica animacion staggered a hijos usando Framer Motion variant propagation.

**Path**: `src/components/StaggerChildren.tsx`

**Componentes exportados:**
- `StaggerChildren` — container parent
- `StaggerItem` — cada hijo animado

**Props de StaggerChildren:**

| Prop | Default | Descripcion |
|---|---|---|
| `staggerDelay` | `0.1` | Delay entre cada hijo |
| `once` | `true` | Animar solo una vez |
| `className` | `""` | Clases del container |

**Animacion de StaggerItem:** `opacity: 0, y: 30` → `opacity: 1, y: 0` en `0.45s` con easing `[0.25, 0.1, 0.25, 1]`.

**Uso:**
```tsx
<StaggerChildren className="grid grid-cols-4 gap-4" staggerDelay={0.1}>
  {items.map((item) => (
    <StaggerItem key={item.id}>
      <Card>{item.content}</Card>
    </StaggerItem>
  ))}
</StaggerChildren>
```

### 6.3 Tailwind keyframes

Definidos en `tailwind.config.ts`:

| Keyframe | Descripcion | Duracion | Uso |
|---|---|---|---|
| `accordion-down` | height 0 → content height | 0.2s ease-out | Shadcn Accordion open |
| `accordion-up` | content height → 0 | 0.2s ease-out | Shadcn Accordion close |
| `fade-up` | opacity 0 + translateY(20px) → visible | 0.5s ease-out forwards | Animacion CSS pura |

### 6.4 CSS marquee (proveedores)

Definido en `src/index.css` como custom CSS (no Framer Motion):

- `provider-marquee-lane-a`: translateX(0) → translateX(-100%) en 22s linear infinite
- `provider-marquee-lane-b`: translateX(100%) → translateX(0) en 22s linear infinite
- Pausa en hover: `animation-play-state: paused`
- Respeta `prefers-reduced-motion: reduce` → `animation: none`

### 6.5 Convenciones generales

- **Duraciones**: 0.2s (micro-interactions, accordions), 0.25s (FAQ expand), 0.3s (audience switch), 0.45s (stagger items), 0.5s (scroll reveal)
- **Easing Framer**: `[0.25, 0.1, 0.25, 1]` — usado en AnimateOnScroll, StaggerItem, FAQ
- **Easing CSS**: `ease-out` — keyframes Tailwind
- **Transitions CSS**: `transition-all duration-300` (navbar scroll), `transition-colors` (links, buttons), `transition-opacity` (CTA hover), `transition-transform` (chevrons)
- **Hover transforms**: `hover:-translate-y-0.5` en cards de cotizacion (sutil lift)
- **`prefers-reduced-motion`**: solo implementado en marquee CSS. Framer Motion no tiene guard explicito pero `once: true` limita repeticiones.

---

## 7. Estados de interaccion

### 7.1 Hover

| Elemento | Efecto hover |
|---|---|
| Card cotizacion | `-translate-y-0.5` + `shadow-card-hover` |
| Card trust strip | `border-primary/20` + `shadow-md` |
| CTA gradient | `opacity-90` via `hover:opacity-90` |
| Link oscuro | `text-hero-muted` → `text-hero-foreground` |
| Link claro | `text-muted-foreground` → `text-foreground` |
| Button outline | `bg-accent text-accent-foreground` (Shadcn default) |
| Social icon | `bg-hero-muted/10` → `bg-hero-muted/20` + `text-hero-foreground` |
| Nav sidebar | `bg-white/6 text-hero-foreground` (inactivo) |
| Marquee | `animation-play-state: paused` |

### 7.2 Focus

- **Focus ring global**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (definido en buttonVariants de Shadcn)
- **Ring color**: `--ring: 220 70% 45%` (azul primary)
- **Ring offset**: `ring-offset-background` (fondo de pagina)
- **Solo `focus-visible`**: no se muestra con click, solo con keyboard navigation

### 7.3 Active / Pressed

- **NavLink sidebar active**: `bg-white/10 text-hero-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]`
- **NavLink mobile active**: `border-primary/20 bg-primary/10 text-primary`
- **SortButton active**: `border-primary/70 bg-primary/10 text-primary`
- **Icon en nav active**: `text-primary` (resaltado del icono y chevron)

### 7.4 Disabled

- **Button disabled** (Shadcn): `disabled:pointer-events-none disabled:opacity-50`
- **Nav item disabled** (sidebar): `text-hero-muted/80` + pill "Luego" sin link
- **Nav item disabled** (mobile): texto `{label} - Luego` sin link

---

## 8. Estrategia responsive

### 8.1 Principios

- **Mobile-first**: estilos base para mobile, escalados con `sm:`, `md:`, `lg:`, `xl:`.
- **Sidebar collapse**: `< lg` = sidebar oculto (`hidden lg:flex`), topbar con pills scrolleables.
- **Stack → row**: cards y layouts pasan de stack vertical a row horizontal en `md:` o `lg:`.
- **Typography scaling**: tamanios de fuente escalan con breakpoints (ej: `text-3xl md:text-5xl`).
- **Container**: ancho fijo `1280px` en `2xl`, padding `1.5rem` siempre.

### 8.2 Patrones responsive por componente

| Componente | Mobile | Tablet (md) | Desktop (lg+) |
|---|---|---|---|
| Hero | Copy centrado, mini indicators, sin panel | Copy centrado, sin panel | 2 cols: copy left + panel right |
| Trust strip | 1 col | 2 cols | 4 cols |
| Quote cards | Stack vertical | Row horizontal | Row horizontal |
| Dashboard shell | Topbar pills + full width main | Topbar pills + wider main | Sidebar 292px + main |
| Page header | Stack: info + actions | Row: info left, actions right | Row: info left, actions right |
| Footer | Stack 1 col | 2 cols grid | 4 cols grid |
| Navbar | Hamburger + drawer | Full nav horizontal | Full nav horizontal |
| FAQ | Paddings reducidos | Paddings normales | Paddings normales |

### 8.3 Overflow handling

- **Nav mobile dashboard**: `overflow-x-auto` con pills `whitespace-nowrap`
- **Provider marquee mobile**: `overflow-x: auto; overflow-y: hidden` con track `width: max-content`
- **Nombre largo en sidebar**: no hay truncate explicito — confiar en `w-[292px]` y word wrap natural
- **Nombre en quote card**: `truncate` en nombre de proveedor, `min-w-0` en contenedores flex

---

## 9. Accesibilidad

### 9.1 Controles

- **Botones**: todos los toggle y acciones usan `<button type="button">` (no divs clickeables).
- **FAQ**: `aria-expanded={isOpen}` en cada pregunta.
- **Navbar toggle**: `aria-label="Toggle menu"`.
- **Links externos**: `target="_blank" rel="noopener noreferrer"` + `aria-label` descriptivo.
- **Focus visible**: ring azul solo con keyboard (`focus-visible:ring-2`), no con mouse.

### 9.2 Semantica HTML

- Landing: `<section>`, `<nav>`, `<footer>`, `<header>`, `<article>`, `<main>`.
- Dashboard: `<aside>` para sidebar, `<header>` sticky, `<main>` para contenido, `<nav>` para navegacion.
- Headings: jerarquia `h1` → `h2` → `h3` respetada por seccion.

### 9.3 Color y contraste

- Texto principal `foreground` sobre `background`: ratio ~15:1 (excelente).
- Texto `hero-foreground` sobre `hero-bg`: ratio ~13:1 (excelente).
- Texto `muted-foreground` sobre `background`: ratio ~4.7:1 (cumple AA para texto normal).
- Texto `hero-muted` sobre `hero-bg`: ratio ~4.5:1 (limite AA — monitorear).
- Primary sobre white: ratio ~5.2:1 (cumple AA).

### 9.4 Movimiento reducido

- Marquee CSS: `@media (prefers-reduced-motion: reduce) { animation: none }`.
- AnimateOnScroll / StaggerChildren: no tienen guard explicito para `prefers-reduced-motion`. Los elementos se muestran igualmente (opacity final 1, posicion final 0), pero la animacion se reproduce. Mejora pendiente.

---

## 10. Primitivos Shadcn — mapeo (otros disponibles)

Otros primitivos disponibles en `src/components/ui/` que no se usan activamente pero estan instalados:

Alert, AlertDialog, AspectRatio, Breadcrumb, Calendar, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Drawer, DropdownMenu, Form, HoverCard, InputOTP, Menubar, NavigationMenu, Pagination, Progress, RadioGroup, Resizable, ScrollArea, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Table, Toast, Toaster, Toggle, ToggleGroup.

---

## 11. Roadmap (patrones pendientes)

- **Floating ranking explainer** — Widget flotante con panel expandible que explica el algoritmo de ranking (Subproyecto 1).
- **Badge tooltip trigger** — Signo "?" junto a un badge que abre un Popover explicativo (Subproyecto 1).
- **Provider profile hero** — Header de perfil individual publico: logo grande + nombre + badges + stats + ubicacion (Subproyecto 2).
- **Portfolio gallery with modal** — Grid de thumbnails con hover overlay y modal de detalle via Dialog (Subproyecto 2).
- **Reviews carousel** — Carrusel horizontal: avatar + stars + fecha + texto (Subproyecto 2).
- **Provider summary card expandible** — Card de listado publico que se expande inline para ver mas datos (Subproyecto 3).
- **Filters sidebar** — Sidebar de filtros con checkboxes/selects para listado publico de proveedores (Subproyecto 3).
- **Onboarding stepper** — Progress visual multi-step para el flujo de registro extendido (Subproyecto 6).
- **Trayectoria verified isotype** — Icono custom SVG de trayectoria verificada para badges y certificaciones (Subproyecto 4).

---

## 12. Discrepancias detectadas

1. **Color hardcoded fuera de paleta** (`StepQuotes.tsx:298`): el boton "Comprar" en `ProviderCard` usa `bg-[#667eea]` / `hover:bg-[#5b6fd6]`. No corresponde a `--primary` (HSL 220 70% 45% = ~`#2260c9`) ni a `bg-gradient-primary`. Deberia unificarse con `bg-primary` o `bg-gradient-primary` segun el contexto.

2. **Conflicto tipografico en `src/index.css`**: `h2, h4, h5, h6` reciben `@apply font-display` (Space Grotesk), pero inmediatamente despues `h2, h3` reciben `font-family: 'Montserrat'` via CSS directo. La segunda regla gana por especificidad CSS (propiedad directa > directive @apply). El resultado visual es correcto (h2/h3 usan Montserrat), pero la intencion del codigo se lee contradictoria. h4/h5/h6 quedan con Space Grotesk como se desea.

3. **Sintaxis inconsistente en `--shadow-cta`**: `0 4px 20px hsl(220, 70%, 45% / 0.35)` mezcla comas dentro de `hsl()` con barra para alpha — esto no es sintaxis CSS moderna estandar. La sintaxis correcta seria `hsl(220 70% 45% / 0.35)` (sin comas, con barra) o `hsla(220, 70%, 45%, 0.35)` (con comas, sin barra). Los demas shadows usan la forma moderna sin comas. Los browsers modernos aceptan ambas variantes, pero conviene unificar.

4. **Sidebar tokens con hue inconsistente**: los tokens `--sidebar-foreground` (240), `--sidebar-primary` (240), `--sidebar-accent` (240) usan hue `240` (violeta-azul) en lugar de `220` (azul tecnico) del resto de la paleta. `--sidebar-border` (220) y `--sidebar-ring` (217) si usan el hue correcto. No impacta hoy porque el dashboard V2 usa `bg-gradient-dark` directamente en el aside, pero crearia incoherencia visual si se adopta el sistema de sidebar de Shadcn.

5. **`prefers-reduced-motion` parcial**: solo la marquee CSS de proveedores respeta `prefers-reduced-motion: reduce`. Los componentes de Framer Motion (`AnimateOnScroll`, `StaggerChildren`, hero grid animation) no tienen guard explicito. Los elementos llegan a su estado final (son funcionales), pero la animacion se reproduce igualmente.
