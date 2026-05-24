export interface CatalogPreset {
  name: string;
  type: string;
  color_hex: string;
  color_name: string;
  avg_price_fallback: number;
}

export const CATALOG_PRESETS: CatalogPreset[] = [
  { name: "PLA",     type: "FDM", color_hex: "#f5f5f4", color_name: "Blanco",   avg_price_fallback: 5100 },
  { name: "PETG",    type: "FDM", color_hex: "#1c1917", color_name: "Negro",    avg_price_fallback: 5200 },
  { name: "ABS",     type: "FDM", color_hex: "#78716c", color_name: "Gris",     avg_price_fallback: 6400 },
  { name: "TPU 95A", type: "FDM", color_hex: "#facc15", color_name: "Amarillo", avg_price_fallback: 7400 },
  { name: "ASA",     type: "FDM", color_hex: "#1c1917", color_name: "Negro",    avg_price_fallback: 7800 },
  { name: "PLA-CF",  type: "FDM", color_hex: "#292524", color_name: "Negro CF", avg_price_fallback: 9200 },
];

export const MATERIAL_TYPES = [
  "PLA","PETG","ABS","TPU","ASA","Nylon","PC","HIPS","Nylon CF","PETG CF","PLA-CF",
];
