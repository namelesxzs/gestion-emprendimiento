# Ruta de Emprendimiento FUMC — Plataforma de acompañamiento a emprendedores

Plataforma web de la Unidad de Innovación y Emprendimiento (UIE) y la Mesa Universitaria de Emprendimiento (MEUNE) de la Fundación Universitaria María Cano. Gestiona el acompañamiento a emprendedores con:

- historial evolutivo de acompañamiento;
- reuniones con calendario;
- seguimiento por la cadena de valor y por las fases del Manual (Pre-incubación, Incubación, Egreso);
- los 31 formatos del *Manual de Formatos y Metodologías*, diligenciables, firmables, revisables e imprimibles;
- indicadores por sede y cohorte;
- portal propio para cada emprendedor.

## Estructura

| Carpeta | Contenido |
|---|---|
| [`web/`](./web) | La aplicación (Next.js, Prisma, SQLite) |
| [`documentacion/`](./documentacion) | Documento técnico, documentos del encargo y archivos de referencia |

## Inicio rápido

```bash
cd web
npm install
cp .env.example .env        # completar AUTH_SECRET (npx auth secret)
npx prisma migrate deploy
npx prisma generate
npx prisma db seed          # datos y usuarios de ejemplo (solo desarrollo)
npm run dev                 # http://localhost:3000
```

La instalación completa, la operación, el mantenimiento y el escalamiento se explican en [`documentacion/DOCUMENTO_TECNICO.md`](./documentacion/DOCUMENTO_TECNICO.md).
