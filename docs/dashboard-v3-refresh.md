# Dashboard de proveedores — Refresh v2 → v3

> Documento de handoff para implementar el refresh visual del Provider dashboard
> manteniendo **compatibilidad total con Lovable** y la lógica/endpoints existentes.

## Objetivo

Pasar el panel de proveedores actual (estado en captura `compare-current.png`) al lenguaje visual del **UI kit v2** (`preview/ui-kit-provider-dashboard.html`), aplicando el design system Comparo3D ya consolidado.

**No es un rebuild** — es un *visual refresh*. Endpoints, hooks, estados de carga, navegación, formularios y nombres de archivos NO cambian.

---

## Reglas de compatibilidad con Lovable

1. **No tocar `package.json`** salvo para sumar dependencias mínimas. No cambiar versiones de React, Vite, Tailwind, shadcn.
2. **No cambiar nombres de archivos existentes** ni mover carpetas (`src/features/provider-dashboard/...` queda como está).
3. **No cambiar firmas de props** de componentes existentes — solo agregar opcionales.
4. **Tokens van en `src/index.css`** dentro del bloque `:root` ya existente, NO en archivos nuevos de CSS global.
5. **Componentes nuevos** se crean dentro de `src/features/provider-dashboard/components/` siguiendo el patrón actual (función React + Tailwind + `cn()`).
6. **Sin librerías de charting nuevas** — la sparkline es 7 `<span>` con `height` inline.
7. Mantener cualquier `.bak` / `Backup/` / `.bak1` existente intacto.

---

## Diff visual (qué cambia, archivo por archivo)

### 1. `src/index.css` — agregar tokens y utilidades

Pegar dentro del `:root` (después de los tokens existentes):

```css
/* ── Dashboard v3 refresh ── */
--shadow-card-soft: 0 1px 3px hsl(220 30% 12% / 0.06), 0 4px 12px hsl(220 30% 12% / 0.04);
--shadow-cta:       0 4px 20px hsl(220 70% 45% / 0.35);
--gradient-dark:    linear-gradient(180deg, hsl(220, 30%, 8%), hsl(220, 25%, 14%));
```

(Si ya existen, no duplicar — verificar.)

Y al final del archivo, agregar las utilidades de sparkline + hero-band:

```css
@layer components {
  .dash-hero-band {
    @apply relative overflow-hidden text-white px-7 py-6;
    background: var(--gradient-dark);
  }
  .dash-hero-band::after {
    content: "";
    position: absolute; right: -60px; top: -60px;
    width: 280px; height: 280px;
    background: radial-gradient(circle, hsl(var(--primary)/.4) 0%, transparent 70%);
    pointer-events: none;
  }
  .dash-spark {
    @apply mt-3 flex items-end gap-[3px] h-8;
  }
  .dash-spark > span {
    @apply flex-1 rounded-sm;
    background: hsl(var(--primary) / 0.18);
  }
  .dash-spark > span.peak { background: hsl(var(--primary)); }
  .dash-accent-stripe::before {
    content: "";
    position: absolute; left: 0; top: 0;
    width: 3px; height: 100%;
    background: hsl(var(--primary));
    opacity: 0; transition: opacity .15s;
  }
  .dash-accent-stripe.is-hot::before { opacity: 1; }
  .dash-accent-stripe.is-hot {
    background: linear-gradient(135deg, #fff, hsl(var(--primary)/.04));
  }
}
```

### 2. `DashboardPageHeader.tsx` — convertir a banda oscura + low-band con meta

**Estado actual:** wrapper blanco simple, título + descripción + acciones.

**Estado v3:** dos bandas — `topband` (dark, con gradient + glow primary, eyebrow + h1 blanco + actions) + `lowband` (blanca, con pills de estado + "última sync").

**Props nuevas opcionales** (no rompe llamadas actuales):

```ts
interface DashboardPageHeaderProps {
  eyebrow?: string;        // ej. "PANORAMA OPERATIVO"
  title: string;
  description?: string;
  actions?: ReactNode;
  metaPills?: ReactNode;   // ej. <StatePill>...</StatePill>
  lastSync?: string;       // ej. "hace 3 min"
  variant?: "default" | "dark";  // default = legacy plano | dark = v3
}
```

Cuando `variant === "dark"`, renderizar la estructura de `.page-head` del kit (ver `preview/ui-kit-provider-dashboard.html` líneas del bloque `<header class="page-head">`).

**Migración progresiva:** páginas existentes siguen funcionando con `variant="default"` por defecto. Pasar `variant="dark"` página por página.

### 3. `DashboardMetricCard.tsx` — sumar trend, sparkline, accent stripe

**Estado actual:** label + value + icon.

**Estado v3:** mismo + opcional `trend` (up/down/flat con texto), `sparkline` (array de 7 números 0–100), `isHot` (cambia el accent stripe a visible y el icono a gradient).

**Props nuevas opcionales:**

```ts
interface DashboardMetricCardProps {
  label: string;
  value: string | number;
  valueSuffix?: string;       // ej. "/100" o ".500"
  icon: ReactNode;
  trend?: { direction: "up" | "down" | "flat"; text: string };
  sparkline?: number[];       // 7 valores 0..100
  isHot?: boolean;            // resalta esta métrica
}
```

Estructura interna agrega `<div className={cn("relative overflow-hidden", "dash-accent-stripe", isHot && "is-hot")}>` y al final un `<div className="dash-spark">` mapeando los valores.

### 4. `ProviderDashboardShell.tsx` — top bar oscura

**Estado actual:** top bar blanca con breadcrumbs + acciones.

**Estado v3:** top bar oscura (`bg-[hsl(var(--hero-bg))]`) con breadcrumbs en gris claro, search input traslúcido, icon-buttons translúcidos, avatar con gradient.

Reemplazar los className del header del shell por los del bloque `.top-bar` del kit. La estructura HTML queda igual; solo cambian colores/border/background.

### 5. Componentes nuevos a crear

#### `Sparkline.tsx` (`src/features/provider-dashboard/components/Sparkline.tsx`)

```tsx
interface SparklineProps {
  values: number[];        // 0..100
  highlightLast?: boolean; // marca el último como peak
}
export const Sparkline = ({ values, highlightLast = true }: SparklineProps) => (
  <div className="dash-spark">
    {values.map((v, i) => (
      <span
        key={i}
        style={{ height: `${Math.max(8, Math.min(100, v))}%` }}
        className={highlightLast && i === values.length - 1 ? "peak" : ""}
      />
    ))}
  </div>
);
```

#### `MetricTrend.tsx`

```tsx
interface MetricTrendProps {
  direction: "up" | "down" | "flat";
  children: ReactNode;
}
export const MetricTrend = ({ direction, children }: MetricTrendProps) => {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;
  const color =
    direction === "up" ? "text-[hsl(var(--success))]" :
    direction === "down" ? "text-[hsl(var(--destructive))]" :
    "text-muted-foreground";
  return (
    <div className={cn("mt-2 flex items-center gap-1.5 text-xs font-semibold", color)}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
};
```

#### `DashboardHeroBand.tsx`

Wrapper reusable de la banda oscura con glow para usar en `DashboardPageHeader` y otras vistas (`MercadoPagoStep`, `EmptyState` con CTA).

### 6. Vistas a refrescar (orden recomendado)

1. **`ProviderSummaryView.tsx`** — primera prueba. Aplicar `<DashboardPageHeader variant="dark" eyebrow="PANORAMA OPERATIVO" lastSync={...} metaPills={...} />` y agregar `trend` + `sparkline` a las 4 métricas.
2. **`ProviderQuotesView.tsx`** — refrescar la tabla con la estructura `.qtable` del kit (icon-tile + meta + price tabular-nums + pill de estado).
3. **`ProviderOrdersView.tsx`** (la de la captura) — aplicar `variant="dark"` al header y métricas con sparkline.
4. **`ProviderProfileView.tsx`** — adoptar `data-row` con borde superior + `panel-head` con icon-tile.
5. **`MercadoPagoStep.tsx`** — adoptar el `.mp` (split dark/white con checklist + flow indicator + botón #009ee3).

---

## Lo que NO cambia (importante)

- ✅ Sidebar: ya está alineada al kit v2 — solo verificar gradient y agrupación por sección si difiere
- ✅ Routing y `useAudience()` / context
- ✅ Tipos de datos, hooks, llamadas a API
- ✅ Estados de loading / error / empty (solo cambian estilos visuales en `state-card`)
- ✅ Validaciones de formularios

---

## Referencias

- **Pixel reference:** `export/Comparo3D - Provider Dashboard.html` (standalone)
- **Source HTML del kit:** `preview/ui-kit-provider-dashboard.html`
- **Tokens:** `colors_and_type.css` (espejo de `src/index.css`)
- **Design system completo:** `SKILL.md` + `README.md`

---

## Checklist de QA visual

- [ ] Top bar oscura, breadcrumbs legibles
- [ ] Page header tiene banda dark + low-band con pills + "última sync"
- [ ] 4 métricas con sparkline visible y trend con flecha
- [ ] Una métrica destacada con accent-stripe + gradient icon (`isHot`)
- [ ] Tabla de cotizaciones con icon-tile + precio tabular
- [ ] Pills de estado con los 6 tonos correctos
- [ ] CTA panel oscuro con glow primary y gradient button
- [ ] MercadoPago hero: split dark/white con flow de 4 pasos
- [ ] Sin warnings de Tailwind / TS en build
- [ ] `pnpm dev` o `npm run dev` funciona sin tocar lock

