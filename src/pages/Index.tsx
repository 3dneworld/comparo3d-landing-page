import { AudienceProvider } from "@/contexts/AudienceContext";
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

const Index = () => {
  console.log("[Index] Landing page rendered");

  return (
    <AudienceProvider>
      <div className="min-h-screen">
        <Navbar />
        <Hero />
        <TrustStrip />
        <ProvidersSection />
        <HowItWorks />
        <QuoteSection />
        <CompaniesSection />
        <ProjectsGallery />
        <MaterialsSection />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </AudienceProvider>
  );
};

export default Index;
