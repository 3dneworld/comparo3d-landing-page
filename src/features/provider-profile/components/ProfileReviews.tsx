// ProfileReviews.tsx — Sección de reseñas verificadas con distribución, filtros y reply card
import { useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import type { ProviderRating, ProviderReviews } from "../types";

interface Props {
  data: ProviderReviews;
  rating: ProviderRating;
  providerId: number;
  providerName: string;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

const STARS = [5, 4, 3, 2, 1] as const;
const PAGE_SIZE = 5;

export function ProfileReviews({ data, rating, providerId: _providerId, providerName }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeStar, setActiveStar] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (data.total === 0) {
    return (
      <section className="py-10 text-center" aria-label="Reseñas">
        <p className="text-sm text-muted-foreground">
          Aún no hay reseñas. Sé el primero en cotizar.
        </p>
      </section>
    );
  }

  // Filtro por estrella activa
  const filteredItems = activeStar
    ? data.items.filter((r) => r.rating === activeStar)
    : data.items;

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  // Denominador para las barras de distribución
  const distTotal = rating.distribution
    ? Object.values(rating.distribution).reduce((a, b) => a + b, 0)
    : rating.count;

  const handleStarFilter = (star: number | null) => {
    setActiveStar(star);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section aria-labelledby="reviews-heading" className="mt-10">
      {/* Encabezado */}
      <div className="mb-5">
        <h2
          id="reviews-heading"
          className="font-[Montserrat] text-xl font-bold text-foreground"
        >
          Reseñas verificadas
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo de clientes que compraron
        </p>
      </div>

      {/* Bloque reviews-top: promedio + distribución */}
      <div className="grid gap-8 sm:grid-cols-[1fr_1.6fr] items-center">
        {/* Rating big card */}
        <div className="rounded-[18px] border border-border bg-muted/40 px-3 py-[18px] text-center">
          {rating.average !== null ? (
            <>
              <div
                className="font-[Montserrat] text-[56px] font-extrabold leading-none tracking-tight text-foreground"
                aria-label={`Promedio ${rating.average.toFixed(1)}`}
              >
                {rating.average.toFixed(1)}
              </div>
              <div className="mt-1.5 flex justify-center">
                <StarRow rating={Math.round(rating.average)} />
              </div>
            </>
          ) : null}
          <div className="mt-2 text-[12px] font-medium text-muted-foreground">
            {rating.count} {rating.count === 1 ? "reseña verificada" : "reseñas verificadas"}
          </div>
        </div>

        {/* Barras de distribución */}
        {rating.distribution && (
          <div>
            {STARS.map((star) => {
              const count = rating.distribution![String(star) as keyof typeof rating.distribution] ?? 0;
              const pct = distTotal > 0 ? (count / distTotal) * 100 : 0;
              return (
                <div
                  key={star}
                  className="mb-2 grid items-center gap-2.5"
                  style={{ gridTemplateColumns: "28px 1fr 40px" }}
                >
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {star} ★
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #f0a118, #facc15)",
                      }}
                    />
                  </div>
                  <span className="text-right text-[12px] font-medium text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filtros por estrella */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-[18px]">
        <span className="mr-1.5 self-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Filtrar
        </span>

        {/* Botón "Todas" */}
        <button
          type="button"
          onClick={() => handleStarFilter(null)}
          className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
            activeStar === null
              ? "border-primary/30 bg-primary/10 font-semibold text-primary"
              : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/10 hover:font-semibold hover:text-primary"
          }`}
        >
          Todas ({data.total})
        </button>

        {/* Botones por estrella (solo si count > 0) */}
        {STARS.map((star) => {
          const count = rating.distribution
            ? (rating.distribution[String(star) as keyof typeof rating.distribution] ?? 0)
            : 0;
          if (count === 0) return null;
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarFilter(star)}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                activeStar === star
                  ? "border-primary/30 bg-primary/10 font-semibold text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-primary/10 hover:font-semibold hover:text-primary"
              }`}
            >
              {star}★ ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de reseñas */}
      <div className="mt-1">
        {visibleItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay reseñas con ese filtro.
          </p>
        ) : (
          visibleItems.map((review, idx) => {
            const isExpanded = expandedId === review.id;
            return (
              <article
                key={review.id}
                className={`py-[18px] ${idx === 0 ? "border-t-0 pt-1" : "border-t border-border"}`}
              >
                {/* Cabecera: nombre + fecha + tag B2B */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {review.author_display}
                    </p>
                    <div className="mt-1">
                      <StarRow rating={review.rating} />
                    </div>
                    {review.is_b2b_order && (
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/25">
                        Empresa
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                {/* Comentario */}
                <div className="mt-2.5">
                  {review.comment ? (
                    <>
                      <p
                        className={`text-[14px] leading-relaxed text-foreground ${
                          !isExpanded ? "line-clamp-4" : ""
                        }`}
                      >
                        {review.comment}
                      </p>
                      {review.comment.length > 160 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : review.id)
                          }
                          className="mt-1 text-[12px] font-medium text-primary hover:text-primary/80"
                        >
                          {isExpanded ? "Ver menos" : "Ver más"}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/50">
                      Sin comentario.
                    </p>
                  )}
                </div>

                {/* Reply card (Fase 2) */}
                {review.reply && (
                  <div className="mt-3 rounded-r-xl border-l-[3px] border-primary bg-muted/50 px-3.5 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                      <MessageSquare size={13} aria-hidden="true" />
                      Respuesta de {providerName}
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground">
                      {review.reply.text}
                    </p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Ver más */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          >
            Ver más reseñas ({filteredItems.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </section>
  );
}
