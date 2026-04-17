// ProfileAbout.tsx — Sección "Sobre el proveedor"
interface Props {
  about: string | null;
}

export function ProfileAbout({ about }: Props) {
  if (!about) return null;

  return (
    <section aria-labelledby="about-heading">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h2
          id="about-heading"
          className="mb-3 font-[Montserrat] text-lg font-bold text-foreground"
        >
          Sobre el proveedor
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {about}
        </p>
      </div>
    </section>
  );
}
