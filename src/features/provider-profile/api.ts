// api.ts — Fetch del perfil público de proveedor
import type { ProviderProfileResponse } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.3dneworld.com";

export async function fetchProviderProfile(
  providerId: number
): Promise<ProviderProfileResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/proveedores/${providerId}/profile`
  );
  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }
  return res.json() as Promise<ProviderProfileResponse>;
}
