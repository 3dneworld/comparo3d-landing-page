import { useState } from "react";
import { AudienceProvider, useAudience } from "@/contexts/AudienceContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import ProvidersSection from "@/components/landing/ProvidersSection";
import HowItWorks from "@/components/landing/HowItWorks";
import QuoteSection, { CatalogInjection } from "@/components/landing/QuoteSection";
import CompaniesSection from "@/components/landing/CompaniesSection";
import NoStlTransformSection from "@/components/landing/NoStlTransformSection";
import ProjectsGallery from "@/components/landing/ProjectsGallery";
import MaterialsSection from "@/components/landing/MaterialsSection";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import BackToTop from "@/components/BackToTop";
import ChatBubble from "@/components/ChatBubble";
import { quickQuoteFromCatalog, isApiError } from "@/lib/api";

const NO_STL_WHATSAPP_URL =
  "https://wa.me/5491167987401?text=Hola!%20Quiero%20consultar%20por%20modelado%203D%20sin%20archivo%20STL.";

const LandingContent = () => {
  const { audience } = useAudience();

  // ── Estado para inyección desde catálogo ─────────────────────────────────
  const [catalogInjection, setCatalogInjection] = useState<CatalogInjection | null>(null);
  const [isLoadingCatalogItem, setIsLoadingCatalogItem] = useState(false);

  const handleCatalogItemSelect = async (slug: string) => {
    setIsLoadingCatalogItem(true);
    const result = await quickQuoteFromCatalog(slug);
    setIsLoadingCatalogItem(false);

    if (isApiError(result)) {
      console.error("[catalog] quick-quote error:", result.error);
      // TODO: mostrar toast de error cuando esté disponible
      return;
    }

    setCatalogInjection({
      sessionId:    result.session_id,
      tempName:     result.temp_name,
      stlSha256:    result.stl_sha256,
      thumbnailUrl: result.thumbnail_base64 ?? "",
      fileName:     `${result.catalog_item.title}.stl`,
      material:     result.catalog_item.material,
      catalogTitle: result.catalog_item.title,
    });

    // Scroll a la sección de cotización
    document.getElementById("cotizar")?.scrollIntoView({ behavior: "smooth" });
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
