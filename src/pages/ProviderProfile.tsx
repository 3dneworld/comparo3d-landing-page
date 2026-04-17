// ProviderProfile.tsx — Página pública de perfil de proveedor
// URL: /proveedores/:idslug  (ej. /proveedores/1-printalot)
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { fetchProviderProfile } from "@/features/provider-profile/api";
import { ProfileHero } from "@/features/provider-profile/components/ProfileHero";
import { ProfileAbout } from "@/features/provider-profile/components/ProfileAbout";
import { ProfileRankingCard } from "@/features/provider-profile/components/ProfileRankingCard";
import { ProfileCapacity } from "@/features/provider-profile/components/ProfileCapacity";
import { ProfileIndustries } from "@/features/provider-profile/components/ProfileIndustries";
import { ProfileReviews } from "@/features/provider-profile/components/ProfileReviews";
import { ProfilePortfolio } from "@/features/provider-profile/components/ProfilePortfolio";
import { ProfileContactCTA } from "@/features/provider-profile/components/ProfileContactCTA";
import { ProfileSkeleton } from "@/features/provider-profile/components/ProfileSkeleton";

// ─── Estados de error/404 ────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-muted-foreground" aria-hidden="true" />
      <h1 className="font-[Montserrat] text-2xl font-bold text-foreground">
        Proveedor no encontrado
      </h1>
      <p className="text-sm text-muted-foreground">
        Este proveedor no existe o no está disponible en este momento.
      </p>
      <a
        href="/proveedores"
        className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Ver todos los proveedores →
      </a>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-destructive" aria-hidden="true" />
      <h1 className="font-[Montserrat] text-xl font-bold text-foreground">
        No pudimos cargar este perfil
      </h1>
      <p className="text-sm text-muted-foreground">
        Ocurrió un error al obtener los datos del proveedor.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}

// ─── Canonical redirect ───────────────────────────────────────────────────────
function useCanonicalRedirect(idslug: string | undefined, canonicalSlug: string) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!idslug || !canonicalSlug) return;
    if (idslug !== canonicalSlug) {
      navigate(`/proveedores/${canonicalSlug}`, { replace: true });
    }
  }, [idslug, canonicalSlug, navigate]);
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ProviderProfile() {
  const { idslug } = useParams<{ idslug: string }>();
  const providerId = parseInt(idslug?.split("-")[0] ?? "", 10);
  const isValidId = Number.isFinite(providerId) && providerId > 0;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["provider-profile", providerId],
    queryFn: () => fetchProviderProfile(providerId),
    enabled: isValidId,
    staleTime: 60_000, // coincide con Cache-Control backend
    retry: (failureCount, err) => {
      // No reintentar en 404
      if (err instanceof Error && err.message === "NOT_FOUND") return false;
      return failureCount < 2;
    },
  });

  const is404 =
    !isValidId || (isError && error instanceof Error && error.message === "NOT_FOUND");

  const canonicalSlug = data
    ? `${data.provider.id}-${data.provider.slug_hint}`
    : "";
  useCanonicalRedirect(idslug, canonicalSlug);

  const renderContent = () => {
    if (is404) return <NotFoundState />;
    if (isLoading) return <ProfileSkeleton />;
    if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

    const { provider, badges, portfolio, reviews, derived } = data;

    return (
      <main className="mx-auto max-w-screen-xl px-4 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Navegación" className="mb-6 text-sm text-muted-foreground">
          <a
            href="/proveedores"
            className="hover:text-foreground transition-colors"
          >
            Proveedores
          </a>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{provider.nombre}</span>
        </nav>

        {/* 2-col layout: sidebar sticky + main */}
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <ProfileHero provider={provider} badges={badges} />
          <div className="space-y-6">
            <ProfileAbout about={provider.about} />
            <ProfileRankingCard ranking={provider.ranking} badges={badges} />
            <ProfileCapacity capacity={provider.capacity} />
            <ProfileIndustries derived={derived} />
          </div>
        </div>

        {/* Full-width sections */}
        <ProfileReviews data={reviews} providerId={provider.id} />
        <ProfilePortfolio items={portfolio} />

        {/* Padding inferior en mobile para que el CTA sticky no tape el footer */}
        <div className="h-20 lg:hidden" aria-hidden="true" />
      </main>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      {renderContent()}
      {!is404 && !isLoading && !isError && <Footer />}
      {/* CTA sticky mobile — solo cuando hay datos */}
      {!is404 && !isLoading && !isError && <ProfileContactCTA />}
    </div>
  );
}
