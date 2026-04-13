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

export interface DashboardApiErrorShape {
  error?: string;
  code?: string;
  login_url?: string;
  details?: unknown;
}
