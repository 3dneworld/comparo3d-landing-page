// ProfileContactCTA.tsx — Sticky CTA solo en mobile (fixed bottom bar)
export function ProfileContactCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-sm shadow-lg lg:hidden">
      <a
        href="/#cotizador"
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-4 py-3.5 text-[15px] font-bold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80"
      >
        Pedir cotización
      </a>
    </div>
  );
}
