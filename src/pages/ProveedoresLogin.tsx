import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoWhite from "@/assets/logo-white.png";
import networkImg from "@/assets/provider-network.jpg";

const ProveedoresLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (!response.ok) return;
        const user = await response.json();
        if (!cancelled && user) navigate("/proveedores", { replace: true });
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
    window.location.href = "/api/auth/login?redirect=proveedores";
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Top nav */}
      <header className="relative z-10 border-b border-hero-muted/10">
        <div className="container flex items-center justify-between h-16">
          <a href="/">
            <img src={logoWhite} alt="COMPARO3D" className="h-8" />
          </a>
          <a
            href="/"
            className="text-hero-muted hover:text-hero-foreground transition-colors text-sm flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Volver al sitio principal
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full max-w-5xl py-12">
          {/* Left — visual side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex flex-col items-center"
          >
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl" />
              <img
                src={networkImg}
                alt="Red de proveedores COMPARO3D"
                className="relative rounded-2xl border border-hero-muted/10 w-full"
                width={800}
                height={1024}
              />
            </div>

            {/* Stats strip */}
            <div className="mt-8 flex gap-8">
              {[
                { value: "50+", label: "Proveedores activos" },
                { value: "24hs", label: "Tiempo de respuesta" },
                { value: "100%", label: "Operación trazable" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold text-hero-foreground font-display">
                    {s.value}
                  </p>
                  <p className="text-[11px] text-hero-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — login card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col items-center lg:items-start"
          >
            <div className="w-full max-w-sm">
              {/* Eyebrow */}
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary mb-4">
                Red de proveedores COMPARO3D
              </p>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-hero-foreground leading-tight tracking-tight">
                Acceso al panel de proveedores
              </h1>

              <p className="mt-3 text-sm text-hero-muted leading-relaxed">
                Iniciá sesión con tu cuenta autorizada para gestionar
                cotizaciones, pedidos y seguimiento operativo.
              </p>

              {/* Login card */}
              <div className="mt-8 bg-hero-muted/5 border border-hero-muted/10 rounded-2xl p-6 space-y-5">
                {/* Google button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-hero-foreground text-hero rounded-lg px-5 py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
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
                  <div className="flex-1 h-px bg-hero-muted/15" />
                  <span className="text-[11px] text-hero-muted/50 uppercase tracking-wider">
                    o
                  </span>
                  <div className="flex-1 h-px bg-hero-muted/15" />
                </div>

                {/* Email / password fields (visual, ready to integrate) */}
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email corporativo"
                    className="w-full bg-hero-muted/8 border border-hero-muted/12 rounded-lg px-4 py-3 text-sm text-hero-foreground placeholder:text-hero-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full bg-hero-muted/8 border border-hero-muted/12 rounded-lg px-4 py-3 text-sm text-hero-foreground placeholder:text-hero-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-gradient-primary text-primary-foreground rounded-lg px-5 py-3.5 font-semibold text-sm hover:opacity-90 transition-opacity shadow-cta"
                >
                  Iniciar sesión
                </button>
              </div>

              {/* Microcopy */}
              <p className="mt-5 text-[11px] text-hero-muted/50 leading-relaxed text-center lg:text-left">
                Acceso exclusivo para proveedores validados dentro de la red
                COMPARO3D.
              </p>

              {/* Support link */}
              <p className="mt-3 text-[11px] text-hero-muted/40 text-center lg:text-left">
                ¿Problemas para acceder?{" "}
                <a
                  href="mailto:soporte@comparo3d.com"
                  className="text-primary hover:underline"
                >
                  Contactá al equipo de COMPARO3D
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
