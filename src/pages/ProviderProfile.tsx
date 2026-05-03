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
import type { ProviderProfileResponse } from "@/features/provider-profile/types";

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

const VIDEO_PROVIDER_PROFILES: Record<number, ProviderProfileResponse> = {
  9001: makeVideoProviderProfile({
    id: 9001,
    nombre: "JOACO3D",
    slug: "joaco3d",
    logo: "/logos/JOACO3D.png",
    localidad: "Buenos Aires",
    provincia: "Argentina",
    about: "Proveedor evaluado de la red COMPARO3D para trabajos de impresion 3D, prototipos y piezas funcionales.",
    materiales: ["PLA", "PETG", "ABS"],
  }),
  9002: makeVideoProviderProfile({
    id: 9002,
    nombre: "NOST3R",
    slug: "nost3r",
    logo: "/logos/Nost3rd.jpg",
    localidad: "Buenos Aires",
    provincia: "Argentina",
    about: "Taller de impresion 3D seleccionado por capacidad tecnica, terminacion y cumplimiento operativo.",
    materiales: ["PLA", "PETG", "TPU"],
  }),
  9003: makeVideoProviderProfile({
    id: 9003,
    nombre: "PRINTALOT",
    slug: "printalot",
    logo: "/logos/PAL.png",
    localidad: "CABA",
    provincia: "Argentina",
    about: "Proveedor de la red COMPARO3D orientado a produccion de piezas impresas, prototipado y entregas coordinadas.",
    materiales: ["PLA", "PETG", "ABS", "Nylon"],
  }),
  9004: makeVideoProviderProfile({
    id: 9004,
    nombre: "M3GA3D",
    slug: "m3ga3d",
    logo: "/logos/Mega3D.jpeg",
    localidad: "Buenos Aires",
    provincia: "Argentina",
    about: "Proveedor evaluado para trabajos de mayor volumen, piezas tecnicas y produccion distribuida dentro de COMPARO3D.",
    materiales: ["PLA", "PETG", "ABS"],
  }),
  9005: makeVideoProviderProfile({
    id: 9005,
    nombre: "PISCOBOT",
    slug: "piscobot",
    logo: "/logos/Piscobot.png",
    localidad: "Buenos Aires",
    provincia: "Argentina",
    about: "Proveedor seleccionado para impresion 3D con foco en piezas funcionales, prototipos y proyectos a medida.",
    materiales: ["PLA", "PETG"],
  }),
};

function makeVideoProviderProfile(input: {
  id: number;
  nombre: string;
  slug: string;
  logo: string;
  localidad: string;
  provincia: string;
  about: string;
  materiales: string[];
}): ProviderProfileResponse {
  return {
    provider: {
      id: input.id,
      nombre: input.nombre,
      nombre_comercial: input.nombre,
      slug_hint: input.slug,
      logo_url: input.logo,
      about: input.about,
      location: {
        localidad: input.localidad,
        provincia: input.provincia,
      },
      social: {
        sitio_web: null,
        whatsapp: null,
      },
      pricing: {
        min_trabajo_ars: null,
        tiempo_entrega_dias: 3,
      },
      capacity: {
        cama_max_mm: { x: 300, y: 300, z: 300 },
        impresoras_declaradas: 3,
        materiales_activos: input.materiales,
      },
      rating: {
        average: null,
        count: 0,
        distribution: null,
      },
      ranking: {
        sr_score: 75,
        mode: "production",
      },
    },
    badges: [
      {
        type: "seleccion_fundador",
        tier: "5+",
        label: "Trayectoria Verificada",
        granted_at: null,
      },
    ],
    portfolio: [],
    reviews: {
      items: [],
      total: 0,
      has_more: false,
    },
    derived: {
      industries_served: ["Prototipado", "Piezas funcionales", "Produccion corta"],
      project_types: ["FDM", "Modelos tecnicos", "Repuestos"],
    },
  };
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
  const staticProfile = VIDEO_PROVIDER_PROFILES[providerId];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["provider-profile", providerId],
    queryFn: () => fetchProviderProfile(providerId),
    enabled: isValidId && !staticProfile,
    staleTime: 60_000, // coincide con Cache-Control backend
    retry: (failureCount, err) => {
      // No reintentar en 404
      if (err instanceof Error && err.message === "NOT_FOUND") return false;
      return failureCount < 2;
    },
  });

  const is404 =
    !staticProfile &&
    (!isValidId || (isError && error instanceof Error && error.message === "NOT_FOUND"));

  const profileData = staticProfile ?? data;
  const canonicalSlug = profileData
    ? `${profileData.provider.id}-${profileData.provider.slug_hint}`
    : "";
  useCanonicalRedirect(idslug, canonicalSlug);

  const renderContent = () => {
    if (is404) return <NotFoundState />;
    if (!staticProfile && isLoading) return <ProfileSkeleton />;
    if (!profileData) return <ErrorState onRetry={() => refetch()} />;
    if (!staticProfile && isError) return <ErrorState onRetry={() => refetch()} />;

    const { provider, badges, portfolio, reviews, derived } = profileData;

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
      {!is404 && profileData && <Footer />}
      {/* CTA sticky mobile — solo cuando hay datos */}
      {!is404 && profileData && <ProfileContactCTA />}
    </div>
  );
}
