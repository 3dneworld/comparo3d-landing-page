// ProfileQuotePanel.tsx — Panel lateral sticky de conversión en perfil de proveedor
import { Clock, Truck, ShieldCheck, ArrowRight, MessageCircle } from "lucide-react";
import type { PublicProvider } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function buildWhatsAppUrl(whatsapp: string): string {
  const phone = whatsapp.replace(/\D/g, "");
  const msg = encodeURIComponent(
    "Hola, vi tu perfil en Comparo3D y queria consultarte por un trabajo."
  );
  return `https://wa.me/${phone}?text=${msg}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface ProfileQuotePanelProps {
  provider: PublicProvider;
}

export function ProfileQuotePanel({ provider }: ProfileQuotePanelProps) {
  const { pricing, social } = provider;

  return (
    <div className="lg:sticky lg:top-28 bg-card border border-border rounded-2xl p-6 shadow-card">
      {/* Precio mínimo — solo si hay valor real */}
      {pricing.min_trabajo_ars != null && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Desde
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-[Montserrat] text-[30px] font-extrabold leading-none tracking-tight text-foreground">
              {arsFormatter.format(pricing.min_trabajo_ars)}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
            Monto mínimo por trabajo
          </p>
        </div>
      )}

      {/* Separador solo si hay precio */}
      {pricing.min_trabajo_ars != null && (
        <div className="mt-3 border-t border-border" />
      )}

      {/* Filas de datos */}
      <div className={pricing.min_trabajo_ars != null ? "mt-1" : ""}>
        {/* Entrega estimada — solo si hay dato */}
        {pricing.tiempo_entrega_dias != null && (
          <div className="flex items-center gap-2.5 py-3 border-b border-border last:border-b-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <Clock size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Entrega estimada
              </p>
              <p className="mt-0.5 text-[14px] font-semibold text-foreground">
                {pricing.tiempo_entrega_dias} días hábiles
              </p>
            </div>
          </div>
        )}

        {/* Envíos — siempre visible */}
        <div className="flex items-center gap-2.5 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
            <Truck size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Envíos
            </p>
            <p className="mt-0.5 text-[14px] font-semibold text-foreground">
              Todo el país
            </p>
          </div>
        </div>
      </div>

      {/* CTA principal */}
      <a
        href="/#cotizador"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-3.5 text-[14px] font-bold text-white shadow-cta transition-opacity hover:opacity-90"
      >
        Pedir cotización
        <ArrowRight size={14} aria-hidden="true" />
      </a>

      {/* CTA WhatsApp — solo si hay número */}
      {social.whatsapp && (
        <a
          href={buildWhatsAppUrl(social.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-transparent px-4 py-3 text-[13px] font-semibold text-foreground transition-colors hover:border-[#25d366] hover:text-[#128c3c]"
        >
          <MessageCircle size={14} aria-hidden="true" />
          Consultar por WhatsApp
        </a>
      )}

      {/* Nota de pago protegido */}
      <div className="mt-3.5 flex gap-2 rounded-xl bg-muted/40 p-3">
        <ShieldCheck
          size={16}
          className="mt-0.5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-[12px] font-medium leading-[1.55] text-muted-foreground">
          Pago protegido por Comparo3D. Tu dinero se libera al proveedor solo
          cuando recibís y aprobás la pieza.
        </p>
      </div>
    </div>
  );
}
