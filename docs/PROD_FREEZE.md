# PROD Freeze - Upload Flow

El flujo de upload STL es camino critico de ventas. No se despliega a PROD si falla este gate.

## Contrato congelado

- Un upload exitoso debe avanzar a `Tus datos`.
- Un upload no confirmado por backend no se puede restaurar como STL cargado.
- `localStorage` no puede persistir thumbnails/base64 del STL.
- El usuario debe poder quitar/reemplazar un STL detectado.
- El build de produccion debe pasar desde un checkout limpio.

## Gate obligatorio

```powershell
npm run freeze:upload
```

Esto ejecuta:

- `QuoteSection.restore.test.tsx`
- `StepUpload.test.tsx`
- `StepUserData.test.tsx`
- `vite build`

Si se cambia `QuoteSection`, `useQuoteFlow`, `StepUpload`, `StepUserData` o `src/lib/api.ts`, este gate es obligatorio antes de deploy.

## Deploy seguro

Usar el wrapper de deploy para evitar publicar desde un checkout sucio:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-prod-freeze.ps1
```
