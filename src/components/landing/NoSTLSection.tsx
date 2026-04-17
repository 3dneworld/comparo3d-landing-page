import { useState, useEffect } from "react";
import { MessageCircle, ArrowRight, Sparkles, TrendingUp, Clock, Layers } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { StaggerChildren, StaggerItem } from "@/components/StaggerChildren";
import { getCatalogItems, CatalogItem, isApiError } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.3dneworld.com";
const WHATSAPP_URL = "https://wa.me/5491167987401?text=Hola!%20Tengo%20una%20idea%20para%20imprimir%20en%203D%20y%20necesito%20ayuda%20con%20el%20diseño.";

interface NoSTLSectionProps {
  onCatalogItemSelect: (slug: string) => void;
  isLoadingCatalogItem: boolean;
}

// Skeleton card para el estado de carga
function CatalogCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-8 bg-muted rounded-xl mt-3" />
      </div>
    </div>
  );
}

// Card individual de un item del catálogo
function CatalogCard({
  item,
  onSelect,
  isLoading,
}: {
  item: CatalogItem;
  onSelect: (slug: string) => void;
  isLoading: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = `${API_BASE_URL}${item.image_url}`;

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Imagen */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <Layers size={40} />
          </div>
        )}
        {item.trending && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[11px] font-semibold rounded-full shadow">
            <TrendingUp size={10} /> Tendencia
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{item.title}</h3>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers size={12} />
            {item.material}
          </span>
          {item.print_time_min && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              ~{item.print_time_min} min
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onSelect(item.slug)}
          disabled={isLoading}
          className="mt-auto w-full py-2 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Cargando...
            </span>
          ) : (
            <>
              Cotizar esta pieza
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function NoSTLSection({ onCatalogItemSelect, isLoadingCatalogItem }: NoSTLSectionProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  useEffect(() => {
    getCatalogItems().then((res) => {
      if (!isApiError(res)) setItems(res.items);
      setLoading(false);
    });
  }, []);

  const handleSelect = async (slug: string) => {
    setLoadingSlug(slug);
    await onCatalogItemSelect(slug);
    setLoadingSlug(null);
  };

  return (
    <section id="no-tengo-stl" className="scroll-mt-24 py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <AnimateOnScroll variant="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-3">
              ¿No tenés un archivo STL?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No hay problema. Tenemos opciones para que igual puedas imprimir.
            </p>
          </div>
        </AnimateOnScroll>

        {/* ── BLOQUE 1: Galería del catálogo (solo si hay items o está cargando) ── */}
        {(loading || items.length > 0) && (
          <div className="mb-16">
            <AnimateOnScroll variant="fade-up">
              <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                Elegí un diseño listo para imprimir
              </h3>
            </AnimateOnScroll>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CatalogCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <StaggerChildren staggerDelay={0.05} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.slice(0, 8).map((item) => (
                  <StaggerItem key={item.slug}>
                    <CatalogCard
                      item={item}
                      onSelect={handleSelect}
                      isLoading={isLoadingCatalogItem && loadingSlug === item.slug}
                    />
                  </StaggerItem>
                ))}
              </StaggerChildren>
            )}

            {/* "Ver más" — deshabilitado hasta que haya más items */}
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/50 cursor-not-allowed select-none">
                Ver más diseños
                <ArrowRight size={14} />
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">Próximamente</span>
              </span>
            </div>
          </div>
        )}

        {/* ── BLOQUE 2: Diseño custom via WhatsApp ── */}
        <AnimateOnScroll variant="fade-up">
          <div className="rounded-2xl bg-card border border-border p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Texto principal */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageCircle size={20} className="text-green-500" />
                  ¿Tenés una idea o una foto?
                </h3>
                <p className="text-muted-foreground mb-5 leading-relaxed">
                  Usando herramientas de inteligencia artificial podemos generar modelos 3D a partir de fotos,
                  bocetos, descripciones o planos simples. Contactanos y te asesoramos sobre viabilidad y presupuesto.
                </p>

                {/* Ejemplos */}
                <ul className="space-y-2 mb-6">
                  {[
                    "Figuras decorativas y souvenirs desde foto o descripción",
                    "Repuestos — sacá una foto de la pieza rota y la reimprimimos",
                    "Carcasas y fundas a medida para dispositivos",
                    "Adaptadores y soportes desde un boceto o medidas",
                    "Merchandising y objetos de marca en 3D",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Alcance honesto */}
                <p className="text-xs text-muted-foreground/70 leading-relaxed border-l-2 border-border pl-3">
                  La generación por IA funciona mejor para piezas decorativas y orgánicas.
                  Para piezas mecánicas con tolerancias ajustadas también podemos coordinar un diseño CAD profesional.
                </p>
              </div>

              {/* CTA WhatsApp */}
              <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20b858] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Escribinos por WhatsApp
                </a>
                <p className="text-xs text-muted-foreground text-center md:text-left">
                  Respondemos en el día
                </p>
              </div>

            </div>
          </div>
        </AnimateOnScroll>

      </div>
    </section>
  );
}
