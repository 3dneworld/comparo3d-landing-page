import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  Camera,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Star,
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

// Paleta de tonos para los headers gradiente de cada card (espejo del mock v2).
const CARD_HUES = [220, 200, 240, 160, 280, 190];

function gradientForHue(hue: number) {
  return `linear-gradient(135deg, hsl(${hue} 55% 40%), hsl(${hue + 20} 65% 55%))`;
}

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

function PortfolioImage({ item, hue }: { item: DashboardPortfolioItem; hue: number }) {
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
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: gradientForHue(hue) }}
    >
      <Box className="h-11 w-11 text-white/55" />
    </div>
  );
}

function PortfolioCard({
  item,
  index,
  onDelete,
  isDeleting,
}: {
  item: DashboardPortfolioItem;
  index: number;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const hue = CARD_HUES[index % CARD_HUES.length];

  return (
    <article className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.05]">
      <div className="relative h-[150px]">
        <PortfolioImage item={item} hue={hue} />
        <div className="absolute right-2.5 top-2.5">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] font-bold leading-none tracking-[0.04em] text-white backdrop-blur-sm">
            {projectTypeLabel(item.project_type)}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="font-[Montserrat] text-[15px] font-bold leading-snug text-white">
          {safeText(item.description, "Trabajo sin descripcion")}
        </h3>
        <div className="flex flex-wrap gap-2">
          <DashboardStatePill tone="info">{safeText(item.technology, "Tecnologia")}</DashboardStatePill>
          {item.client_industry ? (
            <DashboardStatePill tone="success">{item.client_industry}</DashboardStatePill>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-white/45">Creado {formatDateTime(item.created_at)}</p>
          <div className="flex flex-wrap gap-2">
            {isExternalImage(item.photo_path) ? (
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-xl border-white/15 bg-white/10 px-3 text-sm text-white hover:bg-white/20"
              >
                <a href={item.photo_path || "#"} target="_blank" rel="noreferrer">
                  Abrir
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-rose-400/30 bg-rose-500/10 px-3 text-sm text-rose-300 hover:bg-rose-500/20"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar
            </Button>
          </div>
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
            className="h-10 rounded-xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/20"
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
        <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
          <div className="aspect-[4/3]">
            <PortfolioImage item={previewItem} hue={CARD_HUES[0]} />
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
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        variant="dark"
        eyebrow="REPUTACIÓN VISUAL"
        title="Portfolio"
        description="Mostrá tus mejores trabajos. Los clientes ven tu portfolio al comparar proveedores."
        metaPills={
          <>
            <DashboardStatePill tone={items.length ? "info" : "muted"}>
              {items.length} trabajos publicados
            </DashboardStatePill>
            {isFetching ? <DashboardStatePill tone="warning">Actualizando</DashboardStatePill> : null}
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-white/15 bg-white/10 px-4 text-white hover:bg-white/20"
              onClick={onRefresh}
              disabled={isFetching || isSaving}
            >
              {isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Recargar
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              onClick={onShowForm}
              disabled={showForm || isSaving}
            >
              <Plus className="h-4 w-4" />
              Agregar trabajo
            </Button>
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-[1.25rem] border border-primary/25 bg-primary/[0.08] px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Star className="h-4 w-4" />
        </div>
        <p className="text-sm leading-relaxed text-white/70">
          Proveedores con 6+ trabajos reciben un 60% más de clics en el marketplace. Un portfolio sólido es tu mejor
          vendedor silencioso — sin costo extra.
        </p>
      </div>

      {showForm ? (
        <PortfolioForm
          form={form}
          onChange={onFormChange}
          onSave={onSave}
          onCancel={onHideForm}
          isSaving={isSaving}
        />
      ) : null}

      {items.length ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <PortfolioCard
                key={item.id}
                item={item}
                index={index}
                onDelete={() => onDelete(item)}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>

          <div className="rounded-[1.25rem] border border-dashed border-white/15 bg-white/[0.025] px-6 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="h-6 w-6" />
            </div>
            <h4 className="mt-4 font-[Montserrat] text-lg font-bold text-white">Agregá más trabajos</h4>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-white/55">
              Apuntá a 6+ trabajos representativos. Incluí proyectos B2B, series y prototipos para mostrar tu rango
              completo.
            </p>
            <Button
              type="button"
              className="mx-auto mt-5 flex h-10 rounded-xl bg-gradient-primary px-5 text-primary-foreground shadow-cta hover:opacity-95"
              onClick={onShowForm}
              disabled={showForm || isSaving}
            >
              <Plus className="h-4 w-4" />
              Agregar trabajo
            </Button>
          </div>
        </>
      ) : (
        <DashboardEmptyState
          title="Sin trabajos en portfolio"
          description="Carga fotos de trabajos reales para que el proveedor tenga una ficha mas confiable."
          icon={<Search className="h-6 w-6" />}
          className="min-h-[420px]"
        />
      )}
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
