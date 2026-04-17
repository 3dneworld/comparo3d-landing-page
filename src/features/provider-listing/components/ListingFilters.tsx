// ListingFilters.tsx — Sidebar de filtros (desktop sticky / mobile Sheet)
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListingProvider } from "../types";

interface Props {
  providers: ListingProvider[];
  provincia: string;
  material: string;
  badge: string;
  industry: string;
  onProvincia: (v: string) => void;
  onMaterial: (v: string) => void;
  onBadge: (v: string) => void;
  onIndustry: (v: string) => void;
  onClear: () => void;
}

const MATERIAL_OPTIONS = [
  { value: "pla", label: "PLA" },
  { value: "petg", label: "PETG" },
  { value: "abs", label: "ABS" },
  { value: "nylon", label: "Nylon" },
  { value: "tpu", label: "TPU" },
  { value: "resina", label: "Resina" },
];

const BADGE_OPTIONS = [
  { value: "seleccion_fundador", label: "Trayectoria Verificada" },
  { value: "certificado_organico", label: "Certificado Orgánico" },
];

function uniqueProvincias(providers: ListingProvider[]): string[] {
  const set = new Set<string>();
  for (const p of providers) {
    if (p.location.provincia) set.add(p.location.provincia);
  }
  return [...set].sort();
}

function uniqueIndustries(providers: ListingProvider[]): string[] {
  const set = new Set<string>();
  for (const p of providers) {
    for (const ind of p.industries_served) {
      if (ind) set.add(ind);
    }
  }
  return [...set].sort();
}

export function ListingFilters({
  providers,
  provincia,
  material,
  badge,
  industry,
  onProvincia,
  onMaterial,
  onBadge,
  onIndustry,
  onClear,
}: Props) {
  const provincias = uniqueProvincias(providers);
  const industries = uniqueIndustries(providers);
  const hasActiveFilters = !!(provincia || material || badge || industry);

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Filtros</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={onClear}
          >
            Limpiar
          </Button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={["ubicacion", "material", "badge", "industria"]}
        className="w-full"
      >
        {/* Ubicación */}
        <AccordionItem value="ubicacion" className="border-b border-neutral-200">
          <AccordionTrigger className="py-3 text-sm font-medium text-foreground hover:no-underline">
            Ubicación
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <Select value={provincia || "__all__"} onValueChange={(v) => onProvincia(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {provincias.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </AccordionContent>
        </AccordionItem>

        {/* Material */}
        <AccordionItem value="material" className="border-b border-neutral-200">
          <AccordionTrigger className="py-3 text-sm font-medium text-foreground hover:no-underline">
            Material
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex flex-col gap-2">
              {MATERIAL_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="material"
                    value={opt.value}
                    checked={material === opt.value}
                    onChange={() =>
                      onMaterial(material === opt.value ? "" : opt.value)
                    }
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
              {material && (
                <button
                  type="button"
                  className="mt-1 text-left text-xs text-muted-foreground underline"
                  onClick={() => onMaterial("")}
                >
                  Quitar filtro
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Badge */}
        <AccordionItem value="badge" className="border-b border-neutral-200">
          <AccordionTrigger className="py-3 text-sm font-medium text-foreground hover:no-underline">
            Certificación
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex flex-col gap-2">
              {BADGE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="radio"
                    name="badge"
                    value={opt.value}
                    checked={badge === opt.value}
                    onChange={() =>
                      onBadge(badge === opt.value ? "" : opt.value)
                    }
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
              {badge && (
                <button
                  type="button"
                  className="mt-1 text-left text-xs text-muted-foreground underline"
                  onClick={() => onBadge("")}
                >
                  Quitar filtro
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Industria */}
        {industries.length > 0 && (
          <AccordionItem value="industria" className="border-b-0">
            <AccordionTrigger className="py-3 text-sm font-medium text-foreground hover:no-underline">
              Industria
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <Select value={industry || "__all__"} onValueChange={(v) => onIndustry(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
