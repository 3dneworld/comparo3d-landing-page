export interface DashboardUser {
  id: number | string;
  email: string;
  role: string;
  provider_id: number | null;
  name: string;
  picture_url: string;
}

export interface DashboardReadiness {
  quote_ready: boolean;
  visibility_ready: boolean;
  order_ready: boolean;
  blocking_reasons: string[];
}

export interface DashboardPermissions {
  visible_in_marketplace?: boolean;
  included_in_new_quotes?: boolean;
  can_manage_existing_orders?: boolean;
  can_accept_confirmed_orders?: boolean;
}

export interface DashboardProximity {
  proximity_enabled?: boolean;
  proximity_block_reason?: string | null;
  proximity_block_reasons?: string[];
  geo_source?: string | null;
  geo_accuracy_m?: number | null;
  geo_captured_at?: string | null;
}

export interface DashboardPostalValidation {
  postal_validation_status?: string | null;
  postal_validated_at?: string | null;
  postal_normalized_cpa?: string | null;
  postal_normalized_address?: string | null;
  postal_normalized_locality?: string | null;
  postal_normalized_province?: string | null;
}

export interface DashboardProvider {
  id: number;
  nombre?: string | null;
  estado?: string | null;
  validation_status?: string | null;
  tier?: string | null;
  quote_ready?: boolean;
  visibility_ready?: boolean;
  order_ready?: boolean;
  marketplace_visible?: boolean;
  localidad?: string | null;
  provincia?: string | null;
  ubicacion?: string | null;
  tiempo_entrega_dias?: number | null;
  min_trabajo?: number | null;
  lat?: number | null;
  lng?: number | null;
  geo_source?: string | null;
  geo_accuracy_m?: number | null;
  geo_captured_at?: string | null;
  postal_validation_status?: string | null;
  paused_reason?: string | null;
  coverage_mode?: string | null;
  coverage_notes?: string | null;
  pickup_enabled?: number | boolean | null;
  shipping_enabled?: number | boolean | null;
}

export interface DashboardProviderProfile extends DashboardProvider {
  email_operativo?: string | null;
  telefono_operativo?: string | null;
  whatsapp?: string | null;
  sitio_web?: string | null;
  nombre_legal?: string | null;
  cuit?: string | null;
  direccion_linea1?: string | null;
  direccion_linea2?: string | null;
  codigo_postal?: string | null;
  logo_url?: string | null;
  public_description?: string | null;
  horario_operativo_json?: unknown;
  geo_accuracy_m?: number | null;
  geo_captured_at?: string | null;
  postal_validation_source?: string | null;
  postal_validated_at?: string | null;
  postal_normalized_cpa?: string | null;
  postal_normalized_address?: string | null;
  postal_normalized_locality?: string | null;
  postal_normalized_province?: string | null;
  mp_user_id?: string | null;
  mp_linked_at?: string | null;
  last_profile_update_at?: string | null;
  last_stock_update_at?: string | null;
}

export interface DashboardMetrics {
  cotizaciones_participadas: number;
  pedidos_abiertos: number;
  pedidos_historicos: number;
  ventas: number;
  cotizaciones_mostradas: number;
}

export interface DashboardOnboardingStage {
  complete: boolean;
  missing: string[];
}

export interface DashboardOnboarding {
  quote_stage?: DashboardOnboardingStage;
  visibility_stage?: DashboardOnboardingStage;
  order_stage?: DashboardOnboardingStage;
  optional_stage?: DashboardOnboardingStage;
}

export interface ProviderSummaryResponse {
  success: true;
  provider: DashboardProvider;
  readiness: DashboardReadiness;
  effective_permissions: DashboardPermissions;
  proximity: DashboardProximity;
  postal_validation: DashboardPostalValidation;
  profile_score: number;
  metrics: DashboardMetrics;
  onboarding: DashboardOnboarding;
}

export interface DashboardPrinter {
  id: number;
  nombre_impresora: string;
  cama_x: number;
  cama_y: number;
  cama_z: number;
  cantidad_unidades: number;
  activa: number;
  es_principal: number;
  materiales_permitidos: string[];
  notas?: string | null;
}

export interface DashboardMaterialColor {
  id: number;
  color_name: string;
  color_hex?: string | null;
  activo: number;
  stock_status?: string | null;
  stock_qty_grams?: number | null;
}

export interface DashboardMaterial {
  id: number;
  material_code: string;
  activo: number;
  precio_hora: number;
  stock_status?: string | null;
  stock_qty_grams?: number | null;
  allow_custom_color: number;
  trabajo_minimo_override?: number | null;
  colores: DashboardMaterialColor[];
}

export interface DashboardLogistica {
  retiro_taller?: number;
  envio_local?: number;
  correo_argentino?: number;
  cobertura_radio_km?: number | null;
  cobertura_zonas?: string[];
  dispatch_days?: number | null;
  instrucciones_retiro?: string | null;
  notas?: string | null;
}

export interface DashboardLogisticsFormPayload {
  retiro_taller: boolean;
  envio_local: boolean;
  correo_argentino: boolean;
  cobertura_radio_km: number | null;
  cobertura_zonas: string[];
  dispatch_days: number | null;
  instrucciones_retiro: string;
  notas: string;
}

export interface ProviderProfileResponse {
  success: true;
  provider: DashboardProviderProfile;
  printers: DashboardPrinter[];
  materials: DashboardMaterial[];
  logistica: DashboardLogistica;
  readiness: DashboardReadiness;
  effective_permissions: DashboardPermissions;
  proximity: DashboardProximity;
  postal_validation: DashboardPostalValidation;
  profile_score: number;
}

export type ProviderLogisticsResponse = ProviderProfileResponse;

export interface ProviderProfileFormPayload {
  nombre: string;
  email_operativo: string;
  telefono_operativo: string;
  whatsapp: string;
  sitio_web: string;
  nombre_legal: string;
  cuit: string;
  direccion_linea1: string;
  direccion_linea2: string;
  localidad: string;
  provincia: string;
  codigo_postal: string;
  tiempo_entrega_dias: number | null;
  min_trabajo: number | null;
  tier: string;
  logo_url: string;
  public_description: string;
  horario_operativo: Record<string, string>;
  lat: number | null;
  lng: number | null;
  geo_source: string;
  geo_accuracy_m: number | null;
  geo_captured_at: string | null;
}

export interface ProviderGeoLocationPayload {
  lat: number;
  lng: number;
  geo_accuracy_m?: number;
  geo_source?: string;
  geo_captured_at?: string;
}

export interface DashboardApiErrorShape {
  error?: string;
  code?: string;
  login_url?: string;
  details?: unknown;
}
