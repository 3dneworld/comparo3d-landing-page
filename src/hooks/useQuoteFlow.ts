/**
 * useQuoteFlow.ts — Hook para el flujo de cotización de 4 pasos (FASE 9)
 *
 * Maneja:
 * - uploadStl (Paso 1)
 * - initDraft (Paso 2 → 3 transition)
 * - pollOptions (Paso 3 polling)
 * - acceptQuote (Paso 4)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptQuote,
  getQuoteOptions,
  initDraft,
  isApiError,
  QuoteOption,
  uploadStl,
} from "@/lib/api";

export interface QuoteFlowState {
  /** true durante upload o submit */
  isLoading: boolean;
  /** true durante el polling de cotizaciones */
  isProcessing: boolean;
  /** Mensaje de progreso visible al usuario */
  progressMessage: string;
  /** Error a mostrar. null si no hay error. */
  error: string | null;
  /** Lista de cotizaciones disponibles (Paso 3) */
  quotes: QuoteOption[];
  /** order_id generado al aceptar (Paso 4) */
  orderId: string | null;
  /** Archivo STL seleccionado (ref) */
  stlFile: File | null;
}

interface UseQuoteFlowOptions {
  sessionId: string;
  tempName: string;
  onSessionIdReady: (sessionId: string, tempName: string, sha256: string) => void;
  onQuotesReady: (quotes: QuoteOption[]) => void;
}

export function useQuoteFlow({
  sessionId,
  tempName,
  onSessionIdReady,
  onQuotesReady,
}: UseQuoteFlowOptions) {
  const [state, setState] = useState<QuoteFlowState>({
    isLoading: false,
    isProcessing: false,
    progressMessage: "",
    error: null,
    quotes: [],
    orderId: null,
    stlFile: null,
  });

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, []);

  const setError = (error: string) => {
    if (!isMountedRef.current) return;
    setState((s) => ({ ...s, isLoading: false, isProcessing: false, error }));
  };

  const clearError = () => {
    if (!isMountedRef.current) return;
    setState((s) => ({ ...s, error: null }));
  };

  const setStlFile = (file: File | null) => {
    setState((s) => ({ ...s, stlFile: file, error: null }));
  };

  /** Paso 1: Subir STL al backend */
  const handleUploadStl = useCallback(
    async (file: File, currentSessionId?: string): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        progressMessage: "Subiendo y analizando tu archivo...",
      }));

      const result = await uploadStl(file, currentSessionId || undefined);

      if (!isMountedRef.current) return false;

      if (isApiError(result)) {
        const isManifold = result.error === "manifold_error";
        setError(
          isManifold
            ? "Tu archivo tiene problemas de geometría (malla no manifold). Intentá repararlo con Meshmixer o Netfabb."
            : `Error al procesar el archivo: ${result.error}`
        );
        return false;
      }

      onSessionIdReady(result.session_id, result.temp_name, result.stl_sha256 || "");

      setState((s) => ({
        ...s,
        isLoading: false,
        progressMessage: "",
        stlFile: file,
      }));

      return true;
    },
    [onSessionIdReady]
  );

  /** Paso 2→3: Guardar datos del cliente y disparar slicing */
  const handleInitDraft = useCallback(
    async (formData: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      client_location?: string;
      material: string;
      cantidad: string;
      project_details?: string;
      color_acabado?: string;
      uso_pieza?: string;
      urgencia?: string;
      tolerancia?: string;
      observaciones?: string;
      stl_sha256?: string;
    }): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      if (!sessionId || !tempName) {
        setError("Sesión no inicializada. Por favor subí el archivo nuevamente.");
        return false;
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        progressMessage: "Guardando datos y preparando cotizaciones...",
      }));

      const result = await initDraft({
        session_id: sessionId,
        temp_name: tempName,
        ...formData,
      });

      if (!isMountedRef.current) return false;

      if (isApiError(result)) {
        setError(`Error al guardar datos: ${result.error}`);
        return false;
      }

      setState((s) => ({
        ...s,
        isLoading: false,
        progressMessage: "",
      }));

      return true;
    },
    [sessionId, tempName]
  );

  /** Paso 3: Iniciar polling para obtener cotizaciones */
  const startPollingOptions = useCallback(() => {
    if (!sessionId || !isMountedRef.current) return;

    setState((s) => ({
      ...s,
      isProcessing: true,
      quotes: [],
      error: null,
      progressMessage: "Buscando cotizaciones disponibles...",
    }));

    const poll = async (attempt = 1) => {
      if (!isMountedRef.current) return;

      const result = await getQuoteOptions(sessionId);

      if (!isMountedRef.current) return;

      if (isApiError(result)) {
        setError("Error obteniendo cotizaciones. Por favor intentá de nuevo.");
        return;
      }

      if (result.success === false && result.status === "processing") {
        // Todavía procesando — seguir polling
        const delay = Math.min(2000 + attempt * 500, 5000);
        setState((s) => ({
          ...s,
          progressMessage: `Calculando cotizaciones${".".repeat((attempt % 3) + 1)}`,
        }));
        pollRef.current = setTimeout(() => poll(attempt + 1), delay);
        return;
      }

      if (result.success && result.quotes) {
        setState((s) => ({
          ...s,
          isProcessing: false,
          quotes: result.quotes,
          progressMessage: "",
        }));
        onQuotesReady(result.quotes);
      }
    };

    poll();
  }, [sessionId, onQuotesReady]);

  /** Paso 4: Aceptar una cotización */
  const handleAcceptQuote = useCallback(
    async (quoteOptionUid: string): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      if (!sessionId) {
        setError("Sesión no inicializada.");
        return false;
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        progressMessage: "Confirmando tu selección...",
      }));

      const result = await acceptQuote(sessionId, quoteOptionUid);

      if (!isMountedRef.current) return false;

      if (isApiError(result)) {
        setError(`Error al confirmar: ${result.error}`);
        return false;
      }

      setState((s) => ({
        ...s,
        isLoading: false,
        orderId: result.order_id,
        progressMessage: "",
      }));

      return true;
    },
    [sessionId]
  );

  return {
    ...state,
    setStlFile,
    clearError,
    handleUploadStl,
    handleInitDraft,
    startPollingOptions,
    handleAcceptQuote,
  };
}
