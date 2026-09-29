# Aplicación web — Ruta de Emprendimiento FUMC

Next.js 16 (App Router) + React 19 + TypeScript, Prisma 7 + SQLite, Auth.js v5, Tailwind CSS 4, ExcelJS, @react-pdf/renderer y Vitest.

## Desarrollo

```bash
npm install
cp .env.example .env        # completar AUTH_SECRET (npx auth secret)
npx prisma migrate deploy
npx prisma generate
npx prisma db seed          # opcional: datos y usuarios de ejemplo
npm run dev
```

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` y `npm start` | Producción |
| `npm run test` | Pruebas (usa una base aislada `test.db`) |
| `npm run lint` | Revisión de estilo |
| `npx prisma studio` | Explorar la base de datos |

## Documentación

- Documento técnico completo: [`../documentacion/DOCUMENTO_TECNICO.md`](../documentacion/DOCUMENTO_TECNICO.md)
- Seguridad: [`docs/SEGURIDAD.md`](./docs/SEGURIDAD.md)
