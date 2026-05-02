import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  Network,
  Sparkles,
} from "lucide-react";

import logoWhite from "@/assets/logo-white.png";
import farmBg from "@/assets/farm-opacity.jpg";

const valueSignals = [
  {
    icon: ClipboardCheck,
    title: "Evaluación operativa y comercial",
    desc: "Revisamos capacidad real, calidad y consistencia comercial antes del alta.",
  },
  {
    icon: Sparkles,
    title: "Proceso de alta estructurado",
    desc: "Pasos claros, criterio definido y acompañamiento durante el onboarding.",
  },
  {
    icon: Network,
    title: "Integración a una red profesional",
    desc: "Sumate a una red curada de talleres y granjas con estándar verificado.",
  },
];

const ProveedoresOnboardingLogin = () => {
  const handleGoogleLogin = () => {
    // Reuses the same auth backend as /proveedores/login but redirects to onboarding.
    window.location.href = "/api/auth/login?redirect=onboarding-proveedores";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-dark">
      {/* Background photo — print farm, anchored right, fades into dark gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        {/* The image itself — spans the full page width on lg+, anchored to the right of the photo */}
        <div
          className="absolute inset-0 hidden bg-cover bg-no-repeat opacity-90 lg:block"
          style={{
            backgroundImage: `url(${farmBg})`,
            backgroundPosition: "right center",
          }}
        />
        {/* Mobile / tablet: a softer, centered version so it never competes with text */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 lg:hidden"
          style={{ backgroundImage: `url(${farmBg})` }}
        />
        {/* Left-to-right fade into the base gradient so text stays readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--hero)) 0%, hsl(var(--hero) / 0.96) 32%, hsl(var(--hero) / 0.78) 52%, hsl(var(--hero) / 0.45) 72%, hsl(var(--hero) / 0.25) 100%)",
          }}
        />
        {/* Slight top/bottom vignette to anchor header & footer edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--hero) / 0.55) 0%, transparent 18%, transparent 82%, hsl(var(--hero) / 0.6) 100%)",
          }}
        />
      </div>

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-[28%] h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(220 70% 45% / 0.35) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-hero-muted/10">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src={logoWhite} alt="COMPARO3D" className="h-8" />
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-hero-muted transition-colors hover:text-hero-foreground"
          >
            <ArrowLeft size={14} />
            Volver al sitio principal
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 container flex min-h-[calc(100vh-4rem)] items-center py-12 md:py-16">
        <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* LEFT — message + visual */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]">
              Red de proveedores COMPARO3D
            </p>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-4xl lg:text-[44px]">
              Ingresá al onboarding de proveedores
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] md:text-lg">
              Sumate a una red profesional de fabricación 3D con un proceso de
              alta claro, validación operativa y criterio comercial.
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
              Pensado para talleres y granjas de impresión que quieren trabajar
              con una plataforma seria, ordenada y enfocada en calidad,
              cumplimiento y capacidad real de respuesta.
            </p>

            {/* Value signals */}
            <ul className="mt-8 space-y-3">
              {valueSignals.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-hero/55 p-4 backdrop-blur-sm transition-colors hover:border-white/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <item.icon size={18} strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT — access card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="lg:self-center"
          >
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[1.75rem] bg-primary/8 blur-2xl"
              />
              <div className="relative rounded-2xl border border-white/12 bg-hero/65 p-7 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.7)] backdrop-blur-md">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={16} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Acceso autorizado
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-bold tracking-tight text-white">
                  Acceso al onboarding
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  Iniciá sesión con tu cuenta autorizada para comenzar o
                  continuar tu proceso de alta.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-hero-foreground px-5 py-3.5 text-sm font-semibold text-hero transition-opacity hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar con Google
                  <ArrowRight size={16} className="ml-1 opacity-70" />
                </button>

                <p className="mt-4 text-[11px] leading-relaxed text-slate-300/80">
                  Acceso exclusivo para proveedores que están iniciando su
                  evaluación dentro de COMPARO3D.
                </p>

                <div className="my-6 h-px bg-white/10" />

                <div className="space-y-2.5 text-[12px]">
                  <a
                    href="/proveedores/login"
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-hero/55 px-3.5 py-2.5 text-slate-200 backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-white"
                  >
                    <span>¿Ya sos proveedor activo? Ir al panel</span>
                    <ArrowRight size={13} className="opacity-60" />
                  </a>
                  <a
                    href="mailto:soporte@comparo3d.com"
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-hero/55 px-3.5 py-2.5 text-slate-200 backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-white"
                  >
                    <span>¿Necesitás ayuda? Contactá al equipo</span>
                    <ArrowRight size={13} className="opacity-60" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProveedoresOnboardingLogin;