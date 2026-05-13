import AnimateOnScroll from "@/components/AnimateOnScroll";
import HowItWorksAnimation from "./HowItWorksAnimation";

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-background py-16 md:scroll-mt-28 md:py-24">
      <div className="container max-w-7xl">
        <AnimateOnScroll variant="fade-up">
          <div className="mx-auto mb-8 max-w-3xl text-center md:mb-10">
            <h2 className="text-[32px] font-bold leading-[1.08] text-foreground md:text-[42px]">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-5 text-[16px] leading-[1.7] text-muted-foreground md:text-[18px]">
              Subís el archivo, los proveedores cotizan, elegís y la pieza llega impresa
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll variant="fade-up" delay={0.08}>
          <HowItWorksAnimation />
        </AnimateOnScroll>
      </div>
    </section>
  );
};

export default HowItWorks;
