# HANDOFF 2026-04-17 - Dashboard proveedores visual alignment

## Contexto

- Repo: `C:\Users\chris\Cotizador3d\comparo3d-landing-page`
- Rama activa local: `landing-redesign`
- `landing-redesign` fue fast-forwardeada localmente hasta `main` (`1d678c7`) porque era ancestro directo. Esto trae el dashboard migrado, las paginas publicas nuevas y `docs/DESIGN.md` detallado.
- La rama local queda `ahead 34` respecto de `origin/landing-redesign`; no se hizo push.
- El analisis anterior fue sobre la version larga/detallada del design system. En el checkout actual, PowerShell cuenta 1009 lineas, pero Git reporta `docs/DESIGN.md` como archivo nuevo de 1293 inserciones contra la antigua `landing-redesign`; se tomo esta version detallada como fuente de verdad.

## Cambios hechos en esta pasada

- Agregados primitives compartidos:
  - `src/features/provider-dashboard/components/DashboardMetricCard.tsx`
  - `src/features/provider-dashboard/components/DashboardDataRow.tsx`
- Refactor visual de listados mas "legacy table":
  - `ProviderQuotesView.tsx`
  - `ProviderOrdersView.tsx`
  - `ProviderShipmentsView.tsx`
- Cambios principales:
  - Las metric cards de esas vistas usan `DashboardMetricCard`, con `bg-white`, `shadow-card`, hover `shadow-card-hover`, icon box `rounded-xl` y ritmo mas cercano a landing.
  - Las filas de Cotizaciones/Pedidos/Envios dejaron el header tipo tabla y pasaron a rows tipo card (`DashboardDataRow`) con labels visibles en mobile.
  - Los paneles de listados dejaron `contentClassName="p-0"` y ahora tienen padding interno (`p-4 pt-0 md:p-5 md:pt-0`) para que el contenido respire.

## Continuacion aplicada

- `DashboardMetricCard` quedo aplicado tambien a Produccion, Materiales, Logistica, Perfil, Portfolio, Certificacion y Competitividad.
- Se eliminaron las funciones locales `SnapshotCard` duplicadas de todas las vistas proveedoras.
- `DashboardMetricCard` ahora tolera mejor textos largos con `min-w-0` y `break-words` en value/support.
- Materiales y Certificacion ya no tienen `bg-background/70` en sus subcards internas principales; se pasaron a `bg-white` + `shadow-card` para alinearlas con las superficies elevadas del sistema.
- Se corrigio un loop de render en las vistas editables Produccion, Materiales, Logistica y Perfil: los `useEffect` de hidratacion ahora evitan setear estado cuando el snapshot derivado ya coincide con el estado actual.

## Validaciones

- `npx eslint src/features/provider-dashboard/components/DashboardDataRow.tsx src/features/provider-dashboard/components/DashboardMetricCard.tsx src/features/provider-dashboard/views/ProviderQuotesView.tsx src/features/provider-dashboard/views/ProviderOrdersView.tsx src/features/provider-dashboard/views/ProviderShipmentsView.tsx --quiet` OK.
- `npm run build` OK.
- `npx eslint src/features/provider-dashboard/components/DashboardMetricCard.tsx src/features/provider-dashboard/components/DashboardDataRow.tsx src/features/provider-dashboard/views/ProviderProductionView.tsx src/features/provider-dashboard/views/ProviderMaterialsView.tsx src/features/provider-dashboard/views/ProviderLogisticsView.tsx src/features/provider-dashboard/views/ProviderProfileView.tsx src/features/provider-dashboard/views/ProviderPortfolioView.tsx src/features/provider-dashboard/views/ProviderCertificationView.tsx src/features/provider-dashboard/views/ProviderCompetitivenessView.tsx src/features/provider-dashboard/views/ProviderQuotesView.tsx src/features/provider-dashboard/views/ProviderOrdersView.tsx src/features/provider-dashboard/views/ProviderShipmentsView.tsx --quiet` OK.
- `npm run build` OK despues de la continuacion.
- Playwright con mocks de API renderizo `/cotizaciones`, `/pedidos`, `/envios`, `/materiales`, `/certificacion`, `/produccion`, `/perfil`, `/portfolio`, `/logistica` y `/competitividad`.
- Segunda pasada Playwright sobre `/materiales`, `/produccion`, `/logistica` y `/perfil` OK sin warnings de `Maximum update depth`.
- `npm run lint -- --quiet` falla por errores preexistentes fuera de esta pasada:
  - `src/components/ui/command.tsx`
  - `src/components/ui/textarea.tsx`
  - `tailwind.config.ts`

## Pendiente recomendado

1. Revisar visualmente con sesion real y datos reales del backend, especialmente acciones de guardado y detalle.
2. Seguir reduciendo subcards internas `bg-background/70` en otras vistas fuera de Materiales/Certificacion si se quiere cerrar la alineacion completa.
3. Pulir Portfolio/Certificacion contra el roadmap de `DESIGN.md`: gallery modal, badge tooltip trigger y reviews carousel.
4. Decidir si se pushea `landing-redesign` luego de revisar que Lovable pueda absorber el fast-forward.
