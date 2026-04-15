/**
 * normalizeAddressFlow.ts
 *
 * Función compartida para normalizar y validar direcciones argentinas contra
 * el endpoint /api/address/normalize. Usada tanto por el checkout de clientes
 * como por el onboarding de proveedores, para que cualquier corrección en la
 * lógica aplique a ambos flujos.
 */

import {
  normalizeAddress,
  isApiError,
  type NormalizeAddressRequest,
  type NormalizeAddressResponse,
} from "@/lib/api";

export interface NormalizeAddressFields {
  street: string;
  number: string;
  floor?: string;
  city: string;
  locality_id?: string;
  province: string;
  province_id?: string;
  postal_code: string;
}

export interface NormalizeAddressSuccess {
  ok: true;
  result: NormalizeAddressResponse;
}

export interface NormalizeAddressFailure {
  ok: false;
  errorMessage: string;
}

export type NormalizeAddressOutcome = NormalizeAddressSuccess | NormalizeAddressFailure;

/**
 * Llama al endpoint de normalización de direcciones y devuelve un resultado
 * tipado. Centraliza el mapeo de campos del formulario al payload de la API y
 * la extracción del mensaje de error (incluyendo `help_message` del backend).
 */
export async function runNormalizeAddress(
  fields: NormalizeAddressFields
): Promise<NormalizeAddressOutcome> {
  const request: NormalizeAddressRequest = {
    street: fields.street,
    number: fields.number,
    floor: fields.floor || undefined,
    locality: fields.city,
    locality_id: fields.locality_id || undefined,
    province: fields.province,
    province_id: fields.province_id || undefined,
    postal_code: fields.postal_code,
  };

  const result = await normalizeAddress(request);

  if (isApiError(result)) {
    const helpMessage =
      result.details &&
      typeof result.details === "object" &&
      "help_message" in result.details &&
      typeof result.details.help_message === "string"
        ? result.details.help_message
        : null;
    return {
      ok: false,
      errorMessage: helpMessage || result.error || "No pudimos validar la direccion.",
    };
  }

  return { ok: true, result };
}
