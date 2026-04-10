import { AudienceProvider, useAudience } from "@/contexts/AudienceContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustStrip from "@/components/landing/TrustStrip";
import ProvidersSection from "@/components/landing/ProvidersSection";
import HowItWorks from "@/components/landing/HowItWorks";
import QuoteSection from "@/components/landing/QuoteSection";
import CompaniesSection from "@/components/landing/CompaniesSection";
import ProjectsGallery from "@/components/landing/ProjectsGallery";
import MaterialsSection from "@/components/landing/MaterialsSection";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import FloatingCTA from "@/components/FloatingCTA";
import BackToTop from "@/components/BackToTop";

const LandingContent = () => {
  const { audience } = useAudience();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <Hero />
        <TrustStrip />
        <ProvidersSection />
        <HowItWorks />
        <QuoteSection />
        {audience === "empresa" && <CompaniesSection />}
        <ProjectsGallery />
        <MaterialsSection />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
      <FloatingCTA />
      <BackToTop />
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
