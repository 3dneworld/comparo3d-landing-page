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
import { ProfileCapacity } from "@/features/provider-profile/components/ProfileCapacity";
import { ProfileReviews } from "@/features/provider-profile/components/ProfileReviews";
import { ProfilePortfolio } from "@/features/provider-profile/components/ProfilePortfolio";
import { ProfileContactCTA } from "@/features/provider-profile/components/ProfileContactCTA";
import { ProfileSkeleton } from "@/features/provider-profile/components/ProfileSkeleton";
import { ProfileTabs } from "@/features/provider-profile/components/ProfileTabs";
import { ProfileIndustries } from "@/features/provider-profile/components/ProfileIndustries";
import { ProfileQuotePanel } from "@/features/provider-profile/components/ProfileQuotePanel";
import { ProfileMaterials } from "@/features/provider-profile/components/ProfileMaterials";
import type { ProviderProfileResponse } from "@/features/provider-profile/types";

// ─── Estados de error/404 ────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={40} className="text-muted-foreground" aria-hidden="true" />
      <h1 className="font-[Montserrat] text-2xl font-bold text-foreground">
        Proveedor no encontrado
      </h1>
      <p className="text-sm text-muted-foreground max-w-md">
        Este proveedor todavía no está cargado o ya no está disponible. Mientras tanto
        podés volver al inicio para seguir explorando Comparo3D.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </a>
        <a
          href="/proveedores"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Ver todos los proveedores →
        </a>
      </div>
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

const DEMO_PROVIDER_BRANDS: Record<number, string[]> = {
  9: ["Bambu Lab", "Prusa", "Creality"],
};

function withDemoCapacityFallback(
  profile: ProviderProfileResponse | undefined,
): ProviderProfileResponse | undefined {
  const demoBrands = profile ? DEMO_PROVIDER_BRANDS[profile.provider.id] : undefined;
  if (!profile || !demoBrands || profile.provider.capacity.marcas?.length) {
    return profile;
  }

  return {
    ...profile,
    provider: {
      ...profile.provider,
      capacity: {
        ...profile.provider.capacity,
        marcas: demoBrands,
      },
    },
  };
}

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
        materiales: null,
        marcas: null,
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

// Resuelve un slug puro (sin prefijo id) al provider_id real vía endpoint backend.
// Devuelve { id, slug } o lanza NOT_FOUND.
async function resolveSlugToId(slug: string): Promise<{ id: number; slug: string }> {
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "https://api.3dneworld.com";
  const res = await fetch(`${API_BASE_URL}/api/proveedores/by-slug/${encodeURIComponent(slug)}`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { id: data.provider_id, slug: data.slug };
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ProviderProfile() {
  const { idslug } = useParams<{ idslug: string }>();
  const raw = (idslug ?? "").trim();
  // Formato canónico: <id>-<slug>. Si arranca con "<num>-", usamos el id directo.
  // Formato slug puro: usamos lookup-by-slug (después rutea al canonical via canonicalRedirect).
  const idPrefixMatch = raw.match(/^(\d+)(?:-|$)/);
  const idFromPrefix = idPrefixMatch ? parseInt(idPrefixMatch[1], 10) : NaN;
  const hasIdPrefix = Number.isFinite(idFromPrefix) && idFromPrefix > 0;

  // Query 1: lookup-by-slug si no hay prefijo numérico.
  const slugQuery = useQuery({
    queryKey: ["provider-profile-by-slug", raw],
    queryFn: () => resolveSlugToId(raw),
    enabled: !hasIdPrefix && raw.length > 0,
    staleTime: 60_000,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message === "NOT_FOUND") return false;
      return failureCount < 2;
    },
  });

  const resolvedId = hasIdPrefix ? idFromPrefix : slugQuery.data?.id;
  const providerId = resolvedId ?? 0;
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

  const slugLookupFailed = !hasIdPrefix && slugQuery.isError && slugQuery.error instanceof Error && slugQuery.error.message === "NOT_FOUND";
  const is404 =
    !staticProfile &&
    (slugLookupFailed || (hasIdPrefix && !isValidId) || (isError && error instanceof Error && error.message === "NOT_FOUND"));

  const profileData = staticProfile ?? withDemoCapacityFallback(data);
  // URL canónica: slug puro (sin prefijo id). Si el usuario entró por /proveedores/123-foo,
  // lo redirigimos a /proveedores/foo. Los VIDEO_PROVIDER_PROFILES mantienen el formato id-slug
  // porque sus IDs (9001-9005) son ficticios y no resuelven por slug.
  const canonicalSlug = profileData && !staticProfile
    ? profileData.provider.slug_hint || ""
    : (profileData && staticProfile ? `${profileData.provider.id}-${profileData.provider.slug_hint}` : "");
  useCanonicalRedirect(raw, canonicalSlug);

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

        {/* Hero dentro del contenedor — rounded-3xl card */}
        <ProfileHero provider={provider} badges={badges} />

        {/* Tabs sticky debajo del hero */}
        <ProfileTabs />

        {/* Layout 2 columnas: secciones (izq) + panel de cotización sticky (der) */}
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          {/* Columna izquierda — secciones de contenido */}
          <div className="min-w-0 space-y-6">
            {/* Resumen: descripción + sectores */}
            <section id="resumen" className="scroll-mt-32 space-y-6">
              <ProfileAbout about={provider.about} />
              <ProfileIndustries derived={derived} />
            </section>

            {/* Capacidad */}
            <div id="capacidad" className="scroll-mt-32">
              <ProfileCapacity capacity={provider.capacity} />
            </div>

            {/* Materiales */}
            <div id="materiales" className="scroll-mt-32 mt-6">
              <ProfileMaterials capacity={provider.capacity} />
            </div>

            {/* Trabajos / Portfolio */}
            <div id="trabajos" className="scroll-mt-32">
              <ProfilePortfolio items={portfolio} />
            </div>

            {/* Reseñas */}
            <div id="resenas" className="scroll-mt-32">
              <ProfileReviews data={reviews} rating={provider.rating} providerId={provider.id} providerName={provider.nombre} />
            </div>
          </div>

          {/* Columna derecha — panel sticky (solo desktop) */}
          <aside className="hidden lg:block">
            <ProfileQuotePanel provider={provider} />
          </aside>
        </div>

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
      {!is404 && profileData && (
        <ProfileContactCTA providerSlug={profileData.provider.slug_hint} />
      )}
    </div>
  );
}
