import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  HelpCircle,
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
import { fetchProviderSummary } from "@/features/provider-dashboard/api";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type { DashboardProvider, DashboardUser } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo-white.png";

type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: typeof Boxes;
  available: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const navigationGroups: NavGroup[] = [
  {
    id: "operacion",
    label: "Operacion",
    items: [
      { key: "resumen", label: "Resumen", to: "resumen", icon: Boxes, available: true },
      { key: "cotizaciones", label: "Cotizaciones", to: "cotizaciones", icon: ReceiptText, available: true },
      { key: "pedidos", label: "Pedidos", to: "pedidos", icon: PackageOpen, available: true },
      { key: "envios", label: "Envios", to: "envios", icon: MapPinned, available: true },
    ],
  },
  {
    id: "configuracion",
    label: "Configuracion",
    items: [
      { key: "perfil", label: "Perfil", to: "perfil", icon: ClipboardList, available: true },
      { key: "produccion", label: "Produccion", to: "produccion", icon: Printer, available: true },
      { key: "materiales", label: "Materiales", to: "materiales", icon: PackageCheck, available: true },
      { key: "logistica", label: "Logistica", to: "logistica", icon: Truck, available: true },
    ],
  },
  {
    id: "reputacion",
    label: "Reputacion",
    items: [
      { key: "portfolio", label: "Portfolio", to: "portfolio", icon: Star, available: true },
      { key: "certificacion", label: "Certificacion", to: "certificacion", icon: ShieldCheck, available: true },
      { key: "competitividad", label: "Competitividad", to: "competitividad", icon: TrendingUp, available: true },
    ],
  },
];

const allNavigationItems: NavItem[] = navigationGroups.flatMap((g) => g.items);

function formatProviderLocation(provider?: DashboardProvider | null) {
  const parts = [provider?.localidad, provider?.provincia].filter(Boolean);
  return parts.join(", ");
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
  const session = useProviderDashboardSession();
  const providerId = session.providerId ?? user.provider_id;

  const summaryQuery = useQuery({
    queryKey: ["provider-dashboard", "resumen", providerId],
    queryFn: () => fetchProviderSummary(providerId!),
    enabled: providerId != null,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const badges = useMemo<Record<string, number>>(() => {
    const m = summaryQuery.data?.metrics;
    if (!m) return {};
    const result: Record<string, number> = {};
    if (m.cotizaciones_participadas > 0) result.cotizaciones = m.cotizaciones_participadas;
    if (m.pedidos_abiertos > 0) result.pedidos = m.pedidos_abiertos;
    return result;
  }, [summaryQuery.data]);

  const currentSection = useMemo(() => {
    const pathname = location.pathname.split("/").filter(Boolean);
    return pathname[pathname.length - 1] ?? "resumen";
  }, [location.pathname]);

  const hasUnreadNotifications = useMemo(() => {
    const m = summaryQuery.data?.metrics;
    if (!m) return false;
    return (
      (m.cotizaciones_participadas ?? 0) > 0 ||
      (m.pedidos_abiertos ?? 0) > 0
    );
  }, [summaryQuery.data]);

  const fetchedProvider = summaryQuery.data?.provider ?? null;
  const effectiveProvider = provider ?? fetchedProvider;
  const providerName = effectiveProvider?.nombre?.trim() || "";
  const providerLogoUrl = effectiveProvider?.logo_url?.trim() || "";
  const providerLocation = formatProviderLocation(effectiveProvider) || "Cobertura en configuracion";
  const providerInitials = providerName
    ? providerName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || providerName[0]?.toUpperCase()
    : "";
  const sectionLabel =
    allNavigationItems.find((item) => item.key === currentSection)?.label ?? "Dashboard";
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
    <div className="dashboard-dark min-h-screen">
      <div className="dashboard-dark__bg-grid" aria-hidden />
      <div className="dashboard-dark__content relative flex min-h-screen">
        <aside className="dashboard-dark__sidebar hidden w-[292px] shrink-0 border-r border-white/10 bg-gradient-dark text-hero-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
          <div className="border-b border-white/10 px-7 py-6">
            <Link to="/" className="inline-flex">
              <img src={logoWhite} alt="COMPARO3D" className="h-7 opacity-90" />
            </Link>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/90">
              Panel de proveedores
            </p>
            <div className="mt-4 flex flex-col items-start gap-3">
              {providerLogoUrl ? (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                  <img
                    src={providerLogoUrl}
                    alt={providerName || "Logo del proveedor"}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : providerInitials ? (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary/30 to-primary/10 font-[Montserrat] text-2xl font-bold tracking-tight text-white">
                  {providerInitials}
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-hero-muted">
                  <Building2 className="h-7 w-7" />
                </div>
              )}
              <div className="space-y-1">
                <h2 className="font-[Montserrat] text-xl font-bold leading-tight tracking-tight text-hero-foreground">
                  {providerName || "Tu marca"}
                </h2>
                <p className="text-sm text-hero-muted">{providerLocation}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {effectiveProvider?.estado === "activo" ? (
                <DashboardStatePill tone="success" className="border-white/10 bg-white/5">
                  Activo
                </DashboardStatePill>
              ) : null}
              <DashboardStatePill
                tone="muted"
                className="border-white/10 bg-white/5 text-hero-muted"
              >
                ID {effectiveProvider?.id ?? user.provider_id ?? "N/D"}
              </DashboardStatePill>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            {navigationGroups.map((group, groupIdx) => (
              <div key={group.id} className={cn("space-y-1", groupIdx > 0 && "mt-4")}>
                <div className="dashboard-dark__nav-section-label">{group.label}</div>
                {group.items.map((item) => {
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

                  const badgeCount = badges[item.key];
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
                          <div className="flex items-center gap-2">
                            {badgeCount != null && badgeCount > 0 ? (
                              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-white">
                                {badgeCount}
                              </span>
                            ) : null}
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-transform",
                                isActive
                                  ? "translate-x-0 text-primary"
                                  : "-translate-x-1 opacity-40 group-hover:translate-x-0"
                              )}
                            />
                          </div>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="dashboard-dark__topbar">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-5 py-3 md:px-6 xl:px-8">
              {/* Breadcrumbs */}
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="truncate font-semibold text-white">
                  {providerName || "Tu marca"}
                </span>
                <span className="opacity-40">/</span>
                <span className="truncate text-[hsl(var(--hero-muted))]">{sectionLabel}</span>
              </div>

              {/* Right actions: notif + help + avatar + logout */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Notificaciones"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    window.location.assign(`/proveedores-v2/resumen${routeSuffix}`);
                  }}
                >
                  <Bell className="h-4 w-4" />
                  {hasUnreadNotifications ? (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-[#0a0d12]" />
                  ) : null}
                </button>

                <a
                  href="/proveedores/ayuda"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ayuda"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <HelpCircle className="h-4 w-4" />
                </a>

                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 font-[Montserrat] text-[11px] font-bold text-white"
                  aria-label={`Avatar ${providerName || "proveedor"}`}
                >
                  {providerInitials || "?"}
                </div>

                <Button
                  onClick={() => void handleLogout()}
                  variant="outline"
                  className="hidden h-9 rounded-xl border-white/15 bg-white/10 px-3 text-sm text-white hover:bg-white/20 md:inline-flex"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Cerrando..." : "Salir"}
                </Button>
              </div>
            </div>

            {/* Mobile horizontal scroll de tabs — se mantiene */}
            <div className="mx-auto flex w-full max-w-[1600px] gap-2 overflow-x-auto px-5 pb-2 md:px-6 lg:hidden xl:px-8 scrollbar-hide">
              {allNavigationItems.map((item) => {
                if (!item.available || !item.to) {
                  return (
                    <span
                      key={item.key}
                      className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[hsl(var(--hero-muted))]"
                    >
                      {item.label}
                    </span>
                  );
                }

                const mobileBadge = badges[item.key];
                return (
                  <NavLink
                    key={item.key}
                    to={`${item.to}${routeSuffix}`}
                    end
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                        isActive
                          ? "border-primary/40 bg-primary/20 text-white"
                          : "border-white/10 bg-white/6 text-[hsl(var(--hero-muted))] hover:text-white"
                      )
                    }
                  >
                    {item.label}
                    {mobileBadge != null && mobileBadge > 0 ? (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
                        {mobileBadge}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
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
