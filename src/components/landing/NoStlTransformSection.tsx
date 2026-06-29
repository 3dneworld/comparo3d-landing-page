type TransformCard = {
  id: string;
  title: string;
  sourceSrc: string;
  resultSrc: string;
  sourceAlt: string;
  resultAlt: string;
  delayMs?: number;
  sourceObjectFit?: "contain" | "cover";
  resultObjectFit?: "contain" | "cover";
};

import { useEffect, useRef, useState } from "react";

type NoStlTransformSectionProps = {
  className?: string;
  whatsappHref?: string;
  cards?: TransformCard[];
};

const CYCLE_MS = 5600;

const defaultCards: TransformCard[] = [
  {
    id: "joch",
    title: "De persona a busto 3D",
    sourceSrc: "/no-stl/joch-orig.webp",
    resultSrc: "/no-stl/joch-3d.webp",
    sourceAlt: "Foto original de persona",
    resultAlt: "Resultado 3D del busto",
    delayMs: 0,
    sourceObjectFit: "contain",
    resultObjectFit: "contain",
  },
  {
    id: "brick",
    title: "De referencia a pieza técnica",
    sourceSrc: "/no-stl/brick-orig.webp",
    resultSrc: "/no-stl/brick-3d.webp",
    sourceAlt: "Referencia original del ladrillo",
    resultAlt: "Modelo 3D del ladrillo",
    delayMs: 900,
    sourceObjectFit: "contain",
    resultObjectFit: "contain",
  },
  {
    id: "dragon",
    title: "De boceto a objeto impreso",
    sourceSrc: "/no-stl/dragon-orig.webp",
    resultSrc: "/no-stl/dragon-3d.webp",
    sourceAlt: "Boceto original del portalápices dragón",
    resultAlt: "Portalápices dragón impreso en 3D",
    delayMs: 1800,
    sourceObjectFit: "contain",
    resultObjectFit: "contain",
  },
];

type CardManualState = "auto" | "source" | "result";

export default function NoStlTransformSection({
  className = "",
  whatsappHref = "https://wa.me/5491167987401?text=Hola!%20Quiero%20consultar%20por%20modelado%203D%20sin%20archivo%20STL.",
  cards = defaultCards,
}: NoStlTransformSectionProps) {
  const [manualState, setManualState] = useState<Record<string, CardManualState>>({});

  const handleToggle = (id: string) => {
    setManualState((prev) => {
      const current = prev[id] ?? "auto";
      const next: CardManualState =
        current === "auto" ? "result" : current === "result" ? "source" : "result";
      return { ...prev, [id]: next };
    });
  };

  return (
    <section
      id="no-tengo-stl"
      className={`no-stl-section scroll-mt-24 ${className}`.trim()}
      aria-labelledby="no-stl-title"
    >
      <div className="no-stl-shell">
        <header className="no-stl-header">
          <h2 id="no-stl-title" className="no-stl-title">
            ¿No tenés un archivo STL?
          </h2>
          <p className="no-stl-subtitle">
            Mandanos una foto, boceto o descripción. Generamos el archivo 3D y lo cotizás con
            nuestros proveedores.
          </p>
        </header>

        <div className="no-stl-cards" aria-label="Ejemplos de transformación a modelo 3D">
          {cards.map((card) => {
            const state = manualState[card.id] ?? "auto";
            return (
              <CardItem
                key={card.id}
                card={card}
                state={state}
                onToggle={() => handleToggle(card.id)}
              />
            );
          })}
        </div>

        <div className="no-stl-cta-box">
          <div className="no-stl-cta-copy">
            <h3>¿Tenés una idea o una foto?</h3>
            <p>
              Escribinos y en menos de 24 h te confirmamos viabilidad y presupuesto estimado del
              modelado.
            </p>
          </div>

          <a
            className="no-stl-whatsapp"
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Escribinos por WhatsApp"
          >
            <img
              className="no-stl-whatsapp-icon"
              src="/no-stl/whatsapp.svg"
              alt=""
              aria-hidden="true"
              loading="lazy"
            />
            <span>Escribinos por WhatsApp</span>
          </a>
        </div>
      </div>

      <style>{`
        .no-stl-section {
          --bg: #f3f5f8;
          --text: #172233;
          --muted: #62708a;
          --line: rgba(23, 34, 51, 0.09);
          --blue: #2f6dff;
          --green: #25d366;
          --surface: rgba(255, 255, 255, 0.78);
          --shadow: 0 14px 34px rgba(16, 24, 40, 0.08);
          position: relative;
          background: var(--bg);
          padding: 64px 24px 52px;
          overflow: hidden;
        }

        .no-stl-shell {
          width: min(1280px, 100%);
          margin: 0 auto;
        }

        .no-stl-header {
          text-align: center;
          max-width: 1100px;
          margin: 0 auto 34px;
        }

        .no-stl-title {
          margin: 0;
          color: var(--text);
          font-size: 32px;
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: 0;
          text-wrap: balance;
        }

        @media (min-width: 768px) {
          .no-stl-title {
            font-size: 42px;
          }
        }

        .no-stl-subtitle {
          max-width: 760px;
          margin: 18px auto 0;
          color: var(--muted);
          font-size: clamp(1.02rem, 1.4vw, 1.18rem);
          line-height: 1.55;
          text-wrap: balance;
        }

        .no-stl-cards {
          display: grid;
          width: min(1080px, 100%);
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          align-items: stretch;
          margin: 0 auto 28px;
        }

        .no-stl-card {
          --card-accent: #2f6dff;
          --card-soft: rgba(47, 109, 255, 0.12);
          --card-wash: rgba(47, 109, 255, 0.06);
          min-width: 0;
        }

        .no-stl-card-joch {
          --card-accent: #2563eb;
          --card-soft: rgba(37, 99, 235, 0.13);
          --card-wash: rgba(37, 99, 235, 0.06);
        }

        .no-stl-card-brick {
          --card-accent: #c45a2b;
          --card-soft: rgba(196, 90, 43, 0.14);
          --card-wash: rgba(196, 90, 43, 0.07);
        }

        .no-stl-card-dragon {
          --card-accent: #15915a;
          --card-soft: rgba(21, 145, 90, 0.14);
          --card-wash: rgba(21, 145, 90, 0.07);
        }

        .no-stl-card-inner {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          border-radius: 16px;
          padding: 14px 14px 16px;
          border: 1px solid var(--line);
          background:
            radial-gradient(circle at top left, var(--card-soft), transparent 36%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.78));
          box-shadow: 0 10px 26px rgba(16, 24, 40, 0.07);
          overflow: hidden;
          isolation: isolate;
          text-align: left;
          font: inherit;
          color: inherit;
          cursor: pointer;
          appearance: none;
          -webkit-tap-highlight-color: transparent;
          transition: transform 200ms ease, box-shadow 200ms ease;
        }

        .no-stl-card-inner:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(16, 24, 40, 0.1);
        }

        .no-stl-card-inner:focus-visible {
          outline: 2px solid var(--card-accent);
          outline-offset: 2px;
        }

        .no-stl-card-inner:active {
          transform: translateY(0);
        }

        .no-stl-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .no-stl-phase-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid color-mix(in srgb, var(--card-accent) 20%, rgba(23, 34, 51, 0.08));
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
        }

        .no-stl-phase-pill {
          color: var(--muted);
          transition: color 320ms ease, opacity 320ms ease;
          opacity: 0.6;
        }

        .no-stl-phase-pill.is-active {
          color: var(--card-accent);
          opacity: 1;
        }

        .no-stl-phase-arrow {
          color: var(--muted);
          opacity: 0.7;
          font-size: 0.75rem;
        }

        .no-stl-tap-hint {
          position: absolute;
          right: 10px;
          bottom: 10px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(23, 34, 51, 0.72);
          color: #fff;
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          line-height: 1;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 280ms ease;
          z-index: 2;
        }

        @media (hover: none) {
          .no-stl-tap-hint {
            opacity: 1;
          }
        }

        .no-stl-card.is-manual .no-stl-tap-hint {
          opacity: 1;
        }

        .no-stl-card-inner::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 36%),
            linear-gradient(90deg, var(--card-wash), transparent 48%, rgba(255, 255, 255, 0.24));
          pointer-events: none;
          z-index: -1;
        }

        .no-stl-card-badge {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid color-mix(in srgb, var(--card-accent) 18%, rgba(23, 34, 51, 0.08));
          color: var(--text);
          font-size: 0.84rem;
          font-weight: 700;
          line-height: 1.25;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .no-stl-media-frame {
          position: relative;
          margin-top: 14px;
          aspect-ratio: 1.22 / 1;
          min-height: 0;
          border-radius: 14px;
          background:
            radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.92), rgba(250, 252, 255, 0.62) 52%, var(--card-wash)),
            linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(241, 245, 255, 0.76)),
            linear-gradient(
              90deg,
              rgba(23, 34, 51, 0.035) 0,
              rgba(23, 34, 51, 0.035) 1px,
              transparent 1px,
              transparent 32px
            ),
            linear-gradient(
              0deg,
              rgba(23, 34, 51, 0.03) 0,
              rgba(23, 34, 51, 0.03) 1px,
              transparent 1px,
              transparent 32px
            );
          border: 1px solid color-mix(in srgb, var(--card-accent) 15%, rgba(23, 34, 51, 0.08));
          overflow: hidden;
        }

        .no-stl-media-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 40%, var(--card-soft), transparent 44%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
          opacity: 0.3;
          pointer-events: none;
        }

        .no-stl-media {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          opacity: 0;
          transform: scale(0.985);
          filter: blur(5px) saturate(0.96);
          transition:
            opacity 620ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 620ms cubic-bezier(0.4, 0, 0.2, 1),
            filter 620ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .no-stl-media.is-on {
          opacity: 1;
          transform: scale(1);
          filter: blur(0) saturate(1);
        }

        .no-stl-media img {
          width: 100%;
          height: 100%;
          object-position: center center;
        }

        .no-stl-cta-box {
          display: flex;
          width: min(1080px, 100%);
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin: 0 auto;
          padding: 20px 24px;
          border-radius: 16px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.82);
          box-shadow: 0 10px 24px rgba(16, 24, 40, 0.055);
        }

        .no-stl-cta-copy h3 {
          margin: 0;
          color: var(--text);
          font-size: 24px;
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: 0;
        }

        @media (min-width: 768px) {
          .no-stl-cta-copy h3 {
            font-size: 28px;
          }
        }

        .no-stl-cta-copy p {
          margin: 7px 0 0;
          color: var(--muted);
          font-size: 0.96rem;
          line-height: 1.5;
          max-width: 620px;
        }

        .no-stl-whatsapp {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 54px;
          padding: 0 22px;
          border-radius: 12px;
          background: linear-gradient(180deg, #2fd567, #22c55e);
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(37, 211, 102, 0.24);
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
          white-space: nowrap;
        }

        .no-stl-whatsapp:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(37, 211, 102, 0.3);
          filter: saturate(1.03);
        }

        .no-stl-whatsapp-icon {
          width: 26px;
          height: 26px;
          flex: 0 0 auto;
          display: block;
          filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.08));
        }

        @media (max-width: 1100px) {
          .no-stl-section {
            padding-inline: 20px;
          }

          .no-stl-cards {
            gap: 18px;
          }

          .no-stl-card-inner {
            min-height: 0;
          }

          .no-stl-media-frame {
            min-height: 0;
          }

          .no-stl-cta-box {
            padding: 20px 22px;
          }
        }

        @media (max-width: 920px) {
          .no-stl-cards {
            grid-template-columns: 1fr;
          }

          .no-stl-card-inner {
            min-height: 0;
          }

          .no-stl-cta-box {
            flex-direction: column;
            align-items: stretch;
          }

          .no-stl-whatsapp {
            justify-content: center;
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .no-stl-section {
            padding: 52px 16px 40px;
          }

          .no-stl-header {
            margin-bottom: 28px;
          }

          .no-stl-title {
            line-height: 1.08;
          }

          .no-stl-subtitle {
            margin-top: 16px;
            font-size: 1rem;
          }

          .no-stl-card-inner {
            padding: 14px;
            border-radius: 18px;
          }

          .no-stl-card-badge {
            font-size: 0.82rem;
            padding: 9px 12px;
          }

          .no-stl-media-frame {
            border-radius: 14px;
          }

          .no-stl-media {
            padding: 16px;
          }

          .no-stl-cta-box {
            padding: 18px 16px;
            border-radius: 16px;
          }

          .no-stl-cta-copy h3 {
            font-size: 1.45rem;
          }

          .no-stl-cta-copy p {
            font-size: 0.94rem;
          }

          .no-stl-whatsapp {
            min-height: 52px;
            font-size: 0.96rem;
            padding-inline: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .no-stl-media {
            transition: opacity 200ms ease;
            transform: none;
            filter: none;
          }
        }
      `}</style>
    </section>
  );
}

type CardItemProps = {
  card: TransformCard;
  state: CardManualState;
  onToggle: () => void;
};

function CardItem({ card, state, onToggle }: CardItemProps) {
  const [autoPhase, setAutoPhase] = useState<"source" | "result">("source");
  const [inView, setInView] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = articleRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (state !== "auto" || !inView) return;
    const offsetMs = card.delayMs ?? 0;
    const halfCycle = CYCLE_MS / 2;
    let timeoutId: number | undefined;
    let intervalId: number | undefined;

    timeoutId = window.setTimeout(() => {
      setAutoPhase("result");
      let phase: "source" | "result" = "result";
      intervalId = window.setInterval(() => {
        phase = phase === "source" ? "result" : "source";
        setAutoPhase(phase);
      }, halfCycle);
    }, offsetMs + halfCycle);

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [state, inView, card.delayMs]);

  const showResult = state === "auto" ? autoPhase === "result" : state === "result";

  return (
    <article
      ref={articleRef}
      className={`no-stl-card no-stl-card-${card.id} ${showResult ? "is-result" : "is-source"} ${
        state !== "auto" ? "is-manual" : ""
      }`}
      style={{ ["--card-delay" as string]: `${card.delayMs ?? 0}ms` }}
    >
      <button
        type="button"
        className="no-stl-card-inner"
        onClick={onToggle}
        aria-label={`Alternar entre original y resultado 3D de ${card.title}`}
        aria-pressed={showResult}
      >
        <div className="no-stl-card-header">
          <span className="no-stl-card-badge">{card.title}</span>
          <span className="no-stl-phase-badge" aria-hidden="true">
            <span className={`no-stl-phase-pill ${showResult ? "" : "is-active"}`}>Antes</span>
            <span className="no-stl-phase-arrow">→</span>
            <span className={`no-stl-phase-pill no-stl-phase-after ${showResult ? "is-active" : ""}`}>Después</span>
          </span>
        </div>

        <div className="no-stl-media-frame">
          <div className={`no-stl-media no-stl-media-source ${showResult ? "" : "is-on"}`}>
            <img
              src={card.sourceSrc}
              alt={card.sourceAlt}
              loading="lazy"
              style={{ objectFit: card.sourceObjectFit ?? "contain" }}
            />
          </div>

          <div className={`no-stl-media no-stl-media-result ${showResult ? "is-on" : ""}`}>
            <img
              src={card.resultSrc}
              alt={card.resultAlt}
              loading="lazy"
              style={{ objectFit: card.resultObjectFit ?? "contain" }}
            />
          </div>

          <span className="no-stl-tap-hint" aria-hidden="true">Tocá para alternar</span>
        </div>
      </button>
    </article>
  );
}
