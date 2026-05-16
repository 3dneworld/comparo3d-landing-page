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
  updateQuantity,
  uploadStl,
} from "@/lib/api";
import { reportClientError } from "@/lib/clientErrorReporter";

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
  /** Thumbnail base64 del STL subido (data:image/png;base64,...) */
  thumbnailUrl: string | null;
  /** Calidad del thumbnail visible: preview rapido o full final. */
  thumbnailQuality: "preview" | "full" | null;
  /** Metadata devuelta por /options */
  material: string | null;
  cantidad: number | null;
  stlDimensions: { x: number; y: number; z: number } | null;
}

interface UseQuoteFlowOptions {
  sessionId: string;
  tempName: string;
  onSessionIdReady: (
    sessionId: string,
    tempName: string,
    sha256: string,
    thumbnailUrl: string | null,
    thumbnailQuality: "preview" | "full" | null
  ) => void;
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
    thumbnailUrl: null,
    thumbnailQuality: null,
    material: null,
    cantidad: null,
    stlDimensions: null,
  });

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const processingStartedAtRef = useRef<number | null>(null);
  const latestStateRef = useRef<QuoteFlowState | null>(null);
  const abandonedReportKeyRef = useRef<string | null>(null);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    isMountedRef.current = true;
    const reportAbandonedPoll = () => {
      const latest = latestStateRef.current;
      if (!latest?.isProcessing || !sessionId) return;
      const reportKey = `${sessionId}:${processingStartedAtRef.current ?? ""}`;
      if (abandonedReportKeyRef.current === reportKey) return;
      abandonedReportKeyRef.current = reportKey;
      void reportClientError({
        event_type: "quote_poll_abandoned",
        message: "Cliente abandono la pagina mientras esperaba cotizaciones",
        severity: "warning",
        context: {
          flow: "quote_options",
          session_id: sessionId,
          temp_name: tempName,
          material: latest.material,
          cantidad: latest.cantidad,
          quotes_count: latest.quotes.length,
          elapsed_ms: processingStartedAtRef.current ? Date.now() - processingStartedAtRef.current : null,
        },
      });
    };
    window.addEventListener("pagehide", reportAbandonedPoll);
    return () => {
      isMountedRef.current = false;
      reportAbandonedPoll();
      window.removeEventListener("pagehide", reportAbandonedPoll);
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [sessionId, tempName]);

  const setError = (error: string) => {
    if (!isMountedRef.current) return;
    processingStartedAtRef.current = null;
    abandonedReportKeyRef.current = null;
    setState((s) => ({ ...s, isLoading: false, isProcessing: false, error }));
  };

  const clearError = () => {
    if (!isMountedRef.current) return;
    setState((s) => ({ ...s, error: null }));
  };

  const setStlFile = (file: File | null) => {
    setState((s) => ({ ...s, stlFile: file, error: null }));
  };

  const resetUploadState = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
    if (!isMountedRef.current) return;
    setState({
      isLoading: false,
      isProcessing: false,
      progressMessage: "",
      error: null,
      quotes: [],
      orderId: null,
      stlFile: null,
      thumbnailUrl: null,
      thumbnailQuality: null,
      material: null,
      cantidad: null,
      stlDimensions: null,
    });
  }, []);

  /** Paso 1: Subir STL al backend */
  const handleUploadStl = useCallback(
    async (file: File, currentSessionId?: string): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      // Archivos >= 95MB usan canal alternativo (R2 directo). Mostramos
      // mensaje distinto y progreso real durante el PUT a R2.
      const isLarge = file.size >= 95 * 1024 * 1024;
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        progressMessage: isLarge
          ? `Archivo grande (${sizeMb} MB). Debido a que el archivo tiene un peso superior a 100 MB este proceso puede demorar más de lo habitual. Subiendo por canal especial...`
          : "Subiendo y analizando tu archivo...",
      }));

      const onProgress = (loaded: number, total: number) => {
        if (!isMountedRef.current || total <= 0) return;
        const pct = Math.min(100, Math.round((loaded / total) * 100));
        setState((s) => ({
          ...s,
          progressMessage: `Subiendo archivo grande (${sizeMb} MB)... ${pct}%`,
        }));
      };

      // onStep recibe los mensajes server-side durante el procesamiento async
      // del large upload (download R2 -> manifold -> tweaker -> slicer -> thumbnail).
      // El backend manda mensajes ya armados; los pegamos tal cual.
      const onStep = (message: string, _pct: number | null) => {
        if (!isMountedRef.current) return;
        setState((s) => ({ ...s, progressMessage: message }));
      };

      const result = await uploadStl(
        file,
        currentSessionId || undefined,
        isLarge ? onProgress : undefined,
        isLarge ? onStep : undefined,
      );

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

      onSessionIdReady(
        result.session_id,
        result.temp_name,
        result.stl_sha256 || "",
        result.thumbnail_base64 || null,
        result.thumbnail_quality || (result.thumbnail_base64 ? "full" : null)
      );

      setState((s) => ({
        ...s,
        isLoading: false,
        progressMessage: "",
        stlFile: file,
        thumbnailUrl: result.thumbnail_base64 || null,
        thumbnailQuality: result.thumbnail_quality || (result.thumbnail_base64 ? "full" : null),
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
      urgencia?: string;
      observaciones?: string;
      infill?: string;
      layer_height?: string;
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
    if (!sessionId || !isMountedRef.current) {
      console.warn("[POLL] startPollingOptions ignorado — sessionId vacío o componente desmontado", { sessionId, mounted: isMountedRef.current });
      return;
    }
    console.log("[POLL] Iniciando polling para session:", sessionId);
    if (pollRef.current) clearTimeout(pollRef.current);

    setState((s) => ({
      ...s,
      isProcessing: true,
      quotes: [],
      error: null,
      progressMessage: "Buscando cotizaciones disponibles...",
    }));
    processingStartedAtRef.current = Date.now();
    abandonedReportKeyRef.current = null;

    const poll = async (attempt = 1) => {
      if (!isMountedRef.current) {
        console.log("[POLL] Componente desmontado — cancelando poll en intento", attempt);
        return;
      }

      console.log(`[POLL] Intento #${attempt} para session: ${sessionId}`);
      let result;
      try {
        result = await getQuoteOptions(sessionId);
      } catch (fetchErr) {
        console.error("[POLL] Error inesperado en getQuoteOptions:", fetchErr);
        setError("Error de red obteniendo cotizaciones. Por favor intentá de nuevo.");
        return;
      }

      if (!isMountedRef.current) return;

      console.log(`[POLL] Intento #${attempt} resultado:`, {
        isApiError: isApiError(result),
        success: (result as { success?: boolean }).success,
        status: (result as { status?: string }).status,
        slicing_status: (result as { slicing_status?: string }).slicing_status,
        quotes_count: (result as { quotes?: unknown[] }).quotes?.length ?? 0,
        error: (result as { error?: string }).error,
      });

      if (isApiError(result)) {
        console.error("[POLL] API error:", result.error, "| status:", result.status, "| message:", result.message);
        setError(result.error || result.message || "Error obteniendo cotizaciones. Por favor intentá de nuevo.");
        return;
      }

      if (result.success === false && result.status === "processing") {
        const delay = Math.min(2000 + attempt * 500, 5000);
        console.log(`[POLL] Aún procesando — reintentando en ${delay}ms`);
        setState((s) => ({
          ...s,
          progressMessage: `Calculando cotizaciones${".".repeat((attempt % 3) + 1)}`,
        }));
        pollRef.current = setTimeout(() => poll(attempt + 1), delay);
        return;
      }

      if (result.success && result.quotes) {
        processingStartedAtRef.current = null;
        abandonedReportKeyRef.current = null;
        console.log(`[POLL] Completado — ${result.quotes.length} cotizaciones recibidas`);
        setState((s) => ({
          ...s,
          isProcessing: false,
          quotes: result.quotes,
          material: result.material,
          cantidad: result.cantidad,
          stlDimensions: result.stl_dimensions,
          progressMessage: "",
        }));
        onQuotesReady(result.quotes);
        return;
      }

      // Caso inesperado: success pero sin quotes, o slicing_status=error
      console.warn("[POLL] Estado inesperado en respuesta:", result);
      const errMsg = (result as { message?: string }).message || "Estado inesperado";
      processingStartedAtRef.current = null;
      abandonedReportKeyRef.current = null;
      setError(errMsg);
    };

    poll();
  }, [sessionId, onQuotesReady]);

  /** Paso 3: Actualizar cantidad y relanzar el calculo */
  const handleUpdateQuantity = useCallback(
    async (newCantidad: number): Promise<boolean> => {
      if (!isMountedRef.current) return false;
      if (!sessionId) {
        setError("Sesion no inicializada.");
        return false;
      }

      setState((s) => ({
        ...s,
        isProcessing: true,
        error: null,
        quotes: [],
        progressMessage: "Recalculando cotizaciones...",
      }));
      processingStartedAtRef.current = Date.now();
      abandonedReportKeyRef.current = null;

      const result = await updateQuantity(sessionId, newCantidad);

      if (!isMountedRef.current) return false;

      if (isApiError(result)) {
        setError(result.error || "No se pudo actualizar la cantidad.");
        return false;
      }

      setState((s) => ({
        ...s,
        cantidad: result.cantidad,
      }));

      startPollingOptions();
      return true;
    },
    [sessionId, startPollingOptions]
  );

  /** Paso 4: Aceptar una cotizaciÃ³n */
  const handleAcceptQuote = useCallback(
    async (quoteOptionUid: string): Promise<string | null> => {
      if (!isMountedRef.current) return null;
      if (!sessionId) {
        setError("Sesión no inicializada.");
        return null;
      }

      setState((s) => ({
        ...s,
        isLoading: true,
        error: null,
        progressMessage: "Confirmando tu selección...",
      }));

      const result = await acceptQuote(sessionId, quoteOptionUid);

      if (!isMountedRef.current) return null;

      if (isApiError(result)) {
        setError(`Error al confirmar: ${result.error}`);
        return null;
      }

      setState((s) => ({
        ...s,
        isLoading: false,
        progressMessage: "",
      }));

      return result.session_id;
    },
    [sessionId]
  );

  return {
    ...state,
    setStlFile,
    resetUploadState,
    setError,
    clearError,
    resetUploadState,
    handleUploadStl,
    handleInitDraft,
    startPollingOptions,
    handleUpdateQuantity,
    handleAcceptQuote,
  };
}
