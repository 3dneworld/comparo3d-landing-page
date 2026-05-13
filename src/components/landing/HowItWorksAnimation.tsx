import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Home, Mail, Shield, Star, Truck, Upload } from "lucide-react";

const PAL = {
  bg: "#f5f6f8",
  surface: "#ffffff",
  ink: "#161d2b",
  inkDim: "#6a7085",
  inkSoft: "#97a0b3",
  border: "#dcdfe5",
  borderSoft: "#e7e9ed",
  primary: "#2260c9",
  primarySoft: "#e6efff",
  success: "#1f9d55",
  successSoft: "#dcf5e9",
  muted: "#edeef1",
};

const FONT_DISPLAY = "Montserrat, system-ui, sans-serif";
const FONT_BODY = "Inter, system-ui, sans-serif";

type StepId = "upload" | "quotes" | "choose" | "pay" | "deliver";

const TIMELINE: Array<{ id: StepId; label: string; title: string; dur: number }> = [
  { id: "upload", label: "Paso 1", title: "Subí tu STL", dur: 7 },
  { id: "quotes", label: "Paso 2", title: "Recibí cotizaciones", dur: 8 },
  { id: "choose", label: "Paso 3", title: "Elegí la mejor", dur: 5 },
  { id: "pay", label: "Paso 4", title: "Pagá seguro", dur: 5 },
  { id: "deliver", label: "Paso 5", title: "Recibí tu pieza", dur: 10 },
];

const TOTAL = TIMELINE.reduce((sum, item) => sum + item.dur, 0);
const ROW_SLOT = 62;
const NEAR_ORDER: Record<string, number> = {
  Printalot: 0,
  Joaco3D: 1,
  Mega3D: 2,
  "Piscobot 3D": 3,
  "EM Studio": 4,
};

const PROVIDERS = [
  { name: "Joaco3D", logo: "/logos/JOACO3D.png", rating: 4.7, base: 21900, days: "2-3 días", city: "Palermo, CABA", dist: 2.8, badges: [] as string[], defaultIdx: 0 },
  { name: "EM Studio", logo: "/how-it-works/em-studio.png", rating: 4.6, base: 23400, days: "4-5 días", city: "Tigre, GBA", dist: 32, badges: [] as string[], defaultIdx: 1 },
  { name: "Printalot", logo: "/logos/PAL.png", rating: 4.9, base: 27500, days: "3-4 días", city: "San Nicolás, CABA", dist: 1.2, badges: ["10y", "org"], defaultIdx: 2, picked: true },
  { name: "Piscobot 3D", logo: "/logos/Piscobot.png", rating: 4.7, base: 30200, days: "3-4 días", city: "Villa Urquiza, CABA", dist: 5.2, badges: ["5y", "org"], defaultIdx: 3 },
  { name: "Mega3D", logo: "/logos/Mega3D.jpeg", rating: 4.6, base: 33800, days: "5-6 días", city: "CABA", dist: 4.5, badges: ["10y"], defaultIdx: 4 },
];

type Provider = (typeof PROVIDERS)[number];

const CALLOUTS: Record<StepId, Array<{ x: string; y: string; w: number; title: string; body: string }>> = {
  upload: [
    { x: "12px", y: "24%", w: 190, title: "Visor 3D en vivo", body: "Apenas subís el STL renderizamos la pieza para que confirmes que es lo que vas a cotizar." },
    { x: "902px", y: "62%", w: 230, title: "Opciones avanzadas", body: "Color, relleno y altura de capa. Defaults sensatos; ajustás solo si querés." },
  ],
  quotes: [
    { x: "12px", y: "19%", w: 190, title: "Cotizaciones reales", body: "Las cotizaciones que muestra la plataforma son un compromiso del proveedor." },
    { x: "902px", y: "42%", w: 230, title: "Filtrá rápido", body: "Proveedores certificados o cerca tuyo. Cambiá la cantidad y los precios se actualizan al instante." },
  ],
  choose: [
    { x: "902px", y: "50%", w: 230, title: "Opción recomendada", body: "Ordenamos por una combinación de precio, rating y cercanía al domicilio de entrega." },
  ],
  pay: [
    { x: "12px", y: "54%", w: 190, title: "Checkout seguro", body: "Podés abonar con tarjeta de crédito/débito o con el saldo de tu cuenta Mercado Pago." },
    { x: "902px", y: "68%", w: 220, title: "Resumen claro", body: "Ves a quién le comprás, qué material, qué plazo y cuánto pagás antes de confirmar." },
  ],
  deliver: [
    { x: "12px", y: "14%", w: 190, title: "Envío a tu casa", body: "Enviamos con Correo Argentino a domicilio o podés retirar por el laboratorio del proveedor." },
    { x: "902px", y: "62%", w: 240, title: "Tracking Correo Argentino", body: "Con el tracking de Correo Argentino que te enviamos por mail vas a poder hacer un seguimiento del envío." },
  ],
};

function priceFor(provider: Provider | undefined, qty: number) {
  const factors: Record<number, number> = { 1: 1, 2: 1.85, 3: 2.65, 4: 3.4 };
  return Math.round(((provider?.base ?? 0) * (factors[qty] || qty)) / 100) * 100;
}

function BadgeIcon({ kind, size = 20 }: { kind: string; size?: number }) {
  if (kind === "10y") {
    return <img src="/badges/badge-10-anos.png" alt="10+ años" title="10+ años en Comparo3D" style={{ width: size, height: size, objectFit: "contain" }} />;
  }
  if (kind === "5y") {
    return (
      <img src="/badges/badge-5-anos.png" alt="5+ años" title="5+ años en Comparo3D" style={{ width: size, height: size, objectFit: "contain" }} />
    );
  }
  if (kind === "org") {
    return <img src="/badges/badge-organico.png" alt="Certificado orgánico" title="Certificado Orgánico" style={{ width: size, height: size, objectFit: "contain" }} />;
  }
  return null;
}

function SceneFrame({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .4s ease, transform .4s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

function SpotlightOverlay({ step, progress }: { step: StepId; progress: number }) {
  let target: null | { x: number; y: number; w: number; h: number; rx: number } = null;

  if (step === "quotes") {
    if (progress >= 0.5 && progress < 0.6) {
      target = { x: 512, y: 74, w: 132, h: 29, rx: 15 };
    } else if (progress >= 0.68 && progress < 0.78) {
      target = { x: 235, y: 72, w: 126, h: 33, rx: 17 };
    }
  }

  if (!target) return null;

  return (
    <svg style={{ position: "absolute", inset: 0, zIndex: 15, pointerEvents: "none", width: "100%", height: "100%", animation: "hiw-fade-up .25s ease-out" }}>
      <defs>
        <mask id="spotlight-mask-v3">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect x={target.x} y={target.y} width={target.w} height={target.h} rx={target.rx} fill="black" />
        </mask>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.42)" mask="url(#spotlight-mask-v3)" />
    </svg>
  );
}

function BrowserMock({ step, progress }: { step: StepId; progress: number }) {
  return (
    <div
      style={{
        width: 900,
        height: 540,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 1px 3px rgba(22,29,43,.08), 0 24px 60px rgba(22,29,43,.12)",
        border: `1px solid ${PAL.border}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ height: 40, background: "#f7f8fa", borderBottom: `1px solid ${PAL.borderSoft}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28ca42" }} />
        </div>
        <div
          style={{
            flex: 1,
            height: 22,
            background: "#fff",
            borderRadius: 6,
            border: `1px solid ${PAL.borderSoft}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_BODY,
            fontSize: 11,
            color: PAL.inkSoft,
            maxWidth: 360,
            margin: "0 auto",
          }}
        >
          🔒 comparo3d.com.ar
        </div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ position: "relative", height: 500 }}>
        <SceneFrame visible={step === "upload"}>
          <SceneUpload progress={step === "upload" ? progress : 0} />
        </SceneFrame>
        <SceneFrame visible={step === "quotes" || step === "choose"}>
          <SceneQuotesChoose step={step} progress={step === "quotes" || step === "choose" ? progress : 0} />
        </SceneFrame>
        <SceneFrame visible={step === "pay"}>
          <ScenePay progress={step === "pay" ? progress : 0} />
        </SceneFrame>
        <SceneFrame visible={step === "deliver"}>
          <SceneDeliver progress={step === "deliver" ? progress : 0} />
        </SceneFrame>
        <SpotlightOverlay step={step} progress={progress} />
      </div>
    </div>
  );
}

function SceneUpload({ progress }: { progress: number }) {
  let phase = 0;
  if (progress >= 0.25) phase = 1;
  if (progress >= 0.45) phase = 2;
  if (progress >= 0.65) phase = 3;

  return (
    <div style={{ padding: "24px 32px", height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: PAL.ink, letterSpacing: "-0.005em" }}>Cotizar mi pieza</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PAL.inkDim, marginTop: 2 }}>Subí tu STL y completá los datos</div>
      </div>

      <div
        style={{
          position: "relative",
          height: phase === 3 ? 220 : 380,
          transition: "height .4s ease",
          border: `2px dashed ${phase >= 1 ? PAL.primary : PAL.border}`,
          borderRadius: 14,
          background: phase >= 2 ? PAL.bg : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {phase === 0 && (
          <div style={{ textAlign: "center", color: PAL.inkDim }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: PAL.primarySoft, color: PAL.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Upload size={28} />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: PAL.ink }}>Arrastrá tu archivo STL acá</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 6 }}>o hacé click para seleccionar - máx. 50MB</div>
          </div>
        )}

        {phase === 1 && (
          <div
            style={{
              width: 240,
              height: 64,
              background: PAL.surface,
              borderRadius: 10,
              border: `1px solid ${PAL.primary}`,
              boxShadow: "0 8px 28px rgba(34,96,201,.18)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: "hiw-drop 1.2s ease-out forwards",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: PAL.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>STL</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: PAL.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Ventilador v3.STL</div>
              <div style={{ height: 4, background: PAL.muted, borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", background: PAL.primary, animation: "hiw-fill 1.1s ease-out forwards" }} />
              </div>
            </div>
          </div>
        )}

        {(phase === 2 || phase === 3) && (
          <div style={{ width: "100%", height: "100%", position: "relative", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src="/how-it-works/ventilador.png"
              alt="Ventilador v3"
              style={{
                maxWidth: phase === 3 ? "40%" : "60%",
                maxHeight: phase === 3 ? "85%" : "78%",
                objectFit: "contain",
                transition: "max-width .4s ease, max-height .4s ease",
                filter: "drop-shadow(0 12px 24px rgba(34,96,201,.18))",
              }}
            />
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim, background: "#ffffffcc", padding: "5px 10px", borderRadius: 6, border: `1px solid ${PAL.borderSoft}` }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: PAL.success }} />
              Ventilador v3.STL · 142 KB
            </div>
            <div style={{ position: "absolute", bottom: 10, left: 12, fontFamily: FONT_BODY, fontSize: 10, color: PAL.inkSoft }}>143 × 143 × 16 mm</div>
          </div>
        )}
      </div>

      <div style={{ height: phase === 3 ? 152 : 0, opacity: phase === 3 ? 1 : 0, transition: "height .4s ease, opacity .3s ease", overflow: "hidden", background: "#fff", border: phase === 3 ? `1px solid ${PAL.borderSoft}` : "1px solid transparent", borderRadius: 12 }}>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: PAL.inkSoft, marginBottom: 10 }}>⌃ Opciones avanzadas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 18, alignItems: "flex-start" }}>
            <OptionSwatches />
            <FakeSelect label="Relleno" value="20%" />
            <FakeSelect label="Altura de capa" value="0.2mm (Recomendado)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionSwatches() {
  const swatches = [
    { c: "#fff", b: "#dcdfe5", l: "BLANCO" },
    { c: "#1a1a1a", b: "#1a1a1a", l: "NEGRO" },
    { c: PAL.primary, b: PAL.primary, l: "AZUL", selected: true },
    { c: "#dc2626", b: "#dc2626", l: "ROJO" },
    { c: "#6b7280", b: "#6b7280", l: "GRIS" },
    { c: "#f59e0b", b: "#f59e0b", l: "AMA..." },
    { c: "#16a34a", b: "#16a34a", l: "VERDE" },
  ];

  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: PAL.ink, marginBottom: 8 }}>COLOR</div>
      <div style={{ display: "flex", gap: 6 }}>
        {swatches.map((item) => (
          <div key={item.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: item.c, border: `1px solid ${item.b}`, boxShadow: item.selected ? `0 0 0 2px ${PAL.primary}` : "none" }} />
            <div style={{ fontSize: 7, fontWeight: 600, color: item.selected ? PAL.primary : PAL.inkSoft, letterSpacing: ".05em" }}>{item.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FakeSelect({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: PAL.ink, marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
      <div style={{ height: 32, padding: "0 12px", background: PAL.muted, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: FONT_BODY, fontSize: 12, color: PAL.ink }}>
        <span>{value}</span>
        <span style={{ color: PAL.inkSoft }}>▾</span>
      </div>
    </div>
  );
}

function FiltersBar({ qty, near, animateQty }: { qty: number; near: boolean; animateQty?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <FilterPill icon="⌬" text="PLA" />
      <FilterPill icon="◺" text="143×143×16 mm" />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "4px 4px 4px 12px", borderRadius: 999, background: PAL.muted, fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim }}>
        <span style={{ width: 16, textAlign: "center", color: PAL.inkSoft }}>−</span>
        <span
          style={{
            fontWeight: 600,
            color: PAL.ink,
            minWidth: 44,
            textAlign: "center",
            padding: "4px 8px",
            background: "#fff",
            borderRadius: 999,
            transform: animateQty ? "scale(1.15)" : "scale(1)",
            transition: "transform .2s",
            boxShadow: animateQty ? `0 0 0 2px ${PAL.primary}` : "none",
          }}
        >
          {qty} pieza{qty > 1 ? "s" : ""}
        </span>
        <span style={{ width: 20, height: 20, color: "#fff", background: PAL.primary, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, lineHeight: "18px", paddingBottom: 2, boxSizing: "border-box", marginRight: 2, boxShadow: animateQty ? `0 0 0 3px ${PAL.primary}40` : "none", transition: "box-shadow .2s" }}>
          +
        </span>
      </span>
      <TogglePill text="Certificados" active={false} />
      <TogglePill text="Cerca mío" active={near} icon="📍" />
    </div>
  );
}

function FilterPill({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: PAL.muted, fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: PAL.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8 }}>{icon}</span>
      {text}
    </span>
  );
}

function TogglePill({ text, active, icon }: { text: string; active: boolean; icon?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: active ? "#fde7e9" : PAL.muted, fontFamily: FONT_BODY, fontSize: 11, color: active ? "#c92e3e" : PAL.inkDim, transition: "all .25s" }}>
      <span style={{ color: active ? "#c92e3e" : "#bfc4ce" }}>{icon ?? "✓"}</span>
      {text}
      <span style={{ width: 24, height: 14, borderRadius: 999, background: active ? "#c92e3e" : "#cbd0d9", position: "relative", transition: "background .2s" }}>
        <span style={{ position: "absolute", top: 1, left: active ? 11 : 1, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left .25s" }} />
      </span>
    </span>
  );
}

function QuoteRow({ provider, qty, picked, near, recommended }: { provider: Provider; qty: number; picked?: boolean; near: boolean; recommended?: boolean }) {
  const price = priceFor(provider, qty);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 80px 84px 120px",
        gap: 12,
        alignItems: "center",
        padding: "10px 14px",
        background: picked ? PAL.primarySoft : PAL.surface,
        border: `1px solid ${picked ? PAL.primary : PAL.border}`,
        borderRadius: 12,
        transition: "all .35s ease",
        boxShadow: picked ? `0 0 0 3px ${PAL.primary}25` : "none",
        position: "relative",
      }}
    >
      {recommended && !picked && (
        <div style={{ position: "absolute", top: -12, left: 14, padding: "2px 10px", borderRadius: 999, background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".03em", fontFamily: FONT_BODY }}>
          Oferta Recomendada
        </div>
      )}
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f7f8fa", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `1px solid ${PAL.borderSoft}` }}>
        <img src={provider.logo} alt={provider.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: PAL.ink, whiteSpace: "nowrap" }}>{provider.name}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 2, fontFamily: FONT_BODY, fontSize: 11, color: "#f0a118" }}>
            <Star size={10} fill="currentColor" /> <span style={{ color: PAL.inkSoft }}>{provider.rating}</span>
          </span>
          {provider.badges.length > 0 && <div style={{ display: "flex", gap: 3, alignItems: "center" }}>{provider.badges.map((badge) => <BadgeIcon key={badge} kind={badge} />)}</div>}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: PAL.inkSoft }}>
          {near ? `📍 ${provider.city} · ${provider.dist} km` : provider.city} · {provider.days}
        </div>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim, whiteSpace: "nowrap" }}>{provider.days}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: PAL.ink, textAlign: "right", fontFeatureSettings: '"tnum"' }}>${price.toLocaleString("es-AR")}</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {picked ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: PAL.primary, color: "#fff", fontSize: 10, fontWeight: 700 }}>
            <Check size={12} /> ELEGIDO
          </span>
        ) : (
          <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: PAL.primary, fontWeight: 600 }}>Comprar →</span>
        )}
      </div>
    </div>
  );
}

function SceneQuotesChoose({ step, progress }: { step: StepId; progress: number }) {
  const choosing = step === "choose";
  const near = choosing || progress >= 0.55;
  const qty = choosing || progress >= 0.7 ? 2 : 1;
  const justBumped = !choosing && progress >= 0.68 && progress < 0.8;
  const visibleCount = choosing ? 5 : Math.min(5, Math.floor(progress * 12));
  const picked = choosing && progress >= 0.4;

  return (
    <div style={{ padding: "16px 24px", height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: PAL.ink }}>{choosing ? "Elegí la propuesta que más te conviene" : "Cotizaciones disponibles"}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PAL.success, animation: "hiw-pulse 1.2s ease-in-out infinite" }} />
          {near ? "4 proveedores cerca de vos" : `${Math.min(visibleCount, 5)} de 5 proveedores respondieron`}
        </div>
      </div>
      <FiltersBar qty={qty} near={near} animateQty={justBumped} />
      <div style={{ position: "relative", flex: 1, minHeight: ROW_SLOT * 5, marginTop: 10 }}>
        {PROVIDERS.map((provider, index) => {
          const isHidden = near && provider.name === "EM Studio";
          const slotIdx = near ? NEAR_ORDER[provider.name] : provider.defaultIdx;
          const isVisible = !isHidden && index < visibleCount;

          return (
            <div
              key={provider.name}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: slotIdx * ROW_SLOT,
                opacity: isHidden ? 0 : isVisible ? 1 : 0,
                transform: isHidden ? "scale(0.97)" : isVisible ? "scale(1)" : "scale(0.97) translateY(6px)",
                transition: "top 0.7s cubic-bezier(.4,0,.2,1), opacity 0.5s ease, transform 0.5s ease",
                pointerEvents: isHidden ? "none" : "auto",
              }}
            >
              <QuoteRow provider={provider} qty={qty} near={near} recommended={provider.picked && !isHidden && !picked} picked={provider.picked && picked} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FakeField({ label, value, flex }: { label: string; value?: string; flex?: boolean }) {
  return (
    <div style={{ flex: flex ? 1 : "none" }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: PAL.inkSoft, marginBottom: 3 }}>{label}</div>
      <div style={{ height: 30, padding: "0 10px", border: `1px solid ${PAL.border}`, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", fontFamily: FONT_BODY, fontSize: 12, color: value ? PAL.ink : PAL.inkSoft, fontFeatureSettings: '"tnum"' }}>
        {value || ""}
      </div>
    </div>
  );
}

function Row({ name, value, big }: { name: string; value: string; big?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_BODY }}>
      <span style={{ fontSize: big ? 12 : 11, color: big ? PAL.ink : PAL.inkDim, fontWeight: big ? 600 : 400 }}>{name}</span>
      <span style={{ fontSize: big ? 15 : 12, color: PAL.ink, fontWeight: big ? 700 : 500 }}>{value}</span>
    </div>
  );
}

function ScenePay({ progress }: { progress: number }) {
  const filled = progress > 0.3;
  const processing = progress > 0.7;
  const qty = 2;
  const total = priceFor(PROVIDERS.find((provider) => provider.picked), qty) + 1900;

  return (
    <div style={{ padding: "20px 28px", height: "100%", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: PAL.ink }}>Pago seguro</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim, marginTop: 3 }}>Procesado por Mercado Pago</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <PaymentOption active text="Tarjeta crédito / débito" />
          <PaymentOption text="Dinero en cuenta MP" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <FakeField label="Número de tarjeta" value={filled ? "4509  ••••  ••••  3127" : ""} />
          <div style={{ display: "flex", gap: 8 }}>
            <FakeField label="Vencimiento" value={filled ? "08/29" : ""} flex />
            <FakeField label="CVC" value={filled ? "•••" : ""} flex />
          </div>
          <FakeField label="Titular" value={filled ? "Lucía M. Vargas" : ""} />
        </div>
        <button style={{ marginTop: 4, padding: "11px 18px", background: processing ? PAL.success : PAL.primary, color: "#fff", border: "none", borderRadius: 10, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .3s" }}>
          {processing ? (
            <>
              <Check size={14} /> Pago confirmado
            </>
          ) : (
            `Pagar $${total.toLocaleString("es-AR")}`
          )}
        </button>
      </div>
      <div style={{ background: "#fafbfc", borderRadius: 14, border: `1px solid ${PAL.borderSoft}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: PAL.inkSoft }}>Resumen</div>
          <img src="/how-it-works/mercado-pago-transp.png" alt="Mercado Pago" style={{ height: 28, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f7f8fa", border: `1px solid ${PAL.borderSoft}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/logos/PAL.png" alt="Printalot" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: PAL.ink }}>Printalot</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: PAL.inkSoft }}>PLA · 3-4 días · 2 piezas</div>
          </div>
        </div>
        <div style={{ height: 1, background: PAL.borderSoft }} />
        <Row name="Pieza ×2" value={`$${priceFor(PROVIDERS.find((provider) => provider.picked), qty).toLocaleString("es-AR")}`} />
        <Row name="Envío" value="$1.900" />
        <Row name="Total" value={`$${total.toLocaleString("es-AR")}`} big />
        <div style={{ padding: "7px 10px", background: "#f1f6ff", borderRadius: 8, fontFamily: FONT_BODY, fontSize: 10, color: "#2d3277", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <Shield size={12} /> Pago protegido por Mercado Pago
        </div>
      </div>
    </div>
  );
}

function PaymentOption({ text, active }: { text: string; active?: boolean }) {
  return (
    <div style={{ flex: 1, padding: "8px 10px", border: active ? `1.5px solid ${PAL.primary}` : `1px solid ${PAL.border}`, borderRadius: 10, background: active ? PAL.primarySoft : "#fff", display: "flex", alignItems: "center", gap: 8, fontFamily: FONT_BODY, fontSize: 11, color: active ? PAL.ink : PAL.inkDim }}>
      <span style={{ width: 12, height: 12, borderRadius: "50%", border: active ? `3px solid ${PAL.primary}` : `1.5px solid ${PAL.border}`, background: "#fff" }} />
      <span style={{ fontWeight: active ? 600 : 400 }}>{text}</span>
    </div>
  );
}

function MilestonePill({ label, done, visible }: { label: string; done: boolean; visible: boolean }) {
  return (
    <div style={{ padding: "8px 10px", background: done ? PAL.successSoft : "#fafbfc", border: `1px solid ${done ? `${PAL.success}50` : PAL.borderSoft}`, borderRadius: 10, fontFamily: FONT_BODY, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)", transition: "opacity .4s ease, transform .4s ease" }}>
      <span style={{ color: done ? PAL.ink : PAL.inkSoft, fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Mail size={10} color={done ? PAL.success : PAL.inkSoft} style={{ opacity: visible ? 0.5 : 0, transition: "opacity .6s ease .2s" }} />
        <span style={{ color: done ? PAL.success : PAL.inkSoft, fontWeight: 700, fontSize: 13 }}>{done ? "✓" : "·"}</span>
      </div>
    </div>
  );
}

function SceneDeliver({ progress }: { progress: number }) {
  const showPago = progress >= 0.1;
  const showImprimiendo = progress >= 0.25;
  const showEnCamino = progress >= 0.4;
  const truckProgress = progress < 0.4 ? 0 : Math.min(1, (progress - 0.4) / 0.38);
  const delivered = progress >= 0.72;
  const arrived = truckProgress >= 1;
  const truckX = 95 + truckProgress * (805 - 95);

  return (
    <div style={{ padding: "20px 28px", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: PAL.ink }}>Tu pieza está en camino</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PAL.inkDim, marginTop: 2 }}>Pedido #C3D-04821 · Printalot · {delivered ? "Entregada" : "En reparto vía Correo Argentino"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 146, height: 40, borderRadius: 10, background: "#FFD100", border: `1px solid ${PAL.borderSoft}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 4px 12px rgba(45,50,119,.12)" }}>
            <img src="/how-it-works/correo-argentino-amarillo.jpg" alt="Correo Argentino" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "5px 11px", borderRadius: 999, background: delivered ? PAL.successSoft : "#fff4dd", color: delivered ? PAL.success : "#a06a05" }}>{delivered ? "✓ Entregada" : "🚚 En tránsito"}</span>
        </div>
      </div>

      <div style={{ position: "relative", height: 170, background: "linear-gradient(180deg,#f7faff,#fff)", borderRadius: 14, border: `1px solid ${PAL.borderSoft}`, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 80, right: 80, top: "60%", height: 4, background: PAL.muted, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 80, right: 80, top: "calc(60% - 1px)", height: 6, borderTop: `2px dashed ${PAL.inkSoft}`, opacity: 0.2 }} />
        <TrackPoint left={50} label="Printalot" image="/logos/PAL.png" />
        <TrackPoint right={50} label="Tu casa" done={arrived} />
        {progress >= 0.4 && !arrived && (
          <div style={{ position: "absolute", left: truckX, top: "60%", transform: "translate(-50%, -58%)", transition: "left .14s linear" }}>
            <div style={{ width: 44, height: 30, background: "#FFD100", color: "#2d3277", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(45,50,119,.18)" }}>
              <Truck size={18} />
            </div>
          </div>
        )}
        {arrived && (
          <div style={{ position: "absolute", right: 74, top: "60%", transform: "translate(50%, -10%)", animation: "hiw-fade-up .4s ease-out" }}>
            <div style={{ width: 28, height: 28, background: "#c89765", borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,.18)", position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#8b6432", transform: "translateY(-50%)" }} />
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#8b6432", transform: "translateX(-50%)" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
        <MilestonePill label="Pago" done visible={showPago} />
        <MilestonePill label="Imprimiendo" done visible={showImprimiendo} />
        <MilestonePill label="En camino" done visible={showEnCamino} />
        <MilestonePill label="Entregado" done={delivered} visible={delivered} />
      </div>
    </div>
  );
}

function TrackPoint({ left, right, label, image, done }: { left?: number; right?: number; label: string; image?: string; done?: boolean }) {
  const style: CSSProperties = {
    position: "absolute",
    top: "60%",
    transform: left !== undefined ? "translate(-50%, -50%)" : "translate(50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    ...(left !== undefined ? { left } : { right }),
  };

  return (
    <div style={style}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: done ? PAL.successSoft : "#f7f8fa", border: `1px solid ${done ? PAL.success : PAL.borderSoft}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s" }}>
        {image ? <img src={image} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Home size={20} color={done ? PAL.success : PAL.inkDim} />}
      </div>
      <span style={{ fontSize: 9, color: PAL.inkSoft, fontFamily: FONT_BODY }}>{label}</span>
    </div>
  );
}

function Callouts({ step, progress }: { step: StepId; progress: number }) {
  return (
    <>
      {CALLOUTS[step].map((callout, index) => {
        const visible = progress > (index + 1) * 0.18;
        return (
          <div
            key={`${step}-${callout.title}`}
            style={{
              position: "absolute",
              left: callout.x,
              top: callout.y,
              width: callout.w,
              background: "#fff",
              borderRadius: 10,
              padding: "12px 14px",
              boxSizing: "border-box",
              boxShadow: "0 2px 4px rgba(22,29,43,.06), 0 12px 32px rgba(22,29,43,.16)",
              border: `1px solid ${PAL.borderSoft}`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translate(0,0)" : "translate(0,6px)",
              transition: "opacity .35s ease, transform .35s ease",
              pointerEvents: "none",
              zIndex: 30,
            }}
          >
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 700, color: PAL.ink, marginBottom: 4 }}>{callout.title}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, lineHeight: 1.45, color: PAL.inkDim }}>{callout.body}</div>
          </div>
        );
      })}
    </>
  );
}

export default function HowItWorksAnimation() {
  const [time, setTime] = useState(0);
  const startRef = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = ((performance.now() - startRef.current) / 1000) % TOTAL;
      setTime(elapsed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { step, stepIndex, progress } = useMemo(() => {
    let acc = 0;
    for (let index = 0; index < TIMELINE.length; index += 1) {
      const item = TIMELINE[index];
      if (time < acc + item.dur) {
        return { step: item.id, stepIndex: index, progress: (time - acc) / item.dur };
      }
      acc += item.dur;
    }
    return { step: TIMELINE[0].id, stepIndex: 0, progress: 0 };
  }, [time]);

  const jumpTo = (index: number) => {
    const target = TIMELINE.slice(0, index).reduce((sum, item) => sum + item.dur, 0);
    startRef.current = performance.now() - target * 1000;
    setTime(target);
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <style>{`
        @keyframes hiw-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes hiw-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hiw-drop { 0% { transform: translateY(-40px); opacity: 0; } 40%,100% { transform: translateY(0); opacity: 1; } }
        @keyframes hiw-fill { from { width: 0; } to { width: 100%; } }
      `}</style>

      <div className="mx-auto mb-7 grid max-w-[1100px] grid-cols-5 gap-3 px-1">
        {TIMELINE.map((item, index) => {
          const active = index === stepIndex;
          const past = index < stepIndex;
          const pct = active ? progress * 100 : past ? 100 : 0;
          return (
            <button key={item.id} type="button" onClick={() => jumpTo(index)} className="min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left font-body">
              <div className="mb-3 h-[3px] overflow-hidden rounded-full bg-muted">
                <div style={{ width: `${pct}%`, background: active || past ? PAL.primary : PAL.muted, transition: active ? "width 100ms linear" : "width .25s" }} className="h-full" />
              </div>
              <div className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${active ? "text-primary" : past ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</div>
              <div className={`mt-1 text-[14px] font-semibold ${active || past ? "text-foreground" : "text-muted-foreground"}`}>{item.title}</div>
            </button>
          );
        })}
      </div>

      <div className="scrollbar-hide overflow-x-auto pb-4">
        <div style={{ position: "relative", width: 1100, height: 540, margin: "0 auto" }}>
          <BrowserMock step={step} progress={progress} />
          <Callouts step={step} progress={progress} />
        </div>
      </div>
    </div>
  );
}
