import { useMemo, useState, type ReactNode } from "react";
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  MapPinned,
  PackageCheck,
  PackageOpen,
  Printer,
  ReceiptText,
  TrendingUp,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import type { DashboardProvider, DashboardUser } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo-white.png";

const navigationItems = [
  { key: "resumen", label: "Resumen", to: "resumen", icon: Boxes, available: true },
  { key: "perfil", label: "Perfil", to: "perfil", icon: ClipboardList, available: true },
  { key: "produccion", label: "Produccion", to: "produccion", icon: Printer, available: true },
  { key: "materiales", label: "Materiales", to: "materiales", icon: PackageCheck, available: true },
  { key: "logistica", label: "Logistica", to: "logistica", icon: Truck, available: true },
  { key: "cotizaciones", label: "Cotizaciones", to: "cotizaciones", icon: ReceiptText, available: true },
  { key: "pedidos", label: "Pedidos", to: "pedidos", icon: PackageOpen, available: true },
  { key: "envios", label: "Envios", to: "envios", icon: MapPinned, available: true },
  { key: "portfolio", label: "Portfolio", to: "portfolio", icon: Star, available: true },
  { key: "certificacion", label: "Certificacion", to: "certificacion", icon: ShieldCheck, available: true },
  { key: "competitividad", label: "Competitividad", to: "competitividad", icon: TrendingUp, available: true },
] as const;

function formatProviderLocation(provider?: DashboardProvider | null) {
  const parts = [provider?.localidad, provider?.provincia].filter(Boolean);
  return parts.join(", ");
}

function mapProviderStatusTone(status?: string | null) {
  switch (status) {
    case "active":
      return "success";
    case "pending_validation":
      return "warning";
    case "paused":
    case "suspended":
    case "blocked":
      return "danger";
    case "onboarding_incomplete":
      return "info";
    default:
      return "muted";
  }
}

function formatProviderStatus(status?: string | null) {
  if (!status) return "Sin estado";
  return status.replaceAll("_", " ");
}

interface ProviderDashboardShellProps {
  user: DashboardUser;
  provider?: DashboardProvider | null;
  children: ReactNode;
  onLogout: () => Promise<void>;
}

export function ProviderDashboardShell({
  user,
  provider,
  children,
  onLogout,
}: ProviderDashboardShellProps) {
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentSection = useMemo(() => {
    const pathname = location.pathname.split("/").filter(Boolean);
    return pathname[pathname.length - 1] ?? "resumen";
  }, [location.pathname]);

  const providerName = provider?.nombre || user.name || "Proveedor COMPARO3D";
  const providerLocation = formatProviderLocation(provider) || "Cobertura en configuracion";
  const sectionLabel =
    navigationItems.find((item) => item.key === currentSection)?.label ?? "Dashboard";
  const routeSuffix = location.search || "";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
      window.location.assign("/proveedores/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='72' height='72' viewBox='0 0 72 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230f172a' stroke-width='0.8'%3E%3Cpath d='M0 36h72M36 0v72'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-[292px] shrink-0 border-r border-white/10 bg-gradient-dark text-hero-foreground lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-7 py-6">
            <Link to="/" className="inline-flex">
              <img src={logoWhite} alt="COMPARO3D" className="h-8" />
            </Link>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/90">
              Panel de proveedores
            </p>
            <div className="mt-3 space-y-2">
              <h2 className="font-[Montserrat] text-2xl font-bold tracking-tight text-hero-foreground">
                {providerName}
              </h2>
              <p className="text-sm leading-relaxed text-hero-muted">
                Continuidad operativa y visibilidad comercial desde una sola base.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <DashboardStatePill
                tone={mapProviderStatusTone(provider?.estado)}
                className="border-white/10 bg-white/10 text-hero-foreground"
              >
                {formatProviderStatus(provider?.estado)}
              </DashboardStatePill>
              <DashboardStatePill
                tone="muted"
                className="border-white/10 bg-white/5 text-hero-muted"
              >
                ID {provider?.id ?? user.provider_id ?? "N/D"}
              </DashboardStatePill>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                if (!item.available || !item.to) {
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-2xl border border-white/8 px-4 py-3 text-sm text-hero-muted/80"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      <DashboardStatePill
                        tone="muted"
                        className="border-white/8 bg-white/5 text-hero-muted"
                      >
                        Luego
                      </DashboardStatePill>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.key}
                    to={`${item.to}${routeSuffix}`}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors",
                        isActive
                          ? "bg-white/10 text-hero-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-hero-muted hover:bg-white/6 hover:text-hero-foreground"
                      )
                    }
                    end
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isActive
                              ? "translate-x-0 text-primary"
                              : "-translate-x-1 opacity-40 group-hover:translate-x-0"
                          )}
                        />
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/90">
                Siguiente fase
              </p>
              <p className="mt-2 text-sm leading-relaxed text-hero-muted">
                El dashboard proveedor ya tiene migradas las vistas operativas y de confianza principales. Queda listo para handoff, QA con datos reales y commit del paquete.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-5 py-4 md:px-6 xl:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Dashboard COMPARO3D
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{providerName}</span>
                    <span className="hidden text-border md:inline">|</span>
                    <span>{sectionLabel}</span>
                    <span className="hidden text-border md:inline">|</span>
                    <span>{providerLocation}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
                  >
                    <Link to="/dashboard/proveedores/resumen">Ir al dashboard</Link>
                  </Button>
                  <Button
                    onClick={() => void handleLogout()}
                    variant="outline"
                    className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navigationItems.map((item) => {
                  if (!item.available || !item.to) {
                    return (
                      <span
                        key={item.key}
                        className="inline-flex whitespace-nowrap rounded-full border border-border/80 bg-white px-3 py-2 text-xs font-medium text-muted-foreground"
                      >
                        {item.label} - Luego
                      </span>
                    );
                  }

                  return (
                    <NavLink
                      key={item.key}
                      to={`${item.to}${routeSuffix}`}
                      end
                      className={({ isActive }) =>
                        cn(
                          "inline-flex whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                          isActive
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border/80 bg-white text-muted-foreground hover:text-foreground"
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1600px] px-5 py-6 md:px-6 md:py-8 xl:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
