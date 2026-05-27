import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, PackageCheck } from "lucide-react";

import { toast } from "@/components/ui/sonner";
import {
  fetchMarketplacePromedios,
  fetchProviderMaterials,
  updateProviderMaterials,
} from "@/features/provider-dashboard/api";
import { AntiBypassBanner } from "@/features/provider-dashboard/components/AntiBypassBanner";
import { CatalogoComunPanel } from "@/features/provider-dashboard/components/CatalogoComunPanel";
import { DashboardPageHeader } from "@/features/provider-dashboard/components/DashboardPageHeader";
import {
  DashboardEmptyState,
  DashboardErrorState,
  DashboardLoadingState,
} from "@/features/provider-dashboard/components/DashboardStates";
import { MaterialCard } from "@/features/provider-dashboard/components/MaterialCard";
import { MaterialModal, type ModalMode } from "@/features/provider-dashboard/components/MaterialModal";
import { useProviderDashboardSession } from "@/features/provider-dashboard/context/ProviderDashboardSessionContext";
import {
  MATERIAL_TYPES,
  QUOTE_COLOR_OPTIONS,
} from "@/features/provider-dashboard/data/catalogPresets";
import type {
  DashboardMaterial,
  DashboardMaterialColor,
  DashboardMaterialFormPayload,
} from "@/features/provider-dashboard/types";

function normalizeMaterialCode(value: string): string {
  const upper = value.trim().toUpperCase();
  if (upper.startsWith("TPU")) return "TPU";
  return upper;
}

function displayMaterialCode(value: string): string {
  const normalized = normalizeMaterialCode(value);
  return MATERIAL_TYPES.find((type) => type.toUpperCase() === normalized) ?? normalized;
}

function isAllowedMaterial(value: string): boolean {
  const normalized = normalizeMaterialCode(value);
  return MATERIAL_TYPES.some((type) => type.toUpperCase() === normalized);
}

function ensureDashboardColors(m: DashboardMaterial): DashboardMaterialColor[] {
  return QUOTE_COLOR_OPTIONS.map((color, index) => {
    const existing = (m.colores || []).find((c) => c.color_name?.toLowerCase() === color.value.toLowerCase());
    return {
      id: existing?.id ?? -1 * (index + 1),
      color_name: color.value,
      color_hex: color.hex,
      activo: 1,
      in_stock: Boolean(m.in_stock) && Boolean(existing?.activo) && Boolean(existing?.in_stock) ? 1 : 0,
      last_confirmed_at: existing?.last_confirmed_at ?? m.last_confirmed_at ?? null,
    };
  });
}

function hasAvailableColor(m: DashboardMaterial): boolean {
  return ensureDashboardColors(m).some((color) => Boolean(color.activo) && Boolean(color.in_stock));
}

function effectiveMaterialStock(m: DashboardMaterial): boolean {
  return Boolean(m.in_stock) && hasAvailableColor(m);
}

function materialToPayload(m: DashboardMaterial): DashboardMaterialFormPayload | null {
  if (!isAllowedMaterial(m.material_code)) return null;
  const effectiveStock = effectiveMaterialStock(m);
  return {
    material_code: displayMaterialCode(m.material_code),
    activo: Boolean(m.activo),
    precio_hora: Number(m.precio_hora) || 0,
    in_stock: effectiveStock,
    allow_custom_color: false,
    trabajo_minimo_override: m.trabajo_minimo_override ?? null,
    colores: ensureDashboardColors(m).map((c) => ({
      color_name: c.color_name || "",
      color_hex: c.color_hex || "#78716c",
      activo: true,
      in_stock: Boolean(c.in_stock),
    })),
  };
}

function replaceMaterialPayload(
  materials: DashboardMaterial[],
  targetId: number,
  updater: (payload: DashboardMaterialFormPayload) => DashboardMaterialFormPayload
): DashboardMaterialFormPayload[] {
  return materials
    .map((m) => {
      const payload = materialToPayload(m);
      if (!payload) return null;
      return m.id === targetId ? updater(payload) : payload;
    })
    .filter((payload): payload is DashboardMaterialFormPayload => payload != null);
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
      out[displayMaterialCode(k)] = v?.avg_price_kg;
    }
    return out;
  }, [marketAverages]);

  const visibleMaterials = useMemo<DashboardMaterial[]>(() => {
    const byCode = new Map<string, DashboardMaterial>();
    for (const material of materials) {
      if (!isAllowedMaterial(material.material_code)) continue;
      const code = displayMaterialCode(material.material_code);
      if (!byCode.has(code)) {
        byCode.set(code, {
          ...material,
          material_code: code,
          in_stock: effectiveMaterialStock(material) ? 1 : 0,
          colores: ensureDashboardColors({ ...material, material_code: code }),
        });
      }
    }
    return MATERIAL_TYPES.map((type) => byCode.get(type)).filter((m): m is DashboardMaterial => Boolean(m));
  }, [materials]);

  const existingNames = useMemo(
    () => visibleMaterials.map((m) => displayMaterialCode(m.material_code)),
    [visibleMaterials]
  );

  const toggleMaterialMut = useMutation({
    mutationFn: async ({ materialId, next }: { materialId: number; next: boolean }) => {
      if (!providerId) throw new Error("Sesión inválida");
      const payloads = replaceMaterialPayload(materials, materialId, (base) => ({
        ...base,
        in_stock: next,
        colores: base.colores.map((c) => ({ ...c, in_stock: next })),
      }));
      return updateProviderMaterials(providerId, { materiales: payloads });
    },
    onSuccess: () => {
      toast.success("Disponibilidad actualizada");
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "materials", providerId] });
      void qc.invalidateQueries({ queryKey: ["provider-dashboard", "summary", providerId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar"),
  });

  const toggleColorMut = useMutation({
    mutationFn: async ({ materialId, colorName, next }: { materialId: number; colorName: string; next: boolean }) => {
      if (!providerId) throw new Error("Sesión inválida");
      const payloads = replaceMaterialPayload(materials, materialId, (base) => {
        const colores = base.colores.map((c) =>
          c.color_name.toLowerCase() === colorName.toLowerCase() ? { ...c, in_stock: next } : c
        );
        return {
          ...base,
          in_stock: colores.some((c) => c.in_stock),
          colores,
        };
      });
      return updateProviderMaterials(providerId, { materiales: payloads });
    },
    onSuccess: () => {
      toast.success("Color actualizado");
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
        variant="dark"
        eyebrow="Catálogo operativo"
        title="Materiales y precios"
        description="Confirma el stock de materiales y su costo por hora de impresión"
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
              avg_price: avg,
            },
          })
        }
      />

      {visibleMaterials.length === 0 ? (
        <DashboardEmptyState
          title="Todavía no cargaste materiales"
          description="Sumá los filamentos faltantes desde el bloque de stock full."
          icon={<PackageCheck className="h-6 w-6" />}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 520px), 1fr))",
            gap: 16,
          }}
        >
          {visibleMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              id={material.id}
              material_code={displayMaterialCode(material.material_code)}
              in_stock={effectiveMaterialStock(material)}
              precio_hora={Number(material.precio_hora) || 0}
              activo={Boolean(material.activo)}
              colores={ensureDashboardColors(material)}
              market_avg={marketAveragesSimple[displayMaterialCode(material.material_code)]}
              onEdit={() => setModalMode({ kind: "edit", id: material.id })}
              onToggleMaterial={(next) => toggleMaterialMut.mutate({ materialId: material.id, next })}
              onToggleColor={(colorName, next) => toggleColorMut.mutate({ materialId: material.id, colorName, next })}
            />
          ))}
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
