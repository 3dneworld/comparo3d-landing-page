export interface CatalogPreset {
  name: string;
  avg_price_fallback: number;
}

export const CATALOG_PRESETS: CatalogPreset[] = [
  { name: "PLA", avg_price_fallback: 5100 },
  { name: "ABS", avg_price_fallback: 6400 },
  { name: "PETG", avg_price_fallback: 5200 },
  { name: "Nylon", avg_price_fallback: 7600 },
  { name: "TPU", avg_price_fallback: 7400 },
  { name: "PC", avg_price_fallback: 8800 },
];

export const MATERIAL_TYPES = CATALOG_PRESETS.map((preset) => preset.name);

export interface QuoteColorOption {
  label: string;
  value: string;
  hex: string;
  border: string;
}

export const QUOTE_COLOR_OPTIONS: QuoteColorOption[] = [
  { label: "BLANCO", value: "Blanco", hex: "#FFFFFF", border: "#D1D5DB" },
  { label: "NEGRO", value: "Negro", hex: "#1F1F1F", border: "#1F1F1F" },
  { label: "AZUL", value: "Azul", hex: "#2563EB", border: "#2563EB" },
  { label: "ROJO", value: "Rojo", hex: "#DC2626", border: "#DC2626" },
  { label: "GRIS", value: "Gris", hex: "#6B7280", border: "#6B7280" },
  { label: "AMARILLO", value: "Amarillo", hex: "#F59E0B", border: "#F59E0B" },
  { label: "VERDE", value: "Verde", hex: "#16A34A", border: "#16A34A" },
  { label: "NARANJA", value: "Naranja", hex: "#EA580C", border: "#EA580C" },
];

export function colorOptionByName(name: string) {
  return QUOTE_COLOR_OPTIONS.find((color) => color.value.toLowerCase() === name.toLowerCase());
}
