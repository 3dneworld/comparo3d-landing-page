import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { BarChart3, CheckCircle2, Eye, PackageCheck, Upload } from "lucide-react";

import modeloPreview from "@/assets/modelo-preview.png";
import type { Audience } from "@/contexts/AudienceContext";

type HeroProcessDemoProps = {
  audience: Audience;
  forceComplete?: boolean;
};

const COMPLETE_STAGE = 5;

const quotes = [
  {
    name: "PRINTALOT",
    logo: "/logos/PAL.png",
    price: "$32.300",
    time: "3 dias",
    highlight: true,
  },
  {
    name: "PISCOBOT",
    logo: "/logos/Piscobot.png",
    price: "$30.100",
    time: "2 dias",
    highlight: false,
  },
  {
    name: "JOACO3D",
    logo: "/logos/JOACO3D.png",
    price: "$29.000",
    time: "5 dias",
    highlight: false,
  },
];

const HeroProcessDemo = ({ audience, forceComplete = false }: HeroProcessDemoProps) => {
  const [stage, setStage] = useState(forceComplete ? COMPLETE_STAGE : 0);
  const [progress, setProgress] = useState(forceComplete ? 100 : 0);
  const isEmpresa = audience === "empresa";

  const fileName = isEmpresa ? "disco-acople.stl - 3.1 MB" : "pieza-soporte.stl - 2.4 MB";
  const quotesTitle = isEmpresa ? "Propuesta consolidada" : "Cotizaciones recibidas";

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (forceComplete || prefersReducedMotion) {
      setStage(COMPLETE_STAGE);
      setProgress(100);
      return;
    }

    setStage(0);
    setProgress(0);

    const timers = [
      window.setTimeout(() => setStage(1), 260),
      window.setTimeout(() => setStage(2), 1850),
      window.setTimeout(() => setStage(3), 2350),
      window.setTimeout(() => setStage(4), 3150),
      window.setTimeout(() => setStage(5), 4300),
    ];

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / 1700) * 100));
      setProgress(nextProgress);

      if (nextProgress < 100) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.cancelAnimationFrame(frame);
    };
  }, [audience, forceComplete, prefersReducedMotion]);

  return (
    <div className="hero-demo-shell">
      <div className="hero-demo-card" aria-label="Simulacion del proceso de cotizacion">
        <div className={`hero-demo-block hero-demo-upload ${stage >= 1 ? "is-visible" : ""}`}>
          <div className="hero-demo-icon hero-demo-icon-primary">
            <Upload size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <p className="text-xs text-hero-muted">Archivo cargado</p>
              <CheckCircle2
                size={12}
                className={`hero-demo-check ${stage >= 2 ? "is-complete" : ""}`}
                aria-hidden="true"
              />
            </div>
            <div className="hero-demo-progress" aria-hidden="true">
              <div className="hero-demo-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-hero-muted/60">{fileName}</p>
          </div>
        </div>

        <div className={`hero-demo-preview ${stage >= 3 ? "is-visible" : ""}`}>
          <div className="flex items-center gap-2 px-4 pb-2 pt-3">
            <Eye size={13} className="text-primary" aria-hidden="true" />
            <p className="text-xs text-hero-muted">Vista previa del modelo</p>
          </div>
          <div className="px-4 pb-4">
            <div className="hero-demo-model-frame">
              <img
                src={modeloPreview}
                alt="Vista previa de pieza 3D"
                className="hero-demo-model-image"
              />
            </div>
          </div>
        </div>

        <div className={`hero-demo-quotes ${stage >= 4 ? "is-visible" : ""}`}>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" aria-hidden="true" />
            <p className="text-xs text-hero-muted">{quotesTitle}</p>
          </div>
          <div className="space-y-2">
            {quotes.map((quote, index) => (
              <div
                key={quote.name}
                className={`hero-demo-quote ${quote.highlight ? "is-highlighted" : ""}`}
                style={{ "--quote-delay": `${index * 130}ms` } as CSSProperties}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="hero-demo-logo">
                    <img src={quote.logo} alt={`Logo ${quote.name}`} />
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-hero-muted">{quote.name}</span>
                    {quote.highlight ? <span className="hero-demo-recommended">Recomendado</span> : null}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-hero-muted/60">{quote.time}</span>
                  <span className={`font-semibold ${quote.highlight ? "text-accent" : "text-hero-foreground"}`}>
                    {quote.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`hero-demo-delivery ${stage >= 5 ? "is-visible" : ""}`}>
          <div className="hero-demo-icon hero-demo-icon-accent">
            <PackageCheck size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-hero-foreground">Entrega coordinada</p>
            <p className="text-[11px] text-hero-muted/60">Seguimiento incluido - Envio a todo el pais</p>
          </div>
        </div>
      </div>

      <style>{`
        .hero-demo-shell {
          perspective: 1400px;
          perspective-origin: 30% 50%;
          transform-style: preserve-3d;
        }

        .hero-demo-card {
          position: relative;
          display: flex;
          min-height: 474px;
          transform: rotateY(-13deg) rotateX(1.5deg);
          transform-origin: right center;
          transform-style: preserve-3d;
          flex-direction: column;
          gap: 12px;
          border: 1px solid hsl(var(--hero-muted) / 0.12);
          border-radius: 24px;
          background:
            linear-gradient(145deg, hsl(var(--hero-muted) / 0.095), hsl(var(--hero-muted) / 0.035) 45%, hsl(var(--hero-muted) / 0.075)),
            radial-gradient(circle at 18% 12%, hsl(var(--primary) / 0.18), transparent 32%);
          box-shadow:
            -24px 34px 72px hsl(220 54% 2% / 0.34),
            inset 1px 0 0 hsl(0 0% 100% / 0.07),
            inset 10px 0 24px hsl(220 52% 3% / 0.16);
          padding: 18px;
          will-change: transform;
        }

        .hero-demo-card::before {
          position: absolute;
          inset: 0;
          pointer-events: none;
          content: "";
          border-radius: inherit;
          background: linear-gradient(90deg, hsl(0 0% 100% / 0.13), transparent 18%, transparent 78%, hsl(var(--primary) / 0.08));
          opacity: 0.5;
        }

        .hero-demo-block,
        .hero-demo-preview,
        .hero-demo-quotes,
        .hero-demo-delivery {
          position: relative;
          opacity: 0;
          transform: translateY(10px) translateZ(0) scale(0.985);
          filter: blur(7px);
          transition:
            opacity 520ms ease,
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 520ms ease;
        }

        .hero-demo-block.is-visible,
        .hero-demo-preview.is-visible,
        .hero-demo-quotes.is-visible,
        .hero-demo-delivery.is-visible {
          opacity: 1;
          transform: translateY(0) translateZ(0) scale(1);
          filter: blur(0);
        }

        .hero-demo-block,
        .hero-demo-delivery {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid hsl(var(--hero-muted) / 0.1);
          border-radius: 16px;
          background: hsl(var(--hero-muted) / 0.055);
          padding: 12px;
        }

        .hero-demo-icon {
          display: flex;
          width: 36px;
          height: 36px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .hero-demo-icon-primary {
          background: var(--gradient-primary);
          color: hsl(var(--primary-foreground));
          box-shadow: 0 10px 22px hsl(var(--primary) / 0.24);
        }

        .hero-demo-icon-accent {
          background: hsl(var(--accent) / 0.2);
          color: hsl(var(--accent));
        }

        .hero-demo-check {
          color: hsl(var(--hero-muted) / 0.25);
          transform: scale(0.7);
          transition: color 260ms ease, transform 260ms ease;
        }

        .hero-demo-check.is-complete {
          color: hsl(var(--accent));
          transform: scale(1);
        }

        .hero-demo-progress {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: hsl(var(--hero-muted) / 0.15);
        }

        .hero-demo-progress-bar {
          height: 100%;
          border-radius: inherit;
          background: var(--gradient-primary);
          box-shadow: 0 0 18px hsl(var(--primary) / 0.45);
          transition: width 90ms linear;
        }

        .hero-demo-preview,
        .hero-demo-quotes {
          overflow: hidden;
          border: 1px solid hsl(var(--hero-muted) / 0.1);
          border-radius: 16px;
          background: hsl(var(--hero-muted) / 0.05);
        }

        .hero-demo-model-frame {
          display: flex;
          height: 112px;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 12px;
          background:
            radial-gradient(circle at 50% 35%, hsl(var(--primary) / 0.14), transparent 44%),
            hsl(var(--hero-muted) / 0.08);
        }

        .hero-demo-model-image {
          width: 100%;
          height: 100%;
          object-fit: scale-down;
        }

        .hero-demo-quotes {
          padding: 12px;
        }

        .hero-demo-quote {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid hsl(var(--hero-muted) / 0.065);
          border-radius: 12px;
          background: hsl(var(--hero-muted) / 0.055);
          padding: 8px 10px;
          font-size: 12px;
          opacity: 0;
          transform: translateY(8px);
          transition:
            opacity 430ms ease var(--quote-delay),
            transform 430ms cubic-bezier(0.22, 1, 0.36, 1) var(--quote-delay);
        }

        .hero-demo-quotes.is-visible .hero-demo-quote {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-demo-quote.is-highlighted {
          border-color: hsl(var(--accent) / 0.24);
          background:
            linear-gradient(135deg, hsl(var(--accent) / 0.13), hsl(var(--hero-muted) / 0.055) 58%),
            hsl(var(--hero-muted) / 0.055);
          box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.06);
        }

        .hero-demo-recommended {
          flex: 0 0 auto;
          border: 1px solid hsl(var(--accent) / 0.2);
          border-radius: 999px;
          background: hsl(var(--accent) / 0.14);
          padding: 2px 6px;
          color: hsl(var(--accent));
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }

        .hero-demo-logo {
          display: flex;
          width: 22px;
          height: 22px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid hsl(var(--hero-muted) / 0.12);
          border-radius: 8px;
          background: hsl(0 0% 100% / 0.95);
          padding: 3px;
        }

        .hero-demo-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-demo-card,
          .hero-demo-block,
          .hero-demo-preview,
          .hero-demo-quotes,
          .hero-demo-delivery,
          .hero-demo-quote,
          .hero-demo-check,
          .hero-demo-progress-bar {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroProcessDemo;
