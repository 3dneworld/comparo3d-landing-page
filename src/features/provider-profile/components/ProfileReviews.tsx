// ProfileReviews.tsx - Carrusel de resenas del perfil publico
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
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
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(4, data.items.length),
  );
  const carouselRef = useRef<HTMLDivElement>(null);

  if (data.total === 0) {
    return (
      <section className="py-10 text-center" aria-label="Reseñas">
        <p className="text-sm text-muted-foreground">
          Aun no hay reseñas. Se el primero en cotizar.
        </p>
      </section>
    );
  }

  const showMore = visibleCount < data.items.length;

  return (
    <section aria-labelledby="reviews-heading" className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
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

        {data.items.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Reseñas anteriores"
              onClick={() =>
                carouselRef.current?.scrollBy({
                  left: -340,
                  behavior: "smooth",
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Reseñas siguientes"
              onClick={() =>
                carouselRef.current?.scrollBy({
                  left: 340,
                  behavior: "smooth",
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto pb-4"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {data.items.slice(0, visibleCount).map((review) => {
          const isExpanded = expandedId === review.id;
          return (
            <article
              key={review.id}
              style={{
                scrollSnapAlign: "start",
                minWidth: "280px",
                maxWidth: "320px",
              }}
              className="flex-shrink-0 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-foreground">
                    {review.author_display}
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

              <div className="mt-3">
                <StarRow rating={review.rating} />
              </div>

              <div className="mt-3">
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
                        {isExpanded ? "Ver menos" : "Ver mas"}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm italic text-muted-foreground/50">
                    Sin comentario.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {showMore && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            aria-label="Ver mas reseñas"
            onClick={() =>
              setVisibleCount((count) => Math.min(count + 4, data.items.length))
            }
            className="rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
          >
            Ver mas
          </button>
        </div>
      )}
    </section>
  );
}
