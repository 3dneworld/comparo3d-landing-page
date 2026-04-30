import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import logoWhite from "@/assets/logo-white.png";
import networkImg from "@/assets/provider-network.jpg";

const ProveedoresLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authError = searchParams.get("error");

  const errorMessage =
    authError === "auth_unavailable"
      ? "No pudimos iniciar sesion en este momento. Reintenta en unos minutos o escribinos si el problema persiste."
      : null;

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) return;
        const user = await response.json();
        if (!cancelled && user) navigate("/dashboard/proveedores", { replace: true });
      } catch {
        // Keep the user on the login page if the session check fails.
      }
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/login?redirect=dashboard-proveedores";
  };

  return (
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
          <a href="/">
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

      <div className="relative z-10 container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="grid w-full max-w-5xl items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden flex-col items-center lg:flex"
          >
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />
              <img
                src={networkImg}
                alt="Red de proveedores COMPARO3D"
                className="relative w-full rounded-2xl border border-hero-muted/10"
                width={800}
                height={1024}
              />
            </div>

            <div className="mt-8 flex gap-8">
              {[
                { value: "50+", label: "Proveedores activos" },
                { value: "24hs", label: "Tiempo de respuesta" },
                { value: "100%", label: "Operacion trazable" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-xl font-bold text-hero-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-hero-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col items-center lg:items-start"
          >
            <div className="w-full max-w-sm">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                Red de proveedores COMPARO3D
              </p>

              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-hero-foreground sm:text-3xl">
                Acceso al panel de proveedores
              </h1>

              <p className="mt-3 text-sm leading-relaxed text-hero-muted">
                Inicia sesion con tu cuenta autorizada para gestionar cotizaciones,
                pedidos y seguimiento operativo.
              </p>

              {errorMessage ? (
                <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm leading-relaxed text-amber-100">{errorMessage}</p>
                </div>
              ) : null}

              <div className="mt-8 space-y-5 rounded-2xl border border-hero-muted/10 bg-hero-muted/5 p-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-hero-foreground px-5 py-3.5 text-sm font-semibold text-hero transition-opacity hover:opacity-90"
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
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-hero-muted/15" />
                  <span className="text-[11px] uppercase tracking-wider text-hero-muted/50">
                    o
                  </span>
                  <div className="h-px flex-1 bg-hero-muted/15" />
                </div>

                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email corporativo"
                    className="w-full rounded-lg border border-hero-muted/12 bg-hero-muted/8 px-4 py-3 text-sm text-hero-foreground placeholder:text-hero-muted/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <input
                    type="password"
                    placeholder="Contrasena"
                    className="w-full rounded-lg border border-hero-muted/12 bg-hero-muted/8 px-4 py-3 text-sm text-hero-foreground placeholder:text-hero-muted/40 transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full rounded-lg bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
                >
                  Iniciar sesion
                </button>
              </div>

              <p className="mt-5 text-center text-[11px] leading-relaxed text-hero-muted/50 lg:text-left">
                Acceso exclusivo para proveedores validados dentro de la red COMPARO3D.
              </p>

              <p className="mt-3 text-center text-[11px] text-hero-muted/40 lg:text-left">
                Problemas para acceder?{" "}
                <a
                  href="mailto:soporte@comparo3d.com"
                  className="text-primary hover:underline"
                >
                  Contacta al equipo de COMPARO3D
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProveedoresLogin;
