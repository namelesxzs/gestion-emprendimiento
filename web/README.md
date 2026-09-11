# Plataforma UIE — Acompañamiento a Emprendedores

Plataforma web para la gestión integral del acompañamiento a emprendedores de la
Unidad de Innovación y Emprendimiento (UIE) de la Fundación Universitaria María Cano.

Permite registrar emprendedores, llevar su acompañamiento como una historia
evolutiva (diagnóstico, recomendaciones, compromisos), gestionar reuniones,
hacer seguimiento por la cadena de valor institucional

```
Descubrir → Incubar → Formar → Fomentar → Financiar
```

y visualizar KPIs institucionales para apoyar la toma de decisiones.

Desde la Fase 11, además, un **catálogo configurable** (`/configuracion`, solo
Administrador) implementa el *Manual de Formatos y Metodologías de la Ruta de
Emprendimiento* de la Fundación (MEUNE-FUMC, agosto 2026): las fases
Pre-incubación / Incubación / Egreso se activan o desactivan y se muestran como
pestañas en `/ruta` (así lo pide un comentario de revisión dentro del propio
Manual), y los 30 instrumentos oficiales (fichas, rúbricas, lienzos, actas,
consentimiento de datos, etc.) vienen sembrados con sus campos reales — activar
o desactivar uno no exige tocar código. Ver la auditoría publicada para el
detalle de cobertura frente al Manual y los cambios pendientes (C1-C25).

## Estado actual

En desarrollo activo, sobre datos reales (no de ejemplo): base de datos, autenticación
por credenciales, roles, importación/exportación y auditoría ya están implementados.
Ver [Roadmap](#roadmap) para el detalle por fase.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Prisma + SQLite (`better-sqlite3`)
- [Auth.js / NextAuth](https://authjs.dev) v5 (credenciales, sesión JWT)
- Tailwind CSS v4
- ExcelJS (importar/exportar `.xlsx`), `@react-pdf/renderer` (exportar `.pdf`)
- [Vitest](https://vitest.dev) para tests unitarios y de integración
- Identidad visual institucional (fumc.edu.co): Montserrat + Didact Gothic,
  paleta azul-cian de marca

## Roles y permisos

| Rol | Puede | No puede |
|---|---|---|
| **Emprendedor** | Ver su propio progreso, historial y reuniones (`/`, `/acompanamientos`, `/reuniones` acotados a sí mismo) | Ver otros emprendedores, mutar nada, importar/exportar, auditoría |
| **Docente** | Registrar/editar emprendedores, acompañamientos y reuniones; importar Excel; exportar Excel/PDF | Gestionar usuarios, ver auditoría, dashboard de indicadores (ve el operativo) |
| **Coordinador** | Ver el panel de indicadores institucionales (`/`, solo lectura); exportar Excel/PDF | Mutar datos operativos, gestionar usuarios, ver auditoría |
| **Administrador** | Todo lo anterior + gestionar usuarios de personal UIE (`/usuarios`: alta, edición, activar/desactivar, restablecer contraseña, cualquier rol) + dar acceso al portal a un Emprendedor (desde su detalle en `/emprendedores`) + consultar auditoría (`/auditoria`) + configurar el catálogo de fases/etapas/instrumentos y las reglas de avance (`/configuracion`) | — |

`/ruta` (fases activas como pestañas, con su catálogo de instrumentos) y los
instrumentos dentro del detalle de un emprendedor son visibles para todos los
roles autenticados — diligenciarlos sigue las mismas reglas que el resto de
mutaciones (Administrador/Docente por cualquiera, Emprendedor solo lo propio).

La autorización se verifica siempre en el servidor (`requireRole` en cada server
action y route handler) — nunca solo ocultando botones en el cliente. Ver
`src/lib/authz.ts`.

## Desarrollo

```bash
npm install
cp .env.example .env   # completar AUTH_SECRET (ver abajo)
npx prisma migrate dev # crea/actualiza dev.db con el esquema
npx prisma db seed     # opcional: datos de ejemplo + usuarios de prueba
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno (`.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Ruta a la SQLite, por defecto `file:./dev.db` |
| `AUTH_SECRET` | Secreto de sesión de Auth.js. Generar con `npx auth secret` — **nunca** commitear un valor real |

### Testing

```bash
npm run test        # corre toda la suite una vez
npm run test:watch  # modo watch
```

Usa [Vitest](https://vitest.dev) contra una SQLite de prueba separada (`test.db`,
nunca `dev.db`) que `vitest.globalSetup.mts` crea y migra automáticamente antes de
correr la suite, y borra al terminar. Incluye:

- Unitarios de lógica pura: `src/lib/kpis.ts`, `src/lib/view.ts`, todos los
  schemas de `src/lib/validation/*`.
- Integración contra base de datos real: `src/lib/importer.ts` (parseo + diff),
  `src/app/importar/actions.ts` (transacción completa: alta/actualización +
  auditoría + idempotencia al reimportar), `src/lib/loginRateLimit.ts` y
  `src/app/login/actions.ts` (bloqueo por intentos fallidos),
  `src/app/usuarios/actions.ts` (alta/edición/activar-desactivar/reset de
  contraseña, y alta de cuenta de portal para un Emprendedor), y
  `src/lib/reglasAvance.ts` (motor de reglas de avance del catálogo
  configurable: sin reglas el paso queda libre, con una regla activa exige
  que existan las respuestas de los instrumentos requeridos).

Los tests de integración mockean `@/auth` (sesión) y `next/cache` (`revalidatePath`,
que solo funciona dentro de una request real de Next) — todo lo demás corre
contra Prisma real.

## Seguridad

Ver [`docs/SEGURIDAD.md`](./docs/SEGURIDAD.md) para el detalle: modelo de
autorización, rate limiting de login, manejo de contraseñas/secretos y
vulnerabilidades conocidas de dependencias (con la razón de por qué no se
corrigieron todavía).

## Roadmap

- [x] Fase 1 — Base de datos real, autenticación y roles
- [x] Fase 2 — Páginas operativas leen de la base real
- [x] Fase 3 — Importación de Excel (RF15/RF16)
- [x] Fase 5 — Restricción de vistas por rol (RF13)
- [x] Fase 6 — Indicadores institucionales diferenciados por rol (+ KPIs por sede)
- [x] Fase 7 — Exportaciones a Excel y PDF
- [x] Fase 8 — Pantalla de auditoría
- [x] Fase 10 — Testing, seguridad y documentación
- [x] Fase 4 — Gestión de usuarios (editar, activar/desactivar, restablecer contraseña,
      alta de cualquier rol, dar acceso al portal a un Emprendedor)
- [x] Fase 11 — Motor de catálogo configurable (`Fase`/`Etapa`/`Instrumento`,
      `/configuracion`, `/ruta`, motor de formularios genérico, reglas de avance)
      según el Manual de Formatos y Metodologías de la Ruta de Emprendimiento
      (MEUNE-FUMC) — ver auditoría "Manual Ruta de Emprendimiento FUMC"
- [ ] Fase 12 — Entidades núcleo: `Cohorte`, equipo emprendedor, ficha de
      caracterización completa (sede, tipo de innovación, madurez, problema)
- [ ] Fase 13 — Activar primero: rúbrica de selección, consentimiento Ley 1581,
      bitácora completa, acta de compromiso, lienzos (BMC/VPC/DOFA/mapa de
      empatía/Customer Discovery/Design Thinking)
- [ ] Fase 14 — Resto del catálogo de Fase 2, KPIs de impacto por periodo,
      cierre de ruta (certificado + informe)
- [ ] Fase 15 — Pitch, convocatorias externas, terminología UIE↔MEUNE,
      gobernanza (versionado de formatos, matriz de responsables)
