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
  quote_materials?: string[];
  visible_materials?: string[];
  material_visibility?: Record<string, boolean>;
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
  last_capacity_update_at?: string | null;
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

export interface DashboardPrinterFormPayload {
  nombre_impresora: string;
  cama_x: number;
  cama_y: number;
  cama_z: number;
  cantidad_unidades: number;
  activa: boolean;
  es_principal: boolean;
  materiales_permitidos: string[];
  notas: string;
}

export interface DashboardPrintersFormPayload {
  impresoras: DashboardPrinterFormPayload[];
}

export interface DashboardMaterialColor {
  id: number;
  color_name: string;
  color_hex?: string | null;
  activo: number;
  stock_status?: string | null;
  stock_qty_grams?: number | null;
}

export type DashboardStockStatus = "available" | "low" | "out" | "on_request" | "unknown";

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

export interface DashboardMaterialColorFormPayload {
  color_name: string;
  color_hex: string;
  activo: boolean;
  stock_status: DashboardStockStatus;
  stock_qty_grams: number | null;
}

export interface DashboardMaterialFormPayload {
  material_code: string;
  activo: boolean;
  precio_hora: number;
  stock_status: DashboardStockStatus;
  stock_qty_grams: number | null;
  allow_custom_color: boolean;
  trabajo_minimo_override: number | null;
  colores: DashboardMaterialColorFormPayload[];
}

export interface DashboardMaterialsFormPayload {
  materiales: DashboardMaterialFormPayload[];
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
  micorreo_api_user?: string | null;
  micorreo_customer_id?: string | null;
  micorreo_validated_at?: string | null;
  micorreo_validation_warning?: string | null;
  micorreo_configured?: boolean;
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

export interface ProviderMiCorreoPayload {
  api_user: string;
  api_password: string;
  customer_id: string;
  province_code?: string;
}

export interface ProviderMiCorreoAgency {
  code?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  address?: Record<string, unknown>;
  hours?: Record<string, unknown>;
  nearByPostalCode?: string | null;
  services?: Record<string, unknown>;
  location?: {
    latitude?: string | number | null;
    longitude?: string | number | null;
  };
}

export interface ProviderMiCorreoAgencyResponse {
  success: true;
  province_code?: string;
  postal_code?: string;
  agency?: ProviderMiCorreoAgency | null;
  items?: ProviderMiCorreoAgency[];
}

export type ProviderProductionResponse = ProviderProfileResponse;

export type ProviderMaterialsResponse = ProviderProfileResponse;

export type DashboardQuoteStatus =
  | "quoted"
  | "selected_pending_payment"
  | "paid_confirmed"
  | "won"
  | "not_selected"
  | "payment_rejected"
  | "expired"
  | string;

export interface DashboardQuoteMatch {
  id: number;
  cotizacion_id?: number | null;
  material?: string | null;
  cantidad?: string | number | null;
  precio_final?: number | null;
  print_time_min?: number | null;
  delivery_days_est?: number | null;
  ranking_score_snapshot?: number | null;
  estado?: DashboardQuoteStatus | null;
  selected_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  quote_uid?: string | null;
  infill?: string | null;
  layer_height?: string | null;
  color?: string | null;
  detalles?: string | null;
  filament_grams?: number | null;
}

export interface ProviderQuotesResponse {
  success: true;
  items: DashboardQuoteMatch[];
}

export interface ProviderQuoteDetailResponse {
  success: true;
  item: DashboardQuoteMatch;
}

export type DashboardOrderStatus =
  | "paid_confirmed"
  | "in_production"
  | "ready_to_ship"
  | "en_transito"
  | "completed"
  | "cancelled"
  | "pending_confirmation"
  | string;

export interface DashboardOrderFile {
  file_type?: string | null;
  file_path?: string | null;
  created_at?: string | null;
}

export interface DashboardOrder {
  id: number;
  cotizacion_id?: number | null;
  cotizacion_proveedor_id?: number | null;
  proveedor_id?: number | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  delivery_method?: string | null;
  delivery_address_json?: string | Record<string, unknown> | null;
  notas?: string | null;
  payment_status?: string | null;
  order_status?: DashboardOrderStatus | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  files_count?: number | null;
  files?: DashboardOrderFile[];
}

export interface ProviderOrdersResponse {
  success: true;
  items: DashboardOrder[];
}

export interface ProviderOrderDetailResponse {
  success: true;
  item: DashboardOrder;
}

export interface ProviderOrderPrintingResponse {
  success: true;
  pedido_id: number;
  proveedor_id: number;
  previous_status?: string;
  order_status: "in_production" | string;
  already_printing?: boolean;
  email_sent?: boolean;
}

export interface ProviderOrderReadyToShipResponse {
  success: true;
  order_id: number;
  shipment_id: number;
  previous_status?: string;
  order_status: "ready_to_ship" | string;
  uploaded?: number;
  email_sent?: boolean;
  photos?: Array<{
    id?: string;
    path?: string;
    url?: string;
    filename?: string;
    uploaded_at?: string;
  }>;
  shipment?: DashboardShipment;
}

export interface ProviderOrderDispatchResponse {
  success: true;
  order_id: number;
  shipment_id: number;
  trackingNumber: string;
  tracking_url?: string;
  product_type?: string;
  estimated_days?: string;
  email_sent?: boolean;
  shipment?: DashboardShipment;
}

export type DashboardShipmentStatus =
  | "pending"
  | "ready_to_ship"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "problem"
  | string;

export type DashboardShippingMethod = "retiro_taller" | "paqar_clasico" | "paqar_expreso" | string;

export interface DashboardShipment {
  id: number;
  cotizacion_id?: number | null;
  cotizacion_proveedor_id?: number | null;
  proveedor_id?: number | null;
  quote_uid?: string | null;
  shipping_method?: DashboardShippingMethod | null;
  managed_by?: string | null;
  origen_nombre?: string | null;
  origen_direccion?: string | null;
  origen_localidad?: string | null;
  origen_provincia?: string | null;
  origen_cp?: string | null;
  origen_telefono?: string | null;
  destino_nombre?: string | null;
  destino_direccion?: string | null;
  destino_localidad?: string | null;
  destino_provincia?: string | null;
  destino_cp?: string | null;
  destino_telefono?: string | null;
  peso_gramos?: number | null;
  dimension_largo_cm?: number | null;
  dimension_ancho_cm?: number | null;
  dimension_alto_cm?: number | null;
  peso_override_proveedor?: number | null;
  shipping_cost_real_ars?: number | null;
  tarifa_estimada_ars?: number | null;
  tarifa_zona?: string | null;
  margen_plataforma_pct?: number | null;
  precio_cobrado_cliente_ars?: number | null;
  fecha_pedido?: string | null;
  fecha_limite_despacho?: string | null;
  fecha_pickup_sugerida?: string | null;
  fecha_despacho_real?: string | null;
  fecha_entrega_real?: string | null;
  status?: DashboardShipmentStatus | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  tracking_loaded_at?: string | null;
  notificacion_cliente_tracking_enviada?: number | boolean | null;
  notas_proveedor?: string | null;
  notas_internas?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  dispatch_package?: string | null;
  tracking_customer_message?: string | null;
}

export interface ProviderShipmentsResponse {
  success: true;
  items: DashboardShipment[];
  stats?: Record<string, number>;
}

export interface ProviderShipmentMutationResponse {
  success: true;
  shipment: DashboardShipment;
}

export interface DashboardNotification {
  id: number;
  proveedor_id?: number | null;
  tipo?: string | null;
  titulo?: string | null;
  mensaje?: string | null;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
  leida?: number | boolean | null;
  created_at?: string | null;
}

export interface ProviderNotificationsResponse {
  success: true;
  items: DashboardNotification[];
  total?: number;
  unread?: number;
}

export interface ProviderNotificationReadResponse {
  success: true;
}

export interface DashboardPortfolioItem {
  id: number;
  provider_id?: number | null;
  photo_path?: string | null;
  description?: string | null;
  technology?: string | null;
  project_type?: string | null;
  client_industry?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DashboardPortfolioFormPayload {
  photo_path: string;
  description: string;
  technology: string;
  project_type: string;
  client_industry: string;
}

export interface ProviderPortfolioResponse {
  success: true;
  items: DashboardPortfolioItem[];
}

export interface ProviderPortfolioItemResponse {
  success: true;
  item: DashboardPortfolioItem;
}

export type ProviderPortfolioDeleteResponse = ProviderPortfolioItemResponse;

export interface DashboardCertificationRequirement {
  value?: number | null;
  target?: number | null;
  target_lt?: number | null;
  ok?: boolean;
}

export interface ProviderCertificationProgressResponse {
  success: true;
  provider_id: number;
  active_months?: DashboardCertificationRequirement;
  total_orders_completed?: DashboardCertificationRequirement;
  avg_rating?: DashboardCertificationRequirement;
  total_reviews?: DashboardCertificationRequirement;
  cancellation_rate_90d?: DashboardCertificationRequirement;
  on_time_delivery_rate?: DashboardCertificationRequirement;
  open_disputes?: DashboardCertificationRequirement;
  certification_progress_pct?: number;
  ranking_mode?: string | null;
  active_badges?: DashboardProviderBadge[];
}

export interface DashboardProviderBadge {
  id?: number;
  provider_id?: number | null;
  badge_type?: string | null;
  badge_tier?: string | null;
  granted_at?: string | null;
  granted_by?: string | null;
  notes?: string | null;
  is_active?: number | boolean | null;
}

export interface ProviderBadgesResponse {
  success: true;
  items: DashboardProviderBadge[];
}

export interface DashboardProviderReview {
  id: number;
  order_id?: number | null;
  provider_id?: number | null;
  rating?: number | null;
  comment?: string | null;
  is_b2b_order?: number | boolean | null;
  visible?: number | boolean | null;
  reported?: number | boolean | null;
  created_at?: string | null;
}

export interface ProviderReviewsResponse {
  success: true;
  items: DashboardProviderReview[];
}

export interface DashboardProviderRawMetrics {
  provider_id?: number;
  total_orders_completed?: number | null;
  total_orders_cancelled?: number | null;
  cancellation_rate_90d?: number | null;
  on_time_delivery_rate?: number | null;
  avg_rating?: number | null;
  total_reviews?: number | null;
  b2b_projects_completed?: number | null;
  active_months?: number | null;
  open_disputes?: number | null;
  certification_progress_pct?: number | null;
  ranking_mode?: string | null;
  current_sr_score?: number | null;
  last_completed_order_at?: string | null;
  last_calculated_at?: string | null;
}

export interface ProviderMetricsResponse {
  success: true;
  provider_id: number;
  reviews_count?: number;
  rating?: number | null;
  b2b_projects_completed?: number;
  badges?: DashboardProviderBadge[];
  badges_count?: number;
  portfolio_count?: number;
  certification_progress_pct?: number;
  ranking_mode?: string | null;
  current_sr_score?: number | null;
  trust_level?: string | null;
  raw_metrics?: DashboardProviderRawMetrics;
}

export interface DashboardScoreBreakdown {
  provider_id?: number;
  nombre?: string | null;
  sr_score?: number | null;
  ranking_mode?: string | null;
  score_breakdown?: Record<string, unknown>;
  badges?: DashboardProviderBadge[];
  portfolio_count?: number;
  [key: string]: unknown;
}

export interface ProviderScoreBreakdownResponse {
  success: true;
  item: DashboardScoreBreakdown;
}

export interface DashboardCompetitivenessBenchmark {
  success?: boolean;
  error?: string;
  median?: number | null;
  p25?: number | null;
  p75?: number | null;
  percentile?: number | null;
  position_label?: string | null;
  suggestion?: string | null;
  sample_size?: number | null;
  show_raw_competitor_data?: boolean;
}

export interface ProviderCompetitivenessResponse {
  success: true;
  provider_id: number;
  material_code?: string | null;
  own_price?: number | null;
  cohort?: string | null;
  benchmark?: DashboardCompetitivenessBenchmark;
  data_source?: string | null;
  debug_counts?: Record<string, number>;
}

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
