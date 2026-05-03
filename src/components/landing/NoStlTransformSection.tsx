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

type NoStlTransformSectionProps = {
  className?: string;
  whatsappHref?: string;
  cards?: TransformCard[];
};

const defaultCards: TransformCard[] = [
  {
    id: "joch",
    title: "De persona a busto 3D",
    sourceSrc: "/no-stl/joch-orig.png",
    resultSrc: "/no-stl/joch-3d.png",
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
    resultSrc: "/no-stl/brick-3d.png",
    sourceAlt: "Referencia original del ladrillo",
    resultAlt: "Modelo 3D del ladrillo",
    delayMs: 900,
    sourceObjectFit: "contain",
    resultObjectFit: "contain",
  },
  {
    id: "dragon",
    title: "De boceto a objeto impreso",
    sourceSrc: "/no-stl/dragon-orig.jpg",
    resultSrc: "/no-stl/dragon-3d.png",
    sourceAlt: "Boceto original del portalápices dragón",
    resultAlt: "Portalápices dragón impreso en 3D",
    delayMs: 1800,
    sourceObjectFit: "contain",
    resultObjectFit: "contain",
  },
];

export default function NoStlTransformSection({
  className = "",
  whatsappHref = "https://wa.me/5491167987401?text=Hola!%20Quiero%20consultar%20por%20modelado%203D%20sin%20archivo%20STL.",
  cards = defaultCards,
}: NoStlTransformSectionProps) {
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
          {cards.map((card) => (
            <article
              key={card.id}
              className={`no-stl-card no-stl-card-${card.id}`}
              style={{ ["--card-delay" as string]: `${card.delayMs ?? 0}ms` }}
            >
              <div className="no-stl-card-inner">
                <div className="no-stl-card-badge">{card.title}</div>

                <div className="no-stl-media-frame">
                  <div className="no-stl-media no-stl-media-source">
                    <img
                      src={card.sourceSrc}
                      alt={card.sourceAlt}
                      loading="lazy"
                      style={{ objectFit: card.sourceObjectFit ?? "contain" }}
                    />
                  </div>

                  <div className="no-stl-media no-stl-media-result">
                    <img
                      src={card.resultSrc}
                      alt={card.resultAlt}
                      loading="lazy"
                      style={{ objectFit: card.resultObjectFit ?? "contain" }}
                    />
                  </div>
                </div>

              </div>
            </article>
          ))}
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
          opacity: 0.4;
          pointer-events: none;
          animation: no-stl-soft-glow 6.6s ease-in-out infinite;
          animation-delay: var(--card-delay, 0ms);
        }

        .no-stl-media {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .no-stl-media img {
          width: 100%;
          height: 100%;
          object-position: center center;
          will-change: transform, opacity, filter;
        }

        .no-stl-media-source img {
          animation: no-stl-source-fade 7.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: var(--card-delay, 0ms);
        }

        .no-stl-media-result img {
          opacity: 0;
          transform: scale(0.985);
          filter: blur(5px) saturate(0.96) contrast(1.01);
          animation: no-stl-result-fade 7.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: var(--card-delay, 0ms);
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

        @keyframes no-stl-source-fade {
          0%,
          28% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0) saturate(1);
          }
          48%,
          72% {
            opacity: 0;
            transform: scale(1.018) translateY(-2px);
            filter: blur(5px) saturate(0.95);
          }
          90%,
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0) saturate(1);
          }
        }

        @keyframes no-stl-result-fade {
          0%,
          30% {
            opacity: 0;
            transform: scale(0.985);
            filter: blur(5px) saturate(0.96);
          }
          52%,
          70% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0) saturate(1);
          }
          88%,
          100% {
            opacity: 0;
            transform: scale(1.01);
            filter: blur(4px) saturate(0.96);
          }
        }

        @keyframes no-stl-soft-glow {
          0%,
          30% {
            opacity: 0.22;
          }
          52%,
          70% {
            opacity: 0.38;
          }
          88%,
          100% {
            opacity: 0.22;
          }
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
          .no-stl-media-source img,
          .no-stl-media-result img,
          .no-stl-media-frame::after {
            animation: none !important;
          }

          .no-stl-media-source img {
            opacity: 0;
          }

          .no-stl-media-result img {
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
      `}</style>
    </section>
  );
}
