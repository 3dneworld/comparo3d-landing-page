import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareReply,
  MessageSquareText,
  RefreshCcw,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import {
  fetchProviderReviews,
  updateProviderReviewReply,
} from "@/features/provider-dashboard/api";
import { DashboardMetricCard } from "@/features/provider-dashboard/components/DashboardMetricCard";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardPanel } from "@/features/provider-dashboard/components/DashboardPanel";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type { DashboardProviderReview } from "@/features/provider-dashboard/types";

const REPLY_MAX = 1000;

function safeText(value?: string | null, fallback = "Sin comentario") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatNumber(value?: number | null, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return "Sin dato";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value));
}

function StarRow({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            index < value ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-muted-foreground/40"
          }
        />
      ))}
    </div>
  );
}

function ReviewReplyCard({
  review,
  isPending,
  onSubmit,
}: {
  review: DashboardProviderReview;
  isPending: boolean;
  onSubmit: (reviewId: number, text: string) => void;
}) {
  const existingReply = review.reply?.text ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(existingReply);
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
  const hasReply = Boolean(review.reply?.text);
  const showForm = !hasReply || isEditing;

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) {
      toast.error("La respuesta no puede estar vacia.");
      return;
    }
    onSubmit(review.id, text);
    setIsEditing(false);
  };

  return (
    <div className="rounded-[1.15rem] border border-border/70 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StarRow rating={rating} />
            <DashboardStatePill tone="warning">{rating}/5</DashboardStatePill>
            {review.is_b2b_order ? <DashboardStatePill tone="info">B2B</DashboardStatePill> : null}
            {hasReply ? (
              <DashboardStatePill tone="success">Respondida</DashboardStatePill>
            ) : (
              <DashboardStatePill tone="muted">Sin responder</DashboardStatePill>
            )}
          </div>
          <p className="text-sm leading-relaxed text-foreground">{safeText(review.comment)}</p>
        </div>
        <p className="text-xs text-muted-foreground">{formatDateTime(review.created_at)}</p>
      </div>

      {hasReply && !isEditing ? (
        <div className="mt-4 rounded-[1rem] border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <MessageSquareReply className="h-4 w-4" />
              Tu respuesta
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setDraft(review.reply?.text ?? "");
                setIsEditing(true);
              }}
              disabled={isPending}
            >
              Editar
            </Button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{review.reply?.text}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(review.reply?.created_at)}</p>
        </div>
      ) : null}

      {showForm ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, REPLY_MAX))}
            placeholder="Escribi una respuesta publica para este cliente..."
            rows={3}
            maxLength={REPLY_MAX}
            disabled={isPending}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {draft.trim().length}/{REPLY_MAX}
            </span>
            <div className="flex items-center gap-2">
              {hasReply && isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl px-3 text-sm"
                  onClick={() => {
                    setDraft(review.reply?.text ?? "");
                    setIsEditing(false);
                  }}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-9 rounded-xl px-4 text-sm"
                onClick={handleSubmit}
                disabled={isPending || !draft.trim()}
              >
                {isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquareReply className="h-4 w-4" />
                )}
                {hasReply ? "Guardar respuesta" : "Responder"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProviderReviewsView() {
  const { providerId } = useProviderDashboardSession();
  const queryClient = useQueryClient();
  const [pendingReviewId, setPendingReviewId] = useState<number | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ["provider-dashboard", "reviews", providerId],
    queryFn: () => fetchProviderReviews(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, text }: { reviewId: number; text: string }) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return updateProviderReviewReply(providerId, reviewId, text);
    },
    onMutate: ({ reviewId }) => {
      setPendingReviewId(reviewId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "reviews", providerId] });
      toast.success("Respuesta publicada");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos guardar la respuesta.";
      toast.error(message);
    },
    onSettled: () => {
      setPendingReviewId(null);
    },
  });

  const reviews = useMemo(() => reviewsQuery.data?.items ?? [], [reviewsQuery.data]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const answered = reviews.filter((review) => Boolean(review.reply?.text)).length;
    const ratingValues = reviews
      .map((review) => Number(review.rating))
      .filter((value) => !Number.isNaN(value) && value > 0);
    const avg = ratingValues.length
      ? ratingValues.reduce((acc, value) => acc + value, 0) / ratingValues.length
      : null;
    return { total, answered, pending: total - answered, avg };
  }, [reviews]);

  if (reviewsQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar las resenas"
        description="La ruta esta lista, pero el endpoint de resenas no respondio correctamente."
      />
    );
  }

  if (reviewsQuery.isLoading) {
    return (
      <DashboardLoadingState
        title="Cargando resenas"
        description="Estamos trayendo los comentarios de tus clientes."
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Reputacion"
        title="Resenas de clientes"
        description="Responde publicamente a las resenas de tus pedidos. Tu respuesta se muestra en tu perfil publico."
        meta={
          <>
            <DashboardStatePill tone="info">{stats.total} resenas</DashboardStatePill>
            <DashboardStatePill tone={stats.pending ? "warning" : "success"}>
              {stats.pending} sin responder
            </DashboardStatePill>
            {reviewsQuery.isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        actions={
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={() => void reviewsQuery.refetch()}
            disabled={reviewsQuery.isFetching}
          >
            {reviewsQuery.isFetching ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Actualizar
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <DashboardMetricCard
          title="Rating promedio"
          value={stats.avg != null ? formatNumber(stats.avg, 2) : "Sin rating"}
          support={`${stats.total} resenas visibles`}
          icon={<Star className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Respondidas"
          value={String(stats.answered)}
          support="Resenas con respuesta publicada."
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Pendientes"
          value={String(stats.pending)}
          support="Resenas que todavia no respondiste."
          icon={<MessageSquareText className="h-5 w-5" />}
        />
      </section>

      <DashboardPanel
        title="Comentarios de clientes"
        description="Responder con cordialidad mejora la confianza de futuros clientes."
      >
        {reviews.length ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewReplyCard
                key={review.id}
                review={review}
                isPending={replyMutation.isPending && pendingReviewId === review.id}
                onSubmit={(reviewId, text) => replyMutation.mutate({ reviewId, text })}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            title="Sin resenas todavia"
            description="Las resenas aparecen despues de que tus clientes califican pedidos completados."
            icon={<MessageSquareText className="h-6 w-6" />}
          />
        )}
      </DashboardPanel>
    </div>
  );
}
