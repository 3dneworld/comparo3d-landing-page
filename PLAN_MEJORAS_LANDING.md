# Plan de Mejoras — comparo3d.com.ar Landing Page

> **Documento de ejecucion para Sonnet**
> Generado: 2026-04-10 por Opus (assessment session) — v3 final
> Repo: `C:\Users\chris\Cotizador3d\comparo3d-landing-page`
> Branch destino: `landing-redesign`
> Compatibilidad: Lovable (React + Tailwind + shadcn/ui + framer-motion)

---

## CONTEXTO DE DISEÑO — REFERENCIA DE MARCAS PREMIUM

Se analizaron Treatstock, Craftcloud, Apple y Shapeways. Patrones clave a aplicar:

1. **NO usar eyebrow + titulo grande.** Las marcas premium usan UN SOLO titulo potente por seccion. El eyebrow text (titulito chico azul arriba del titulo) se siente amateur y agrega ruido visual. Eliminarlo.
2. **Logos de proveedores:** Deben ir en una sola linea horizontal (carousel o flex-wrap centrado), NUNCA apilados verticalmente en mobile. Treatstock usa carousel con auto-scroll.
3. **Iconos en cards de beneficios:** Deben ser GRANDES y protagonistas, no chicos y perdidos al costado. El icono es lo primero que se ve, despues el titulo y despues el texto.
4. **Whitespace generoso:** Mas espacio entre secciones. Dejar respirar el contenido.
5. **Tipografia como protagonista:** Titulos limpios, sin decoracion innecesaria.

---

## REGLAS DE EJECUCION

1. **NO remover console.logs** — Chris los quiere por ahora (punto 1.1 NO aprobado)
2. **NO tocar la logica funcional** del cotizador (QuoteSection, steps, hooks, API)
3. **Todos los cambios deben ser responsive** — mobile-first
4. **Usar solo Tailwind utilities + framer-motion** — no CSS modules, no styled-components
5. **Imagenes de ProjectsGallery:** Chris las va a pasar al final. Dejar el componente preparado para recibirlas pero NO bloquear la ejecucion por esto
6. **Backup antes de modificar:** crear `.bak` de cada archivo antes de editarlo
7. **Commits atomicos** por cada bloque logico

---

## BLOQUE 0 — SETUP Y TRIVIALES

### 0.1 Smooth scroll global
**Archivo:** `src/index.css`
**Accion:** Agregar al bloque `@layer base` existente:

```css
@layer base {
  html {
    scroll-behavior: smooth;
  }
  /* ... resto existente ... */
}
```

### 0.2 Fix font-weight h2/h3
**Archivo:** `src/index.css`
**Accion:** Cambiar las lineas 77-79 de:
```css
h2, h3 {
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 500;
}
```
A:
```css
h2, h3 {
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
}
```

---

## BLOQUE 1 — COMPONENTE AnimateOnScroll (PRIORIDAD ALTA)

### 1.1 Crear componente reutilizable
**Archivo nuevo:** `src/components/AnimateOnScroll.tsx`

```tsx
import { useRef } from "react";
import { motion, useInView, type Variant } from "framer-motion";

type AnimationVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "fade";

const variants: Record<AnimationVariant, { hidden: Variant; visible: Variant }> = {
  "fade-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

interface Props {
  children: React.ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const AnimateOnScroll = ({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
  amount = 0.15,
}: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimateOnScroll;
```

### 1.2 Crear helper para stagger en grids
**Archivo nuevo:** `src/components/StaggerChildren.tsx`

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Props {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

const StaggerChildren = ({
  children,
  className = "",
  staggerDelay = 0.1,
  once = true,
}: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export { StaggerChildren, StaggerItem };
```

---

## BLOQUE 2 — APLICAR ANIMACIONES A CADA SECCION

**Import a agregar** en TODOS los archivos de este bloque:
```tsx
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";
```

### 2.1 TrustStrip.tsx
**Wrappear** el heading block (`<div className="mx-auto mb-8 max-w-3xl text-center...">`) con:
```tsx
<AnimateOnScroll variant="fade-up">
  <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
    ...h2 y paragraph...
  </div>
</AnimateOnScroll>
```

**Wrappear** el grid de cards con StaggerChildren:
```tsx
<StaggerChildren className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
  {items.map((item) => (
    <StaggerItem key={item.label}>
      <article ...> ... </article>
    </StaggerItem>
  ))}
</StaggerChildren>
```

### 2.2 ProvidersSection.tsx
**Wrappear heading** con `<AnimateOnScroll variant="fade-up">`.
**Wrappear la fila de logos** con `<AnimateOnScroll variant="fade-up" delay={0.15}>`.

### 2.3 HowItWorks.tsx
**Wrappear heading** con `<AnimateOnScroll variant="fade-up">`.
**Wrappear grid de steps** con `<StaggerChildren staggerDelay={0.12}>` y cada `<article>` con `<StaggerItem>`.

### 2.4 QuoteSection.tsx
**Solo el heading y los info cards** (NO tocar la logica del form):
- Wrappear el header div (`mx-auto mb-8 max-w-3xl text-center`) con `<AnimateOnScroll variant="fade-up">`.
- Wrappear el grid de 3 info cards con `<StaggerChildren staggerDelay={0.1}>` y cada card con `<StaggerItem>`.

### 2.5 ProjectsGallery.tsx
**Wrappear heading** con `<AnimateOnScroll variant="fade-up">`.
**Wrappear grid** con `<StaggerChildren staggerDelay={0.1}>` y cada `<article>` con `<StaggerItem>`.

### 2.6 MaterialsSection.tsx
**Wrappear heading** con `<AnimateOnScroll variant="fade-up">`.
**Wrappear grid** con `<StaggerChildren staggerDelay={0.1}>` y cada `<article>` con `<StaggerItem>`.

### 2.7 FAQ.tsx
**Wrappear heading** con `<AnimateOnScroll variant="fade-up">`.
**Wrappear lista de FAQs** con `<StaggerChildren staggerDelay={0.08} className="space-y-4">` y cada FAQ item div con `<StaggerItem>`.

### 2.8 FinalCTA.tsx
**Wrappear todo el contenido interno** (`container text-center` div) con `<AnimateOnScroll variant="fade-up">`.

### 2.9 Footer.tsx
**Wrappear** el grid de columnas con `<AnimateOnScroll variant="fade-up" delay={0.1}>`.

---

## BLOQUE 3 — FAQ ANIMACION DE APERTURA/CIERRE

**Archivo:** `src/components/landing/FAQ.tsx`

Agregar import arriba:
```tsx
import { AnimatePresence, motion } from "framer-motion";
```

Reemplazar el render condicional del contenido expandido. De:
```tsx
{isOpen && (
  <div className="px-5 pb-5 md:px-7 md:pb-6">
    <div className="mb-4 h-px bg-border" />
    <p className="text-[15px] leading-[1.75] text-muted-foreground md:text-[16px]">
      {faq.a}
    </p>
  </div>
)}
```

A:
```tsx
<AnimatePresence initial={false}>
  {isOpen && (
    <motion.div
      key="content"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden"
    >
      <div className="px-5 pb-5 md:px-7 md:pb-6">
        <div className="mb-4 h-px bg-border" />
        <p className="text-[15px] leading-[1.75] text-muted-foreground md:text-[16px]">
          {faq.a}
        </p>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## BLOQUE 4 — REDISEÑO TrustStrip (ICONOS GRANDES + SIN EYEBROW)

**Archivo:** `src/components/landing/TrustStrip.tsx`

Este bloque tiene 3 cambios criticos:

### 4.1 ELIMINAR eyebrow text
**NO renderizar `header.eyebrow`.** Siguiendo el patron de Treatstock/Apple, el titulo solo debe ser potente por si mismo. El heading queda asi:

```tsx
<div className="mx-auto mb-10 max-w-3xl text-center md:mb-12">
  <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
    {header.headline}
  </h2>
  <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
    {header.support}
  </p>
</div>
```

(SIN el `<p>` del eyebrow antes del h2)

### 4.2 Iconos GRANDES y protagonistas
Cambiar todo el article de cada card. El layout actual es icono-izquierda + texto-derecha. El nuevo layout es: **icono arriba grande → titulo → descripcion**.

Reemplazar el mapeo de cards completo (`{items.map((item) => (...))}`) con:

```tsx
{items.map((item) => (
  <article
    key={item.label}
    className={[
      "flex flex-col rounded-2xl p-6 md:p-7 transition-all duration-200",
      item.priority
        ? "border border-primary/18 bg-primary/[0.045] shadow-[0_12px_28px_-22px_hsl(var(--primary)/0.28)]"
        : "border border-border bg-background hover:border-primary/10",
    ].join(" ")}
  >
    <div
      className={[
        "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl",
        item.priority ? "bg-primary/14" : "bg-primary/8",
      ].join(" ")}
    >
      <item.icon
        size={28}
        strokeWidth={item.priority ? 2.2 : 2}
        className={item.priority ? "text-primary" : "text-primary/80"}
      />
    </div>

    <h3
      className={[
        "text-[18px] font-semibold leading-[1.2] md:text-[20px]",
        item.priority ? "text-foreground" : "text-foreground/92",
      ].join(" ")}
    >
      {item.label}
    </h3>

    <p className="mt-2.5 text-[14px] leading-[1.7] text-muted-foreground md:text-[15px]">
      {item.desc}
    </p>
  </article>
))}
```

**Cambio clave:** Layout vertical (icono arriba, no al costado). Icono 28px en un box de 56px. Limpio, proporcional, profesional.

### 4.3 Cards responsive
Las cards ya estan en `grid-cols-1 md:grid-cols-2` lo cual esta bien. En mobile cada card ocupa el ancho completo con layout vertical. No necesita cambio adicional.

---

## BLOQUE 5 — ELIMINAR EYEBROW DE TODAS LAS SECCIONES

**CAMBIO DE CRITERIO:** El plan original decia agregar eyebrows a todas las secciones. Ahora es AL REVES: **ELIMINAR los eyebrows** de las secciones que los tienen. Las marcas premium no los usan.

### 5.1 FAQ.tsx
**Eliminar** las lineas del eyebrow (aprox linea 106-108):
```tsx
<p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
  {copy.eyebrow}
</p>
```
**Borrar esas 3 lineas.** Solo queda el h2 y el p de soporte.

### 5.2 Verificar que ninguna otra seccion tenga eyebrow renderizado
Las demas secciones (TrustStrip, HowItWorks, ProjectsGallery, MaterialsSection) tienen eyebrow en sus datos pero NO lo renderizan. **Dejarlo asi** — no agregar render de eyebrow en ninguna.

**Resultado:** Todas las secciones tendran solo titulo + subtitulo. Limpio y premium.

---

## BLOQUE 6 — REDISEÑO ProvidersSection (LOGOS EN LINEA)

**Archivo:** `src/components/landing/ProvidersSection.tsx`

Reescribir el componente completo. El problema actual:
- En mobile los logos quedan apilados verticalmente (1 por fila), lo cual se ve horrible
- En desktop quedan 4+1, con MEGA 3D solo abajo

**Nuevo componente completo:**

```tsx
import AnimateOnScroll from "@/components/AnimateOnScroll";

const providers = [
  { name: "PAL",      logo: "/logos/PAL.png"        },
  { name: "Piscobot", logo: "/logos/Piscobot.png"    },
  { name: "Nost3rD",  logo: "/logos/Nost3rd.jpg"     },
  { name: "Joaco3D",  logo: "/logos/JOACO3D.png"     },
  { name: "MEGA 3D",  logo: "/logos/Mega3D.jpeg"     },
];

const ProvidersSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <AnimateOnScroll variant="fade-up">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              Red de proveedores evaluados
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              Trabajamos con proveedores seleccionados por capacidad técnica, materiales, cumplimiento y calidad.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fade-up" delay={0.15}>
          <div className="flex items-center justify-center gap-6 md:gap-10 overflow-x-auto pb-2 scrollbar-hide">
            {providers.map((p) => (
              <div
                key={p.name}
                className="flex flex-col items-center gap-3 shrink-0"
              >
                <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl border border-border bg-card p-2.5 md:p-3 shadow-sm">
                  <img
                    src={p.logo}
                    alt={`Logo ${p.name}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs md:text-sm font-semibold text-foreground text-center whitespace-nowrap">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default ProvidersSection;
```

**Agregar CSS helper** en `src/index.css` dentro de `@layer utilities`:
```css
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

**Cambios clave:**
- Logos en UNA SOLA fila horizontal (`flex` + `shrink-0`)
- En mobile se hace scroll horizontal si no caben (con scrollbar oculta)
- Logos mas compactos: 64px mobile, 80px desktop
- Nombre debajo de cada logo, sin tarjeta envolvente gigante
- Se ve bien tanto con 5 como con mas proveedores

---

## BLOQUE 7 — UNIFICAR HEADING ProvidersSection

**YA HECHO EN BLOQUE 6** — El componente reescrito ya tiene los headings unificados con el patron del resto de secciones.

---

## BLOQUE 8 — FIX STEP INDICATOR DEL COTIZADOR (ALINEACION)

**Archivo:** `src/components/landing/QuoteSection.tsx`

El step indicator tiene problemas de alineacion: los pasos no estan equidistantes entre si. Los conectores (lineas entre circulos) tienen `mx-1` que no garantiza distribucion uniforme.

### 8.1 Fix del contenedor del step indicator
Cambiar el div wrapper (linea ~530) de:
```tsx
<div className="mb-8 flex items-center justify-between gap-2 md:mb-9">
```
A:
```tsx
<div className="mb-8 flex items-center justify-between md:mb-9">
```
(Quitar el `gap-2` — `justify-between` ya distribuye uniformemente)

### 8.2 Fix de cada step + conector
Cada step item tiene esta estructura:
```tsx
<div key={s.label} className="flex flex-1 items-center">
  <div className="flex flex-1 flex-col items-center">
    ...circulo + label...
  </div>
  {i < stepLabels.length - 1 && (
    <div className={`mx-1 h-[2px] flex-1 ${isDone ? "bg-primary" : "bg-border"}`} />
  )}
</div>
```

El problema es que el conector esta DENTRO del flex-1 del step, lo cual causa distribucion desigual. Cambiar a:

```tsx
<div key={s.label} className="flex flex-1 items-center">
  <div className="flex w-full flex-col items-center">
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all md:h-10 md:w-10 ${
        isActive
          ? "bg-gradient-primary text-primary-foreground shadow-cta"
          : isDone
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      <s.icon size={15} />
    </div>
    <span
      className={`mt-2 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.08em] md:text-[11px] ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <span className="hidden sm:inline">{s.label}</span>
      <span className="sm:hidden">{s.short}</span>
    </span>
  </div>
  {i < stepLabels.length - 1 && (
    <div className={`h-[2px] w-full min-w-[16px] ${isDone ? "bg-primary" : "bg-border"}`} />
  )}
</div>
```

**Cambios clave:**
- Quitar `mx-1` del conector, usar `w-full min-w-[16px]` para que se adapte
- Circulos mas chicos en mobile: `h-8 w-8` → `md:h-10 md:w-10`
- Labels mas chicos en mobile: `text-[10px]` → `md:text-[11px]`
- Iconos mas chicos: `size={15}` para mobile

---

## BLOQUE 9 — RESPONSIVE FIXES

### 9.1 Material property grid
**Archivo:** `src/components/landing/MaterialsSection.tsx`

Cambiar la grid de propiedades (linea 268) de:
```tsx
<div className="mt-5 grid grid-cols-3 gap-2">
```
A:
```tsx
<div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
```

### 9.2 Floating CTA mobile
**Archivo nuevo:** `src/components/FloatingCTA.tsx`

```tsx
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroEnd = 600;
      const cotizarEl = document.getElementById("cotizar");
      const cotizarTop = cotizarEl?.getBoundingClientRect().top ?? Infinity;
      const cotizarBottom = cotizarEl?.getBoundingClientRect().bottom ?? Infinity;

      const pastHero = window.scrollY > heroEnd;
      const cotizarInView = cotizarTop < window.innerHeight && cotizarBottom > 0;

      setVisible(pastHero && !cotizarInView);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 md:hidden">
      <a
        href="#cotizar"
        className="flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
      >
        Cotizar ahora
        <ArrowRight size={16} />
      </a>
    </div>
  );
};

export default FloatingCTA;
```

**Integrar en Index.tsx:** Agregar `<FloatingCTA />` despues de `<Footer />`:
```tsx
import FloatingCTA from "@/components/FloatingCTA";
// dentro de LandingContent, despues de <Footer />:
<FloatingCTA />
```

### 9.3 Hero — version mobile simplificada del process flow
**Archivo:** `src/components/landing/Hero.tsx`

Despues del cierre del `</motion.div>` del copy (linea ~92), agregar ANTES del div `hidden lg:block`:

```tsx
{/* Mobile-only: mini process indicators */}
<div className="mt-10 flex justify-center gap-6 sm:gap-8 lg:hidden">
  {[
    { icon: Upload, label: "Subís tu STL" },
    { icon: BarChart3, label: "Comparás opciones" },
    { icon: PackageCheck, label: "Recibís tu pieza" },
  ].map((step, i) => (
    <div key={step.label} className="flex flex-col items-center gap-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-hero-muted/10 border border-hero-muted/15">
        <step.icon size={20} className="text-primary" />
      </div>
      <span className="text-[11px] text-hero-muted text-center leading-tight max-w-[90px]">
        {step.label}
      </span>
    </div>
  ))}
</div>
```

---

## BLOQUE 10 — NAVBAR SCROLL EFFECT

**Archivo:** `src/components/landing/Navbar.tsx`

Cambiar el import de useState:
```tsx
import { useState, useEffect } from "react";
```

Dentro del componente, despues de `const [mobileOpen, setMobileOpen] = useState(false);` agregar:
```tsx
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => setScrolled(window.scrollY > 50);
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

Cambiar la clase del `<nav>` de:
```tsx
className="fixed top-0 left-0 right-0 z-50 bg-hero/95 backdrop-blur-md border-b border-hero-muted/10"
```
A:
```tsx
className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  scrolled
    ? "bg-hero/95 backdrop-blur-md border-b border-hero-muted/10 shadow-lg"
    : "bg-transparent border-b border-transparent"
}`}
```

---

## BLOQUE 11 — FOOTER COMPLETO

**Archivo:** `src/components/landing/Footer.tsx`

Reemplazar la seccion "Contacto" (la 4ta columna del grid). Buscar:
```tsx
<div>
  <h4 className="font-display font-semibold text-hero-foreground text-sm mb-3">Contacto</h4>
  <ul className="space-y-2">
    <li className="text-sm text-hero-muted">Buenos Aires, Argentina</li>
  </ul>
</div>
```

Reemplazar con:
```tsx
<div>
  <h4 className="font-display font-semibold text-hero-foreground text-sm mb-3">Contacto</h4>
  <ul className="space-y-2">
    <li className="text-sm text-hero-muted">Buenos Aires, Argentina</li>
    <li>
      <a href="mailto:info@comparo3d.com.ar" className="text-sm text-hero-muted hover:text-hero-foreground transition-colors">
        info@comparo3d.com.ar
      </a>
    </li>
  </ul>
  <div className="mt-4 flex items-center gap-3">
    <a
      href="https://www.instagram.com/comparo3d"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-muted/10 text-hero-muted transition-colors hover:bg-hero-muted/20 hover:text-hero-foreground"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
    </a>
    <a
      href="https://www.tiktok.com/@comparo3d"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="TikTok"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-hero-muted/10 text-hero-muted transition-colors hover:bg-hero-muted/20 hover:text-hero-foreground"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/></svg>
    </a>
  </div>
</div>
```

---

## BLOQUE 12 — UNIFICAR PADDING ENTRE SECCIONES

**Normal:** `py-16 md:py-24`
**Hero/CTA:** mantener como esta

| Archivo | Actual | Nuevo |
|---------|--------|-------|
| TrustStrip.tsx | `py-12 md:py-16` | `py-16 md:py-24` |
| ProvidersSection.tsx | ya correcto en bloque 6 | `py-16 md:py-24` |
| HowItWorks.tsx | `py-14 md:py-18` | `py-16 md:py-24` |
| QuoteSection.tsx | `py-14 md:py-18` | `py-16 md:py-24` |
| ProjectsGallery.tsx | `py-14 md:py-18` | `py-16 md:py-24` |
| MaterialsSection.tsx | `py-14 md:py-18` | `py-16 md:py-24` |
| FAQ.tsx | `py-12 md:py-16` | `py-16 md:py-24` |

**Solo cambiar** el valor en la clase del `<section>` de cada archivo.

---

## BLOQUE 13 — UNIFICAR IMAGENES DE MATERIALES

**Archivo:** `src/components/landing/MaterialsSection.tsx`

Buscar (linea ~242-248):
```tsx
{material.image && (
  <img
    src={material.image}
    alt={material.name}
    className={`w-auto shrink-0 object-contain drop-shadow-md ${material.name === "ABS" ? "h-[130px] -mt-[15px]" : material.name === "Nylon" ? "h-[140px] -mt-[20px]" : "h-[100px]"}`}
  />
)}
```

Reemplazar con:
```tsx
{material.image && (
  <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center">
    <img
      src={material.image}
      alt={material.name}
      className="max-h-full max-w-full object-contain drop-shadow-md"
    />
  </div>
)}
```

---

## BLOQUE 14 — HERO BACKGROUND PARALLAX SUTIL

**Archivo:** `src/components/landing/Hero.tsx`

Buscar el div del grid pattern (linea ~33-37):
```tsx
<div
  className="absolute inset-0 opacity-[0.03]"
  style={{
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")"
  }} />
```

Reemplazar con (cambiar `<div` por `<motion.div`):
```tsx
<motion.div
  className="absolute inset-0 opacity-[0.03]"
  style={{
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")"
  }}
  animate={{
    backgroundPosition: ["0px 0px", "40px 40px"],
  }}
  transition={{
    duration: 20,
    repeat: Infinity,
    ease: "linear",
  }}
/>
```

**Nota:** `motion` ya esta importado en Hero.tsx.

---

## BLOQUE 15 — BACK TO TOP BUTTON

**Archivo nuevo:** `src/components/BackToTop.tsx`

```tsx
import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 1200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-card-hover md:bottom-8 md:right-8"
      aria-label="Volver arriba"
    >
      <ChevronUp size={20} />
    </button>
  );
};

export default BackToTop;
```

**Integrar en Index.tsx:**
```tsx
import BackToTop from "@/components/BackToTop";
// dentro de LandingContent, despues de <Footer />:
<BackToTop />
```

---

## BLOQUE 16 — ALTERNANCIA DE BACKGROUND ENTRE SECCIONES (CRITICO)

**Problema:** Varias secciones consecutivas tienen el mismo color de fondo, lo que las hace verse como un solo bloque sin separacion visual. Esto se ve amateur.

**Estado actual de backgrounds (en orden):**
| # | Seccion | Background actual | Problema |
|---|---------|------------------|----------|
| 1 | Hero | `bg-gradient-dark` | OK (oscuro) |
| 2 | TrustStrip | `bg-card` | |
| 3 | ProvidersSection | `bg-background` | ← mismos tonos claros 3 seguidos |
| 4 | HowItWorks | `bg-background` | ← sin contraste |
| 5 | QuoteSection | `bg-muted/50` | OK (gris) |
| 6 | CompaniesSection* | `bg-[#0B1730]` | OK (oscuro, solo empresa) |
| 7 | ProjectsGallery | `bg-background` | |
| 8 | MaterialsSection | `bg-muted/50` | OK |
| 9 | FAQ | `bg-background` | |
| 10 | FinalCTA | `bg-gradient-dark` | OK (oscuro) |
| 11 | Footer | `bg-hero` | OK (oscuro) |

**Nuevo esquema de backgrounds (alternando claro/gris):**
| # | Seccion | Background NUEVO |
|---|---------|-----------------|
| 1 | Hero | `bg-gradient-dark` (sin cambio) |
| 2 | TrustStrip | `bg-background` |
| 3 | ProvidersSection | `bg-muted/50` |
| 4 | HowItWorks | `bg-background` |
| 5 | QuoteSection | `bg-muted/50` (sin cambio) |
| 6 | CompaniesSection* | `bg-[#0B1730]` (sin cambio) |
| 7 | ProjectsGallery | `bg-background` (sin cambio) |
| 8 | MaterialsSection | `bg-muted/50` (sin cambio, ya OK) |
| 9 | FAQ | `bg-background` (sin cambio, ya OK) |
| 10 | FinalCTA | `bg-gradient-dark` (sin cambio) |

**Cambios concretos:**

### 16.1 TrustStrip.tsx
Cambiar la seccion root de:
```tsx
<section className="border-y border-border bg-card py-16 md:py-24">
```
A:
```tsx
<section className="bg-background py-16 md:py-24">
```
(Quitar `border-y border-border bg-card`, poner `bg-background`. Quitar los bordes superior/inferior que agregan ruido.)

### 16.2 ProvidersSection.tsx
Cambiar (ya reescrito en Bloque 6) el background de:
```tsx
<section className="py-16 md:py-24 bg-background">
```
A:
```tsx
<section className="py-16 md:py-24 bg-muted/50">
```

### 16.3 HowItWorks.tsx
Cambiar:
```tsx
<section id="como-funciona" className="bg-background py-16 md:py-24">
```
A:
```tsx
<section id="como-funciona" className="bg-background py-16 md:py-24">
```
(Ya esta en `bg-background`, que es correcto despues de `bg-muted/50` de Providers. **No cambiar.**)

**Resultado:** Cada seccion alterna entre fondo blanco y fondo gris suave, creando separacion visual clara.

---

## BLOQUE 17 — ELIMINAR EYEBROW DE HowItWorks Y VERIFICAR TODAS

**Problema:** El plan v2 decia que HowItWorks NO renderizaba eyebrow. **ERROR: SI lo renderiza.** La linea existe y muestra "PROCESO SIMPLE" / "FLUJO OPERATIVO".

### 17.1 HowItWorks.tsx — Eliminar eyebrow
Buscar y BORRAR estas lineas (aprox linea 92-94):
```tsx
<p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
  {copy.eyebrow}
</p>
```

### 17.2 ProjectsGallery.tsx — Eliminar eyebrow
Buscar y BORRAR estas lineas:
```tsx
<p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
  {copy.eyebrow}
</p>
```

### 17.3 MaterialsSection.tsx — Eliminar eyebrow
Buscar y BORRAR estas lineas:
```tsx
<p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-primary md:text-[13px]">
  {copy.eyebrow}
</p>
```

### 17.4 Verificacion final
Despues de eliminar, hacer una busqueda global de `{copy.eyebrow}` y `{header.eyebrow}` en todos los archivos de `src/components/landing/`. Confirmar que NINGUNA seccion renderiza eyebrow. Los datos `eyebrow` pueden quedar en los objetos de datos (no molestan), pero el render del `{copy.eyebrow}` no debe existir en NINGUN componente.

**Lista completa de secciones y estado esperado de eyebrow:**
- TrustStrip (linea 92): ✅ eliminado en Bloque 4
- ProvidersSection: ✅ nunca tuvo
- HowItWorks (linea 93): ❌ **ELIMINAR** (17.1)
- QuoteSection: ✅ no tiene eyebrow
- ProjectsGallery (linea 206): ❌ **ELIMINAR** (17.2)
- MaterialsSection (linea 213): ❌ **ELIMINAR** (17.3)
- FAQ (linea 111): ✅ eliminado en Bloque 5
- FinalCTA: ✅ nunca tuvo
- CompaniesSection: ✅ NO tiene eyebrow (verificado)

---

## BLOQUE 18 — LIMPIEZA ProjectsGallery (QUITAR PIEZAS + UNIFICAR BADGES)

**Archivo:** `src/components/landing/ProjectsGallery.tsx`

### 18.1 Eliminar conteo de piezas
**Problema:** Las cards muestran "1 a 2 piezas", "1 a 6 piezas", "1 a 3 versiones", etc. Chris quiere que se saque TODO eso.

Buscar el bloque que renderiza material + piezas (aprox linea 288-292):
```tsx
<div className="mt-5 flex items-center gap-3 text-[12px] text-muted-foreground md:text-[13px]">
  <span>{project.material}</span>
  <span className="h-1 w-1 rounded-full bg-border" />
  <span>{project.piecesLabel}</span>
</div>
```

Reemplazar con (solo material, sin piezas):
```tsx
<div className="mt-5 flex items-center text-[12px] text-muted-foreground md:text-[13px]">
  <span>{project.material}</span>
</div>
```

### 18.2 Unificar colores de category badges
**Problema:** Los badges de categoria (Repuestos, Hogar, Makers, etc.) alternan entre naranja y azul sin ningun criterio logico. Algunos usan `bg-primary/10 text-primary` (azul) y otros `bg-accent/10 text-accent` (naranja).

**Solucion:** Usar un SOLO color para todos los category badges: `bg-primary/10 text-primary` (azul).

En los datos de `projectCards`, cambiar TODOS los `categoryTone` a un unico valor:

**Para `particular`:**
```tsx
{ category: "Repuestos",      categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Hogar",          categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Makers",         categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Hobby",          categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Personalizados", categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Prototipos",     categoryTone: "bg-primary/10 text-primary", ... },
```

**Para `empresa`:**
```tsx
{ category: "Ingeniería",     categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Mantenimiento",  categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Desarrollo",     categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Operaciones",    categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Producción",     categoryTone: "bg-primary/10 text-primary", ... },
{ category: "Comercial",      categoryTone: "bg-primary/10 text-primary", ... },
```

**Alternativa:** Si se quiere mantener dos colores con LOGICA, usar azul para categorias tecnicas/funcionales y naranja para categorias creativas/comerciales. Pero lo mas limpio es un solo color.

### 18.3 Unificar visualLabel badges tambien
El badge de `visualLabel` (arriba a la izquierda en el header de cada card, e.g. "Caso frecuente", "Uso practico") tiene estilos condicionales basados en `emphasis`:
```tsx
project.emphasis
  ? "bg-primary/10 text-primary"
  : "border border-border bg-background/85 text-muted-foreground"
```

Dejar esto como esta — la logica de `emphasis` si tiene sentido (destaca las cards mas relevantes).

---

## BLOQUE 19 — FIX MaterialsSection DESKTOP ALIGNMENT + ABS IMAGE

**Archivo:** `src/components/landing/MaterialsSection.tsx`

### 19.1 Fix alineacion desktop del header de cada card
**Problema:** En desktop, el header de cada material card (nombre + imagen) esta desalineado. El texto y la imagen no estan bien distribuidos.

El header actual (linea ~241-259):
```tsx
<div className="absolute inset-x-6 top-5 flex items-center justify-between gap-4">
   <div>
     <span className="inline-flex items-center rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
       {material.bestFor}
     </span>
     <h3 className="mt-4 text-[30px] font-bold tracking-tight text-foreground md:text-[32px]">
       {material.name}
     </h3>
   </div>
   {material.image && (
     <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center">
       <img
         src={material.image}
         alt={material.name}
         className="max-h-full max-w-full object-contain drop-shadow-md"
       />
     </div>
   )}
</div>
```

Reemplazar con estructura mejorada:
```tsx
<div className="absolute inset-x-6 top-5 flex items-start justify-between gap-3">
  <div className="flex-1 min-w-0">
    <span className="inline-flex items-center rounded-full border border-border bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {material.bestFor}
    </span>
    <h3 className="mt-3 text-[28px] font-bold tracking-tight text-foreground md:text-[32px]">
      {material.name}
    </h3>
  </div>
  {material.image && (
    <div className={`shrink-0 flex items-center justify-center ${
      material.name === "ABS"
        ? "h-[130px] w-[130px] -mr-1"
        : "h-[100px] w-[100px]"
    }`}>
      <img
        src={material.image}
        alt={material.name}
        className="max-h-full max-w-full object-contain drop-shadow-md"
      />
    </div>
  )}
</div>
```

**Cambios clave:**
- `items-center` → `items-start` para alinear arriba
- Texto con `flex-1 min-w-0` para que tome el espacio disponible sin overflow
- `mt-4` → `mt-3` en el h3 para menos separacion
- ABS image: **130x130px** (mas grande que las demas) con `-mr-1` para arrimar a la izquierda relativa
- Resto de imagenes: **100x100px** (uniformes)

### 19.2 Fix property grid alignment desktop
**Problema:** La grid de propiedades (Terminacion/Flexibilidad/Resistencia) tiene clases responsive contradictorias que rompen el layout en desktop.

Buscar (linea 286):
```tsx
className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5 sm:flex-col sm:items-start sm:gap-1.5 sm:px-2.5 sm:py-2.5 md:flex-row md:items-center md:gap-3 md:px-3 md:py-3"
```

Reemplazar con clase simplificada:
```tsx
className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5"
```

**Razon:** Las clases `sm:flex-col sm:items-start` y luego `md:flex-row md:items-center` causan un layout que cambia de horizontal → vertical → horizontal, generando desalineacion visible. Mantener siempre horizontal (icono izq + texto der) es mas limpio y consistente en todos los breakpoints.

### 19.3 Altura consistente del header gradient
El div del header tiene `h-32` fijo (linea 232):
```tsx
<div className={`relative h-32 border-b border-border bg-gradient-to-br ${material.gradientClass}`}>
```

Cambiar a altura que acomode la imagen de ABS mas grande:
```tsx
<div className={`relative h-36 border-b border-border bg-gradient-to-br ${material.gradientClass}`}>
```
(De `h-32` = 128px a `h-36` = 144px para dar espacio a la imagen ABS de 130px)

### 19.4 Conflicto con Bloque 13
**IMPORTANTE:** El Bloque 13 (unificar imagenes materiales) ya fue cubierto por este Bloque 19. La imagen container del Bloque 13 usaba `h-[110px] w-[110px]` uniforme, pero ahora el Bloque 19.1 le da tamaño condicional (130px para ABS, 100px para el resto). **AL EJECUTAR: Saltar Bloque 13, ya esta resuelto aqui.**

---

## BLOQUE 20 — FIX ALINEACION STEP CHECKOUT (ENVIO)

**Archivo:** `src/components/landing/quote/StepCheckout.tsx`

### 20.1 Fix grid principal
El layout actual usa:
```tsx
className="grid gap-6 md:grid-cols-[1fr_288px]"
```

El order summary sidebar de 288px es muy estrecho. Cambiar a:
```tsx
className="grid gap-6 lg:grid-cols-[1fr_320px]"
```

**Cambios:**
- `md:` → `lg:` para que las 2 columnas se activen en pantallas mas anchas (evita aplastamiento en tablets)
- `288px` → `320px` para un sidebar un poco mas generoso

### 20.2 Fix postal code input width
El input de codigo postal tiene un ancho hardcodeado que no se alinea con los demas campos:
```tsx
className="flex max-w-[220px] overflow-hidden rounded-xl border..."
```

Quitar el `max-w-[220px]` para que respete el grid:
```tsx
className="flex overflow-hidden rounded-xl border..."
```

### 20.3 Fix order summary responsive
El order summary card (linea ~931):
```tsx
className="rounded-2xl border border-border bg-muted/35 p-5"
```

Agregar sticky para que siga al usuario en desktop:
```tsx
className="rounded-2xl border border-border bg-muted/35 p-5 lg:sticky lg:top-24"
```

**NOTA:** Solo cambios de layout/alignment. NO tocar logica funcional del checkout.

---

## ORDEN DE EJECUCION

1. **Bloque 0** — Triviales (smooth scroll, font-weight)
2. **Bloque 1** — Crear componentes AnimateOnScroll + StaggerChildren
3. **Bloque 2** — Aplicar animaciones a todas las secciones
4. **Bloque 3** — FAQ animacion apertura/cierre
5. **Bloque 4** — Rediseño TrustStrip (iconos grandes + sin eyebrow)
6. **Bloque 5** — Eliminar eyebrow de FAQ
7. **Bloque 16** — **NUEVO:** Alternancia backgrounds entre secciones
8. **Bloque 6** — Rediseño ProvidersSection (logos en linea, ya con bg-muted/50)
9. **Bloque 17** — **NUEVO:** Eliminar eyebrow de HowItWorks, ProjectsGallery, MaterialsSection, CompaniesSection
10. **Bloque 8** — Fix step indicator alineacion
11. **Bloque 18** — **NUEVO:** Limpiar ProjectsGallery (quitar piezas, unificar badges)
12. **Bloque 19** — **NUEVO:** Fix MaterialsSection desktop alignment + ABS image
13. **Bloque 20** — **NUEVO:** Fix alineacion checkout/envio
14. **Bloque 9** — Responsive fixes (material grid, floating CTA, hero mobile)
15. **Bloque 10** — Navbar scroll effect
16. **Bloque 11** — Footer completo
17. **Bloque 12** — Unificar padding
18. **Bloque 13** — ~~Unificar imagenes materiales~~ **SALTAR — ya cubierto por Bloque 19**
19. **Bloque 14** — Hero parallax
20. **Bloque 15** — Back to top

**Commits sugeridos:**
- `feat: add scroll animations system (AnimateOnScroll + StaggerChildren)`
- `feat: apply scroll animations to all landing sections`
- `fix: FAQ animated open/close with framer-motion`
- `refactor: redesign TrustStrip with large icons, remove eyebrow pattern`
- `style: alternate section backgrounds for visual separation`
- `refactor: redesign ProvidersSection with horizontal logo row`
- `refactor: remove all eyebrow text from sections (premium pattern)`
- `fix: step indicator alignment and mobile sizing`
- `refactor: clean up ProjectsGallery (remove piece counts, unify badge colors)`
- `fix: MaterialsSection desktop alignment and ABS image sizing`
- `fix: StepCheckout layout alignment and responsive grid`
- `feat: responsive improvements (mobile CTA, hero flow, material grid)`
- `feat: navbar scroll effect, footer social links, back-to-top`
- `style: unify section padding and material image sizing`

---

## IMAGENES PENDIENTES (Chris las pasa al final)

**ProjectsGallery.tsx** — Tarjetas que faltan imagenes:
- "Accesorios utiles para casa y organizacion" (Hogar)
- "Carcasas y piezas para proyectos makers" (Makers)
- "Objetos personalizados y regalos" (Personalizados)
- "Primeras versiones para validar una idea" (Prototipos)

**Cuando Chris pase las imagenes:**
1. Guardarlas en `src/assets/projects/` con nombres descriptivos
2. Importarlas en `ProjectsGallery.tsx` como los existentes
3. Agregar `image: nombreImg` al objeto correspondiente en `projectCards.particular`

---

## RECORDATORIO FINAL

- **NO remover console.logs** (1.1 NO aprobado)
- **NO tocar logica funcional** del cotizador ni del checkout (solo layout/alignment)
- **NO agregar eyebrow text** — eliminarlo donde existe (patron premium)
- **Secciones deben alternar background** entre `bg-background` y `bg-muted/50`
- **Todos los eyebrows deben estar eliminados** — verificar con grep despues
- **ProjectsGallery:** quitar `piecesLabel`, unificar `categoryTone` a `bg-primary/10 text-primary`
- **MaterialsSection:** ABS mas grande (130px), resto 100px, property grid siempre horizontal
- **StepCheckout:** solo layout (grid breakpoint, postal code width, sticky sidebar)
- **Bloque 13 SALTAR** — ya cubierto por Bloque 19
- **Imagenes de ProjectsGallery** las pasa Chris al final
- **Footer:** info@comparo3d.com.ar / Instagram: comparo3d / TikTok: comparo3d
- **Todo debe seguir funcionando con Lovable** (React + Tailwind + framer-motion)
