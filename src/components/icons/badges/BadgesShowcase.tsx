// BadgesShowcase.tsx — Preview component para los badges creados
export function BadgesShowcase() {
  const badges = [
    {
      name: '+10 años',
      src: '/badges/trayectoria-10.jpg',
      alt: 'Badge +10 años',
      desc: 'Proveedor con 10+ años de trayectoria verificada',
    },
    {
      name: '+5 años',
      src: '/badges/trayectoria-5.jpg',
      alt: 'Badge +5 años',
      desc: 'Proveedor con 5+ años de trayectoria verificada',
    },
    {
      name: 'Certificado Orgánico',
      src: '/badges/certificado-organico.jpg',
      alt: 'Badge Certificado Orgánico',
      desc: 'Certificación orgánica por performance en plataforma',
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold">Badge Assets</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {badges.map((badge) => (
          <div key={badge.name} className="rounded-lg border border-neutral-200 p-6 text-center">
            <img
              src={badge.src}
              alt={badge.alt}
              width={200}
              height={233}
              className="mx-auto mb-4 h-auto w-32"
            />
            <h3 className="mb-2 font-semibold">{badge.name}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{badge.desc}</p>
            <div className="space-y-2 text-xs">
              <div>JPG: <code className="text-primary">{badge.src}</code></div>
              <div>PNG: <code className="text-primary">{badge.src.replace('.jpg', '.png')}</code></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
