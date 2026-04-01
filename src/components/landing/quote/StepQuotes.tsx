import { FileText, Star, MapPin, Clock } from "lucide-react";
import { QuoteOption } from "@/lib/api";

interface StepQuotesProps {
  isEmpresa: boolean;
  isProcessing: boolean;
  progressMessage: string;
  error: string | null;
  quotes: QuoteOption[];
  sessionId: string;
  onSelectQuote: (quoteOptionUid: string) => void;
  onBack: () => void;
}

function ProviderCard({
  option,
  isTop,
  onSelect,
}: {
  option: QuoteOption;
  isTop: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
        isTop
          ? "border-accent/40 bg-gradient-to-br from-accent/5 to-background"
          : "border-border bg-card"
      }`}
    >
      {isTop && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-accent to-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white">
          Mejor opción
        </span>
      )}

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[18px] font-bold text-primary">
          {option.provider_name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="truncate font-bold text-foreground">{option.provider_name}</p>
            {option.trust_metrics.score > 0 && (
              <span className="flex items-center gap-0.5 text-[13px] text-yellow-500">
                <Star size={12} fill="currentColor" />
                <span className="font-semibold">{option.trust_metrics.score.toFixed(1)}</span>
                {option.trust_metrics.reviews_count > 0 && (
                  <span className="text-muted-foreground">
                    ({option.trust_metrics.reviews_count})
                  </span>
                )}
              </span>
            )}
            {option.provider_tier && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                {option.provider_tier}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 flex-wrap">
            {option.provider_location && (
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <MapPin size={10} />
                {option.provider_location}
              </span>
            )}
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Clock size={10} />
              {option.delivery_days} {option.delivery_days === 1 ? "día" : "días"}
            </span>
          </div>
        </div>

        {/* Precio + CTA */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-[20px] font-extrabold leading-tight text-foreground">
            ${option.price_ars.toLocaleString("es-AR")}
          </p>
          <button
            onClick={onSelect}
            className="rounded-lg bg-gradient-primary px-4 py-2 text-[13px] font-bold text-primary-foreground shadow-cta transition-opacity hover:opacity-90"
          >
            Elegir
          </button>
        </div>
      </div>
    </div>
  );
}

export function StepQuotes({
  isEmpresa,
  isProcessing,
  progressMessage,
  error,
  quotes,
  sessionId,
  onSelectQuote,
  onBack,
}: StepQuotesProps) {
  return (
    <div>
      <h3 className="text-[24px] font-semibold leading-tight text-foreground">
        {isEmpresa ? "Propuesta en proceso" : "Cotizaciones disponibles"}
      </h3>
      <p className="mt-1 text-[13px] text-muted-foreground">Sesión: {sessionId}</p>

      {isEmpresa ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <FileText size={24} className="text-accent" />
          </div>
          <p className="mb-1 text-[15px] font-medium text-foreground">
            Tu propuesta está siendo preparada
          </p>
          <p className="mx-auto max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Nuestro equipo está coordinando con proveedores verificados. Recibís la propuesta
            consolidada en hasta 72 hs hábiles.
          </p>
        </div>
      ) : (
        <>
          {/* Estado de procesamiento */}
          {isProcessing && (
            <div className="mt-5 flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-[15px] font-medium text-foreground">{progressMessage}</p>
              <p className="text-[13px] text-muted-foreground">
                Estamos calculando el costo exacto con PrusaSlicer para cada proveedor disponible
              </p>
            </div>
          )}

          {/* Error */}
          {error && !isProcessing && (
            <div className="mt-5 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-[13px] text-destructive">{error}</p>
            </div>
          )}

          {/* Lista de cotizaciones */}
          {!isProcessing && quotes.length > 0 && (
            <div className="mt-5 space-y-3">
              {quotes.map((q, i) => (
                <ProviderCard
                  key={q.quote_option_uid}
                  option={q}
                  isTop={i === 0}
                  onSelect={() => onSelectQuote(q.quote_option_uid)}
                />
              ))}
            </div>
          )}

          {/* Sin cotizaciones aún y no está procesando */}
          {!isProcessing && quotes.length === 0 && !error && (
            <div className="mt-5 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-[14px] text-muted-foreground">
                No se encontraron cotizaciones disponibles. Por favor intentá de nuevo.
              </p>
            </div>
          )}
        </>
      )}

      <button
        onClick={onBack}
        disabled={isProcessing}
        className="mt-6 rounded-xl border border-border px-5 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        Atrás
      </button>
    </div>
  );
}
