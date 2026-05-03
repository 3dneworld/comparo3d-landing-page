import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Star } from "lucide-react";
import { useParams } from "react-router-dom";

import logoWhite from "@/assets/logo-white.png";
import { getClientReviewMeta, isApiError, submitClientReview } from "@/lib/api";
import { CLIENT_REVIEW_MIN_COMMENT, formatReviewExpiryDate } from "@/lib/clientReview";

type ReviewPageState = "loading" | "invalid" | "open" | "already_submitted" | "success";

const GRID_OVERLAY =
  "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")";

const ClientReviewPage = () => {
  const { token = "" } = useParams();
  const [pageState, setPageState] = useState<ReviewPageState>("loading");
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof getClientReviewMeta>> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; discount_pct: number; expires_at: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result = await getClientReviewMeta(token);
      if (cancelled) return;

      if (isApiError(result)) {
        setErrorMessage(result.error);
        setPageState("invalid");
        return;
      }

      setMeta(result);
      setPageState(result.state === "already_submitted" ? "already_submitted" : "open");
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const remainingChars = Math.max(0, CLIENT_REVIEW_MIN_COMMENT - comment.trim().length);
  const canSubmit = rating > 0 && comment.trim().length >= CLIENT_REVIEW_MIN_COMMENT && !submitting;
  const orderLabel = meta && !isApiError(meta) ? meta.item.public_order_id || `#${meta.item.id}` : "";
  const providerName = meta && !isApiError(meta) ? meta.item.provider_name : "";

  const helperCopy = useMemo(() => {
    if (remainingChars === 0) return "Perfecto, ya puedes enviarla.";
    return `Escribe al menos ${remainingChars} caracteres más para continuar.`;
  }, [remainingChars]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);

    const result = await submitClientReview(token, { rating, comment: comment.trim() });
    setSubmitting(false);

    if (isApiError(result)) {
      setErrorMessage(result.error);
      if (result.status === "already_submitted") {
        setPageState("already_submitted");
      }
      return;
    }

    setDiscount(result.discount);
    setPageState("success");
  };

  const renderContent = () => {
    if (pageState === "loading") {
      return (
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-hero-muted/10 bg-hero-muted/5 px-6 py-4 text-hero-muted">
            <Loader2 size={18} className="animate-spin" />
            Cargando tu review...
          </div>
        </div>
      );
    }

    if (pageState === "invalid") {
      return (
        <div className="rounded-[32px] border border-hero-muted/10 bg-hero-muted/5 p-8 sm:p-10">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/12 text-red-300">
            <AlertCircle size={22} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Link inválido</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-hero-foreground">
            No pudimos abrir esta review
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-hero-muted">
            {errorMessage || "Este enlace ya no es válido o no corresponde a un pedido activo."}
          </p>
        </div>
      );
    }

    if (!meta || isApiError(meta)) return null;

    if (pageState === "already_submitted") {
      return (
        <div className="rounded-[32px] border border-hero-muted/10 bg-hero-muted/5 p-8 sm:p-10">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Review registrada</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-hero-foreground">
            Ya dejaste tu review para {orderLabel}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-hero-muted">
            Gracias por compartir tu experiencia con {providerName}. Este enlace queda solo como consulta y no permite enviar una segunda review.
          </p>
        </div>
      );
    }

    if (pageState === "success" && discount) {
      return (
        <div className="rounded-[32px] border border-hero-muted/10 bg-hero-muted/5 p-8 sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Beneficio desbloqueado</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-hero-foreground">
            Gracias por calificar tu pedido
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-hero-muted">
            Tu review ya quedó registrada para {orderLabel}. Aquí tienes el código para usar en tu próximo checkout.
          </p>

          <div className="mt-8 rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary/18 via-primary/8 to-transparent p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Código {discount.discount_pct}% OFF</p>
            <p className="mt-3 break-all font-display text-3xl font-bold tracking-[0.08em] text-white">
              {discount.code}
            </p>
            <p className="mt-4 text-xs text-hero-muted">
              Vigencia: puedes usarlo hasta el {formatReviewExpiryDate(discount.expires_at)}.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[32px] border border-hero-muted/10 bg-hero-muted/5 p-8 sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Paso 1 de 2</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-hero-foreground sm:text-[2.55rem]">
          Primero calificá tu pedido
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-hero-muted">
          Una experiencia un poco más guiada: primero estrellas, luego comentario y al final tu beneficio para el próximo checkout.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const active = value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all ${
                  active
                    ? "border-amber-300/35 bg-amber-400/18 text-amber-300"
                    : "border-hero-muted/10 bg-white/5 text-hero-muted hover:border-primary/30 hover:text-hero-foreground"
                }`}
                aria-label={`${value} estrellas`}
              >
                <Star size={22} fill={active ? "currentColor" : "none"} />
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-[28px] border border-hero-muted/10 bg-white/[0.04] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Paso 2</p>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            placeholder="Contanos con detalle cómo te llegó la pieza, si cumplió expectativas y cómo fue la coordinación."
            className="mt-4 w-full rounded-[24px] border border-hero-muted/12 bg-hero-muted/8 px-5 py-4 text-sm leading-relaxed text-hero-foreground placeholder:text-hero-muted/45 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className={`mt-3 text-xs ${remainingChars === 0 ? "text-emerald-300" : "text-hero-muted"}`}>
            {helperCopy}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-[24px] border border-hero-muted/10 bg-white/5 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Desbloqueás tu beneficio al finalizar
            </p>
            <p className="mt-2 text-sm text-hero-muted">
              El código del 5% OFF aparece apenas enviás la review.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-cta transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar review"
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-dark">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: GRID_OVERLAY,
        }}
      />

      <header className="relative z-10 border-b border-hero-muted/10">
        <div className="container flex h-16 items-center justify-between">
          <a href="/">
            <img src={logoWhite} alt="COMPARO3D" className="h-8" />
          </a>
          <p className="text-sm text-hero-muted">Review pública</p>
        </div>
      </header>

      <main className="relative z-10 container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <div className="w-full max-w-4xl">{renderContent()}</div>
      </main>
    </div>
  );
};

export default ClientReviewPage;
