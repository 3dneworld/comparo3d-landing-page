import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Palette,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  addProviderPortfolioItem,
  deleteProviderPortfolioItem,
  fetchProviderPortfolio,
} from "@/features/provider-dashboard/api";
import { DashboardField } from "@/features/provider-dashboard/components/DashboardField";
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
import type { DashboardPortfolioFormPayload, DashboardPortfolioItem } from "@/features/provider-dashboard/types";
import { cn } from "@/lib/utils";

type PortfolioFormState = {
  photo_path: string;
  description: string;
  technology: string;
  project_type: string;
  client_industry: string;
};

const emptyForm: PortfolioFormState = {
  photo_path: "",
  description: "",
  technology: "FDM",
  project_type: "prototipos",
  client_industry: "",
};

const technologyOptions = ["FDM", "SLA", "SLS", "DLP"];

const projectTypeOptions = [
  { value: "consumer", label: "Consumer" },
  { value: "b2b", label: "B2B" },
  { value: "prototipos", label: "Prototipos" },
  { value: "produccion", label: "Produccion" },
  { value: "arte", label: "Arte / diseno" },
];

const projectTypeLabels: Record<string, string> = Object.fromEntries(
  projectTypeOptions.map((option) => [option.value, option.label])
);

function safeText(value?: string | number | null, fallback = "Sin dato") {
  if (value == null || value === "") return fallback;
  return String(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function isSeedImage(path?: string | null) {
  return Boolean(path && path.startsWith("seed://"));
}

function isExternalImage(path?: string | null) {
  if (!path) return false;
  return /^https?:\/\//i.test(path) || path.startsWith("/");
}

function projectTypeLabel(value?: string | null) {
  if (!value) return "Sin tipo";
  return projectTypeLabels[value] ?? value.replaceAll("_", " ");
}

function buildPortfolioPayload(form: PortfolioFormState): DashboardPortfolioFormPayload {
  const payload = {
    photo_path: form.photo_path.trim(),
    description: form.description.trim(),
    technology: form.technology.trim(),
    project_type: form.project_type.trim(),
    client_industry: form.client_industry.trim(),
  };

  if (!payload.photo_path) throw new Error("Carga una URL o path de foto.");
  if (!payload.description) throw new Error("Carga una descripcion del trabajo.");
  if (!payload.technology) throw new Error("Elegi una tecnologia.");
  if (!payload.project_type) throw new Error("Elegi un tipo de proyecto.");

  return payload;
}

function portfolioScore(items: DashboardPortfolioItem[]) {
  const countScore = Math.min(40, items.length * 8);
  const imageScore = Math.min(30, items.filter((item) => isExternalImage(item.photo_path)).length * 6);
  const varietyScore = Math.min(30, new Set(items.map((item) => item.technology).filter(Boolean)).size * 10);
  return countScore + imageScore + varietyScore;
}

function PortfolioImage({ item }: { item: DashboardPortfolioItem }) {
  const path = item.photo_path || "";

  if (isExternalImage(path)) {
    return (
      <img
        src={path}
        alt={item.description || "Trabajo de portfolio"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/60 text-muted-foreground">
      <Camera className="h-9 w-9" />
      <span className="px-4 text-center text-xs font-semibold uppercase tracking-[0.12em]">
        {isSeedImage(path) ? "Seed visual" : "Sin imagen publica"}
      </span>
    </div>
  );
}

function PortfolioCard({
  item,
  onDelete,
  isDeleting,
}: {
  item: DashboardPortfolioItem;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white shadow-card">
      <div className="aspect-[4/3] bg-muted">
        <PortfolioImage item={item} />
      </div>
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <DashboardStatePill tone="info">{safeText(item.technology, "Tecnologia")}</DashboardStatePill>
            <DashboardStatePill tone="muted">{projectTypeLabel(item.project_type)}</DashboardStatePill>
            {item.client_industry ? <DashboardStatePill tone="success">{item.client_industry}</DashboardStatePill> : null}
          </div>
          <p className="min-h-[3rem] text-sm font-medium leading-relaxed text-foreground">
            {safeText(item.description, "Trabajo sin descripcion")}
          </p>
          <p className="text-xs text-muted-foreground">Creado {formatDateTime(item.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isExternalImage(item.photo_path) ? (
            <Button asChild variant="outline" className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted">
              <a href={item.photo_path || "#"} target="_blank" rel="noreferrer">
                Abrir imagen
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-rose-200 bg-white/90 px-4 text-rose-700 hover:bg-rose-50"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Eliminar
          </Button>
        </div>
      </div>
    </article>
  );
}

function PortfolioForm({
  form,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: {
  form: PortfolioFormState;
  onChange: (field: keyof PortfolioFormState, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const previewItem: DashboardPortfolioItem = {
    id: 0,
    photo_path: form.photo_path,
    description: form.description || "Vista previa del trabajo",
    technology: form.technology,
    project_type: form.project_type,
    client_industry: form.client_industry,
  };

  return (
    <DashboardPanel
      title="Nuevo trabajo"
      description="Carga una pieza fuerte del proveedor. Hoy el backend recibe URL/path de imagen, no upload binario."
      headerAction={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted">
          <div className="aspect-[4/3]">
            <PortfolioImage item={previewItem} />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <DashboardField label="URL o path de foto" htmlFor="portfolio-photo" className="md:col-span-2">
            <Input
              id="portfolio-photo"
              value={form.photo_path}
              onChange={(event) => onChange("photo_path", event.target.value)}
              className="h-11 rounded-xl border-border/80 bg-white"
              placeholder="https://..."
              disabled={isSaving}
            />
          </DashboardField>
          <DashboardField label="Descripcion" htmlFor="portfolio-description" className="md:col-span-2" hint="Maximo backend: 150 caracteres.">
            <Input
              id="portfolio-description"
              value={form.description}
              maxLength={150}
              onChange={(event) => onChange("description", event.target.value)}
              className="h-11 rounded-xl border-border/80 bg-white"
              placeholder="Prototipo funcional, pieza final, serie corta..."
              disabled={isSaving}
            />
          </DashboardField>
          <DashboardField label="Tecnologia" htmlFor="portfolio-technology">
            <select
              id="portfolio-technology"
              value={form.technology}
              onChange={(event) => onChange("technology", event.target.value)}
              className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isSaving}
            >
              {technologyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </DashboardField>
          <DashboardField label="Tipo de proyecto" htmlFor="portfolio-project-type">
            <select
              id="portfolio-project-type"
              value={form.project_type}
              onChange={(event) => onChange("project_type", event.target.value)}
              className="h-11 w-full rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isSaving}
            >
              {projectTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </DashboardField>
          <DashboardField label="Industria del cliente" htmlFor="portfolio-industry" className="md:col-span-2" hint="Opcional. Maximo backend: 60 caracteres.">
            <Input
              id="portfolio-industry"
              value={form.client_industry}
              maxLength={60}
              onChange={(event) => onChange("client_industry", event.target.value)}
              className="h-11 rounded-xl border-border/80 bg-white"
              placeholder="Automotriz, salud, retail..."
              disabled={isSaving}
            />
          </DashboardField>
        </div>
      </div>
    </DashboardPanel>
  );
}

function PortfolioContent({
  items,
  form,
  showForm,
  onShowForm,
  onHideForm,
  onFormChange,
  onSave,
  onDelete,
  onRefresh,
  isSaving,
  deletingId,
  isFetching,
}: {
  items: DashboardPortfolioItem[];
  form: PortfolioFormState;
  showForm: boolean;
  onShowForm: () => void;
  onHideForm: () => void;
  onFormChange: (field: keyof PortfolioFormState, value: string) => void;
  onSave: () => void;
  onDelete: (item: DashboardPortfolioItem) => void;
  onRefresh: () => void;
  isSaving: boolean;
  deletingId: number | null;
  isFetching: boolean;
}) {
  const byTechnology = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = item.technology || "Sin tecnologia";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [items]);
  const byProjectType = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = projectTypeLabel(item.project_type);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [items]);
  const score = portfolioScore(items);
  const realImages = items.filter((item) => isExternalImage(item.photo_path)).length;
  const topTechnology = Object.entries(byTechnology).sort((a, b) => b[1] - a[1])[0];
  const nextSteps = [
    items.length < 3 ? "Cargar al menos 3 trabajos fuertes para que el perfil publico tenga cuerpo." : null,
    realImages < items.length ? "Reemplazar placeholders o seeds por imagenes publicas cuando sea posible." : null,
    Object.keys(byTechnology).length < 2 ? "Mostrar variedad de tecnologia si el taller ofrece mas de un proceso." : null,
    !items.some((item) => item.client_industry) ? "Agregar industria del cliente en casos B2B o tecnicos." : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Vista editable"
        title="Portfolio de trabajos"
        description="Galeria real del proveedor para reforzar confianza y conversion cuando los clientes comparan opciones."
        meta={
          <>
            <DashboardStatePill tone={items.length ? "success" : "warning"}>{items.length}/50 trabajos</DashboardStatePill>
            <DashboardStatePill tone={realImages ? "info" : "muted"}>{realImages} imagenes publicas</DashboardStatePill>
            <DashboardStatePill tone={score >= 70 ? "success" : score >= 35 ? "warning" : "muted"}>Score {score}%</DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-border/80 bg-white/90 px-4 text-foreground hover:bg-muted"
              onClick={onRefresh}
              disabled={isFetching || isSaving}
            >
              {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Recargar
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              onClick={onShowForm}
              disabled={showForm || isSaving}
            >
              <Plus className="h-4 w-4" />
              Agregar trabajo
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard title="Trabajos cargados" value={String(items.length)} support="Maximo actual del endpoint: 50 items." icon={<ImageIcon className="h-5 w-5" />} />
        <DashboardMetricCard title="Imagenes reales" value={`${realImages}/${items.length}`} support="URLs o paths publicos listos para mostrar." icon={<Camera className="h-5 w-5" />} />
        <DashboardMetricCard title="Tecnologia principal" value={topTechnology?.[0] || "Pendiente"} support={topTechnology ? `${topTechnology[1]} trabajos cargados` : "Aun sin datos"} icon={<Layers3 className="h-5 w-5" />} />
        <DashboardMetricCard title="Confianza visual" value={`${score}%`} support="Lectura local: cantidad, imagenes y variedad." icon={<Sparkles className="h-5 w-5" />} />
      </section>

      {showForm ? (
        <PortfolioForm
          form={form}
          onChange={onFormChange}
          onSave={onSave}
          onCancel={onHideForm}
          isSaving={isSaving}
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Galeria visible"
          description="Trabajos ordenados desde el backend por fecha de carga."
        >
          {items.length ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {items.map((item) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onDelete={() => onDelete(item)}
                  isDeleting={deletingId === item.id}
                />
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              title="Sin trabajos en portfolio"
              description="Carga fotos de trabajos reales para que el proveedor tenga una ficha mas confiable."
              icon={<Search className="h-6 w-6" />}
              className="min-h-[420px]"
            />
          )}
        </DashboardPanel>

        <div className="space-y-6">
          <DashboardPanel title="Distribucion" description="Lectura rapida de variedad del portfolio.">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Por tecnologia</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(byTechnology).length ? (
                    Object.entries(byTechnology).map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3 text-sm">
                        <span className="font-medium text-foreground">{label}</span>
                        <DashboardStatePill tone="info">{count}</DashboardStatePill>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1rem] border border-dashed border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                      Sin tecnologias cargadas.
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Por tipo</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(byProjectType).length ? (
                    Object.entries(byProjectType).map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-background/70 px-4 py-3 text-sm">
                        <span className="font-medium text-foreground">{label}</span>
                        <DashboardStatePill tone="muted">{count}</DashboardStatePill>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1rem] border border-dashed border-border/80 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                      Sin tipos cargados.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="Proximos pasos" description="Mejoras que aumentan confianza del perfil.">
            {nextSteps.length ? (
              <div className="space-y-3">
                {nextSteps.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                El portfolio ya tiene buena cantidad, imagenes y variedad para reforzar la ficha publica.
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Frontera tecnica" description="Que hace esta migracion hoy.">
            <div className="space-y-3">
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                El backend actual acepta URL/path de imagen; la subida binaria de archivos queda para una fase posterior.
              </div>
              <div className="rounded-[1.15rem] border border-border/70 bg-background/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Este portfolio alimenta confianza publica; certificacion y reviews quedan como el siguiente bloque natural.
              </div>
            </div>
          </DashboardPanel>
        </div>
      </section>
    </div>
  );
}

export function ProviderPortfolioView() {
  const queryClient = useQueryClient();
  const { providerId } = useProviderDashboardSession();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PortfolioFormState>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const portfolioQuery = useQuery({
    queryKey: ["provider-dashboard", "portfolio", providerId],
    queryFn: () => fetchProviderPortfolio(providerId!),
    enabled: providerId != null,
    staleTime: 20_000,
  });

  const invalidatePortfolio = () => {
    void queryClient.invalidateQueries({ queryKey: ["provider-dashboard", "portfolio", providerId] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      return addProviderPortfolioItem(providerId, buildPortfolioPayload(form));
    },
    onSuccess: () => {
      toast.success("Trabajo agregado al portfolio");
      setForm(emptyForm);
      setShowForm(false);
      invalidatePortfolio();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar el trabajo.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: DashboardPortfolioItem) => {
      if (!providerId) throw new Error("No encontramos un proveedor valido.");
      setDeletingId(item.id);
      return deleteProviderPortfolioItem(providerId, item.id);
    },
    onSuccess: () => {
      toast.success("Trabajo eliminado");
      invalidatePortfolio();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No pudimos eliminar el trabajo.");
    },
    onSettled: () => setDeletingId(null),
  });

  const items = useMemo(() => portfolioQuery.data?.items || [], [portfolioQuery.data]);

  if (portfolioQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Portfolio"
        description="La ruta React esta lista, pero el endpoint real de portfolio no respondio correctamente."
      />
    );
  }

  if (portfolioQuery.isLoading || (portfolioQuery.isFetching && !portfolioQuery.data)) {
    return (
      <DashboardLoadingState
        title="Armando portfolio"
        description="Estamos conectando trabajos reales del proveedor con la nueva vista React."
      />
    );
  }

  if (!portfolioQuery.data) {
    return (
      <DashboardEmptyState
        title="No encontramos portfolio"
        description="La sesion esta activa, pero no recibimos una respuesta valida para esta vista."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <PortfolioContent
      items={items}
      form={form}
      showForm={showForm}
      onShowForm={() => setShowForm(true)}
      onHideForm={() => {
        setForm(emptyForm);
        setShowForm(false);
      }}
      onFormChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
      onSave={() => void saveMutation.mutateAsync()}
      onDelete={(item) => {
        if (!window.confirm("Eliminar este trabajo del portfolio?")) return;
        void deleteMutation.mutateAsync(item);
      }}
      onRefresh={() => void portfolioQuery.refetch()}
      isSaving={saveMutation.isPending}
      deletingId={deletingId}
      isFetching={portfolioQuery.isFetching}
    />
  );
}
