import { useRef, useState } from "react";
import { AudienceProvider, useAudience } from "@/contexts/AudienceContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import ProvidersSection from "@/components/landing/ProvidersSection";
import HowItWorks from "@/components/landing/HowItWorks";
import QuoteSection, { CatalogInjection } from "@/components/landing/QuoteSection";
import CompaniesSection from "@/components/landing/CompaniesSection";
import NoStlTransformSection from "@/components/landing/NoStlTransformSection";
import TrendingSection from "@/components/landing/TrendingSection";
import ProjectsGallery from "@/components/landing/ProjectsGallery";
import MaterialsSection from "@/components/landing/MaterialsSection";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import BackToTop from "@/components/BackToTop";
import ChatBubble from "@/components/ChatBubble";
import { API_BASE_URL, quickQuoteFromCatalog, isApiError, type CatalogItem } from "@/lib/api";

const NO_STL_WHATSAPP_URL =
  "https://wa.me/5491167987401?text=Hola!%20Quiero%20consultar%20por%20modelado%203D%20sin%20archivo%20STL.";

const LandingContent = () => {
  const { audience } = useAudience();

  // ── Estado para inyección desde catálogo ─────────────────────────────────
  const [catalogInjection, setCatalogInjection] = useState<CatalogInjection | null>(null);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  /** Cache de items trending para resolver instantaneamente thumbnail_url / suggested_color al clickear "Cotizar". */
  const trendingItemsRef = useRef<Map<string, CatalogItem>>(new Map());

  const handleTrendingItemsLoaded = (items: CatalogItem[]) => {
    trendingItemsRef.current = new Map(items.map((it) => [it.slug, it]));
    // Pre-warm: dispara la carga del thumbnail full al browser cache en cuanto se monta el carrousel.
    // Asi cuando el cliente clickea "Cotizar" el <img src=thumbnail_url> ya esta listo sin trip de red.
    items.forEach((it) => {
      if (it.thumbnail_url) {
        const img = new Image();
        img.src = `${API_BASE_URL}${it.thumbnail_url}`;
      }
    });
  };

  const handleCatalogItemSelect = (slug: string) => {
    const card = trendingItemsRef.current.get(slug);

    // 1) INMEDIATO: pintar el paso 2 con el thumbnail full pre-renderizado.
    //    La URL es PREDECIBLE (no depende del cache de items) — la armamos a mano para
    //    garantizar que el <img> arranque a cargar en este mismo render sin esperar nada.
    //    El PNG ya esta en disco del backend (CATALOG_IMG_DIR/<slug>_thumb.png) con
    //    cache-control max-age=86400 immutable — segunda vez es 0ms.
    const thumbnailUrlAbs = `${API_BASE_URL}/api/catalog/thumbnail/${slug}`;
    setCatalogInjection({
      sessionId:             "",   // se completa cuando llegue el response del backend
      tempName:              "",
      stlSha256:             "",
      thumbnailUrl:          thumbnailUrlAbs,
      fileName:              `${card?.title ?? slug}.stl`,
      material:              card?.material || "PLA",
      catalogTitle:          card?.title ?? slug,
      slug,
      suggestedColor:        card?.suggested_color || "",
      suggestedLayerHeight:  card?.layer_height || "",
    });
    // Scroll inmediato a la seccion de cotizacion — el cliente ve la pieza nueva ya.
    requestAnimationFrame(() => {
      document.getElementById("cotizar")?.scrollIntoView({ behavior: "smooth" });
    });

    // 2) En paralelo: pedir session_id real al backend. Cuando llegue, mergeamos sin tocar thumbnail.
    setLoadingSlug(slug);
    void (async () => {
      const result = await quickQuoteFromCatalog(slug);
      setLoadingSlug(null);
      if (isApiError(result)) {
        console.error("[catalog] quick-quote error:", result.error);
        return;
      }
      setCatalogInjection((prev) => {
        // Si el cliente clickeo otro card mientras llegaba este response, ignorar.
        if (!prev || prev.slug !== slug) return prev;
        return {
          ...prev,
          sessionId:            result.session_id,
          tempName:             result.temp_name,
          stlSha256:            result.stl_sha256,
          material:             result.catalog_item.material || prev.material,
          // Si el backend devuelve sugeridos distintos a los del card, ganan los del backend.
          suggestedColor:       result.catalog_item.suggested_color || prev.suggestedColor,
          suggestedLayerHeight: result.catalog_item.suggested_layer_height || prev.suggestedLayerHeight,
        };
      });
    })();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <Hero />
        <TrustStrip />
        <ProvidersSection />
        <HowItWorks />
        <QuoteSection catalogInjection={catalogInjection} />
        {audience === "empresa" && <CompaniesSection />}
        <NoStlTransformSection whatsappHref={NO_STL_WHATSAPP_URL} />
        <TrendingSection onSelect={handleCatalogItemSelect} loadingSlug={loadingSlug} onItemsLoaded={handleTrendingItemsLoaded} />
        <ProjectsGallery />
        <MaterialsSection />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
      <FloatingCTA />
      <BackToTop />
      <ChatBubble />
    </div>
  );
};

const Index = () => {
  console.log("[Index] Landing page rendered");

  return (
    <AudienceProvider>
      <LandingContent />
    </AudienceProvider>
  );
};

export default Index;
