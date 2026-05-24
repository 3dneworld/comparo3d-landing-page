import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, PackageCheck, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  confirmAllStock,
  fetchMarketplacePromedios,
  fetchProviderMaterials,
  updateProviderMaterials,
} from "@/features/provider-dashboard/api";
import { AntiBypassBanner } from "@/features/provider-dashboard/components/AntiBypassBanner";
import { CatalogoComunPanel } from "@/features/provider-dashboard/components/CatalogoComunPanel";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import { DashboardStatePill } from "@/features/provider-dashboard/components/DashboardStatePill";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { MaterialCard } from "@/features/provider-dashboard/components/MaterialCard";
import { MaterialModal, type ModalMode } from "@/features/provider-dashboard/components/MaterialModal";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import type {
  DashboardMaterial,
  DashboardMaterialFormPayload,
} from "@/features/provider-dashboard/types";

const STALE_THRESHOLD_DAYS = 14;

interface FlatRow {
  key: string;
  materialId: number;
  material_code: string;
  color_hex: string;
  color_name: string;
  in_stock: boolean;
  activo: boolean;
  last_confirmed_at: string | null;
  precio_kg: number;
}

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 999;
  return Math.floor((Date.now() - ts) / (24 * 3600 * 1000));
}

function materialToPayload(m: DashboardMaterial): DashboardMaterialFormPayload {
  return {
    material_code: m.material_code,
    activo: Boolean(m.activo),
    precio_hora: Number(m.precio_hora) || 0,
    in_stock: Boolean(m.in_stock),
    allow_custom_color: Boolean(m.allow_custom_color),
    trabajo_minimo_override: m.trabajo_minimo_override ?? null,
    colores: (m.colores || []).map((c) => ({
      color_name: c.color_name || "",
      color_hex: c.color_hex || "#78716c",
      activo: Boolean(c.activo),
      in_stock: Boolean(c.in_stock),
    })),
  };
}

export function ProviderMaterialsView() {
  const { providerId } = useProviderDashboardSession();
  const qc = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const materialsQuery = useQuery({
    queryKey: ["provider-dashboard", "materials", providerId],
    queryFn: () => fetchProviderMaterials(providerId!),
    enabled: providerId != null,
    staleTime: 30_000,
  });

  const promediosQuery = useQuery({
    queryKey: ["marketplace", "precios-promedio"],
    queryFn: fetchMarketplacePromedios,
    staleTime: 5 * 60_000,
  });

  const materials = useMemo<DashboardMaterial[]>(
    () => materialsQuery.data?.materials ?? [],
    [materialsQuery.data]
  );

  const marketAverages = promediosQuery.data ?? {};
  const marketAveragesSimple = useMemo<Record<string, number | undefined>>(() => {
    const out: Record<string, number | undefined> = {};
    for (const [k, v] of Object.entries(marketAverages)) {
      out[k] = v?.avg_price_kg;
    }
    return out;
  }, [marketAverages]);

  const flat = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    for (const m of materials) {
      const precio = Number(m.precio_hora) || 0;
      if (!m.colores || m.colores.length === 0) {
        rows.push({
          key: `m-${m.id}`,
          materialId: m.id,
          material_code: m.material_code,
          color_hex: "#78716c",
          color_name: "",
          in_stock: Boolean(m.in_stock),
          activo: Boolean(m.activo),
          last_confirmed_at: m.last_confirmed_at ?? null,
          precio_kg: precio,
        });
      } else {
        for (const c of m.colores) {
          rows.push({
            key: `m-${m.id}-c-${c.id}`,
            materialId: m.id,
            material_code: m.material_code,
            color_hex: c.color_hex || "#78716c",
            color_name: c.color_name || "",
            in_stock: Boolean(c.in_stock),
            activo: Boolean(m.activo) && Boolean(c.activo),
            last_confirmed_at: c.last_confirmed_at ?? m.last_confirmed_at ?? null,
            precio_kg: precio,
          });
        }
      }
    }
    return rows;
  }, [materials]);

  const counts = useMemo(() => {
    let available = 0;
    let stale = 0;
    let overpriced = 0;
    for (const r of flat) {
      if (r.activo && r.in_stock) {
        available += 1;
        if (daysSince(r.last_confirmed_at) >= STALE_THRESHOLD_DAYS) stale += 1;
      }
      const avg = marketAveragesSimple[r.material_code];
      if (avg && r.precio_kg > 0 && (r.precio_kg - avg) / avg > 0.1) overpriced += 1;
    }
    return { available, stale, overpriced };
  }, [flat, marketAveragesSimple]);

  const existingNames = useMemo(
    () => Array.from(new Set(materials.map((m) => m.material_code))),
    [materials]
  );

  const confirmStockMut = useMutation({
    mutationFn: async () => {
      if (!providerId) throw new Error("Sesión inválida");
      return confirmAllStock(providerId);
    },
    onSuccess: (res) => {
      toast.success(`Stock confirmado (${res.materials_updated} mat., ${res.colors_updated} colores)`);
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "materials", providerId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo confirmar el stock"),
  });

  const toggleStockMut = useMutation({
    mutationFn: async ({ materialId, next }: { materialId: number; next: boolean }) => {
      if (!providerId) throw new Error("Sesión inválida");
      const payloads = materials.map((m) => {
        const base = materialToPayload(m);
        if (m.id === materialId) {
          return {
            ...base,
            in_stock: next,
            colores: base.colores.map((c) => ({ ...c, in_stock: next })),
          };
        }
        return base;
      });
      return updateProviderMaterials(providerId, { materiales: payloads });
    },
    onSuccess: () => {
      toast.success("Stock actualizado");
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "materials", providerId] });
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar"),
  });

  if (materialsQuery.error) {
    return (
      <DashboardErrorState
        title="No pudimos cargar Materiales"
        description="La base del dashboard está lista, pero la lectura real de materiales no se pudo recuperar."
      />
    );
  }

  if (materialsQuery.isLoading) {
    return (
      <DashboardLoadingState
        title="Armando el catálogo de materiales"
        description="Conectando precios, stock y colores con el snapshot real."
      />
    );
  }

  if (!materialsQuery.data?.provider) {
    return (
      <DashboardEmptyState
        title="No encontramos datos de materiales"
        description="La sesión está activa, pero no recibimos un snapshot válido."
        icon={<AlertTriangle className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Catálogo operativo"
        title="Materiales y stock"
        description="Cada (material, color) es una tarjeta. Confirmá stock cada 14 días para mantenerte cotizable."
        metaPills={
          <>
            <DashboardStatePill tone={counts.available ? "success" : "warning"}>
              {counts.available} disponibles
            </DashboardStatePill>
            <DashboardStatePill tone={counts.stale ? "warning" : "muted"}>
              {counts.stale} desactualizados
            </DashboardStatePill>
            <DashboardStatePill tone={counts.overpriced ? "danger" : "muted"}>
              {counts.overpriced} caros vs red
            </DashboardStatePill>
          </>
        }
        actions={
          <>
            {counts.stale > 0 && providerId != null ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => confirmStockMut.mutate()}
                disabled={confirmStockMut.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirmStockMut.isPending ? "Confirmando…" : "Confirmar todo el stock"}
              </Button>
            ) : null}
            <Button type="button" onClick={() => setModalMode({ kind: "new" })}>
              <Plus className="h-4 w-4" />
              Agregar material
            </Button>
          </>
        }
      />

      <AntiBypassBanner />

      <CatalogoComunPanel
        existingNames={existingNames}
        marketAverages={marketAveragesSimple}
        onPick={(preset, avg) =>
          setModalMode({
            kind: "preset",
            data: {
              name: preset.name,
              type: preset.type,
              color_hex: preset.color_hex,
              color_name: preset.color_name,
              avg_price: avg,
            },
          })
        }
      />

      {flat.length === 0 ? (
        <DashboardEmptyState
          title="Todavía no cargaste materiales"
          description="Sumá uno desde el catálogo común o creá uno custom."
          icon={<PackageCheck className="h-6 w-6" />}
          actionLabel="Agregar material"
          onAction={() => setModalMode({ kind: "new" })}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {flat.map((row) => (
            <MaterialCard
              key={row.key}
              id={row.materialId}
              material_code={row.material_code}
              color_hex={row.color_hex}
              color_name={row.color_name}
              in_stock={row.in_stock}
              last_confirmed_at={row.last_confirmed_at}
              precio_kg={row.precio_kg}
              activo={row.activo}
              market_avg={marketAveragesSimple[row.material_code]}
              onEdit={() => setModalMode({ kind: "edit", id: row.materialId })}
              onToggleStock={(next) => toggleStockMut.mutate({ materialId: row.materialId, next })}
            />
          ))}
          <button
            type="button"
            onClick={() => setModalMode({ kind: "new" })}
            style={{
              minHeight: 220,
              borderRadius: 16,
              border: "2px dashed var(--c3d-card-border, hsl(220,15%,80%))",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "var(--c3d-text-muted, hsl(220,10%,46%))",
              font: "700 13px/1 Montserrat,sans-serif",
            }}
          >
            <Plus size={28} />
            Agregar material
          </button>
        </div>
      )}

      {modalMode && providerId != null ? (
        <MaterialModal
          mode={modalMode}
          providerId={providerId}
          materials={materials}
          marketAverages={marketAverages}
          onClose={() => setModalMode(null)}
          onSaved={() => setModalMode(null)}
        />
      ) : null}
    </div>
  );
}
