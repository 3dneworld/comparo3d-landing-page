// ProfileReviews.tsx — Carrusel Airbnb-style de reseñas
import { useState } from "react";
import { Star } from "lucide-react";
import type { ProviderReviews } from "../types";

interface Props {
  data: ProviderReviews;
  providerId: number;
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

export function ProfileReviews({ data, providerId: _providerId }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (data.total === 0) {
    return (
      <section className="py-10 text-center" aria-label="Reseñas">
        <p className="text-sm text-muted-foreground">
          Aún no hay reseñas. Sé el primero en cotizar.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mt-10"
    >
      <div className="mb-4 flex items-baseline gap-3">
        <h2
          id="reviews-heading"
          className="font-[Montserrat] text-xl font-bold text-foreground"
        >
          Reseñas
        </h2>
        <span className="text-sm text-muted-foreground">
          {data.total} {data.total === 1 ? "reseña" : "reseñas"}
        </span>
      </div>

      {/* Carrusel scroll-snap */}
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {data.items.map((review) => {
          const isExpanded = expandedId === review.id;
          return (
            <article
              key={review.id}
              style={{ scrollSnapAlign: "start", minWidth: "280px", maxWidth: "320px" }}
              className="flex-shrink-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <StarRow rating={review.rating} />
              <div className="mt-2">
                {review.comment ? (
                  <>
                    <p
                      className={`text-sm leading-relaxed text-muted-foreground ${
                        !isExpanded ? "line-clamp-4" : ""
                      }`}
                    >
                      &ldquo;{review.comment}&rdquo;
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
                  <p className="text-sm text-muted-foreground/50 italic">
                    Sin comentario.
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    — {review.author_display}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(review.created_at)}
                  </p>
                </div>
                {review.is_b2b_order && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Empresa
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
