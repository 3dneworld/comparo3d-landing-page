// Fuente unica de verdad de camas estandarizadas en el dashboard de proveedores.
// Mirror exacto de modules/bed_standards.py del backend.

export interface BedStandardEntry {
  sku: string;
  x: number;
  y: number;
  z: number;
  label: string;
}

export const BED_STANDARDS: BedStandardEntry[] = [
  { sku: "180x180", x: 180, y: 180, z: 180, label: "180 x 180 x 180 mm" },
  { sku: "220x220", x: 220, y: 220, z: 250, label: "220 x 220 x 250 mm" },
  { sku: "250x210", x: 250, y: 210, z: 210, label: "250 x 210 x 210 mm" },
  { sku: "256x256", x: 256, y: 256, z: 256, label: "256 x 256 x 256 mm" },
  { sku: "320x320", x: 320, y: 320, z: 320, label: "320 x 320 x 320 mm" },
  { sku: "500x500", x: 500, y: 500, z: 500, label: "500 x 500 x 500 mm" },
];

const BY_SKU = new Map(BED_STANDARDS.map((entry) => [entry.sku, entry]));

export function normalizeBedSku(value: unknown): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

export function getBedStandard(sku: unknown): BedStandardEntry | undefined {
  return BY_SKU.get(normalizeBedSku(sku));
}

export function isValidBedSku(sku: unknown): boolean {
  return BY_SKU.has(normalizeBedSku(sku));
}

export function findBedSkuForDimensions(bw: number, bh: number): string | undefined {
  if (!Number.isFinite(bw) || !Number.isFinite(bh) || bw <= 0 || bh <= 0) {
    return undefined;
  }
  const candidates = BED_STANDARDS.filter((entry) => {
    const fitsDirect = bw <= entry.x && bh <= entry.y;
    const fitsRotated = bw <= entry.y && bh <= entry.x;
    return fitsDirect || fitsRotated;
  });
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => a.x * a.y - b.x * b.y);
  return candidates[0].sku;
}

export const BED_STANDARDS_CONTACT_HINT =
  "Si tu impresora no aparece, escribinos a info@comparo3d.com.ar.";
