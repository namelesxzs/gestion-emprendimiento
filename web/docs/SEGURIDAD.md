# Seguridad

Notas de la revisión de seguridad hecha en Fase 10, y lo que se decidió hacer
con cada hallazgo. Última actualización: 2026-08-22.

## Autorización

- Cada server action y route handler que lee o escribe datos llama a
  `requireRole(...)` (`src/lib/authz.ts`) **en el servidor**, nunca se confía en
  que la UI oculte un botón. `requireRole` lanza `AuthzError` (401 sin sesión,
  403 con rol incorrecto).
- Defensa en profundidad en tres capas: `src/proxy.ts` (middleware) redirige a
  `/login` a cualquier request sin sesión sobre casi todas las rutas —
  incluidas las de `/api/*` salvo `/api/auth`—; cada página server component
  vuelve a chequear el rol y hace `redirect()` si no corresponde; y cada
  server action/route handler vuelve a chequear con `requireRole` antes de
  tocar la base de datos. Perder una de las tres capas no deja la app abierta.
- Un Docente puede editar cualquier Emprendedor, no solo los que tiene
  asignados como responsable — es una decisión de producto (equipo
  colaborativo dentro de la UIE), no un descuido; ver el mensaje del commit
  de Fase 5.
- El rol Emprendedor nunca recibe datos de otros emprendedores: el filtro se
  aplica en la consulta a la base (`getEmprendedores(soloEmprendedorId)`), no
  después de traer todo.

## Contraseñas y secretos

- Contraseñas con `bcrypt` (10 rounds), nunca en texto plano ni en logs ni en
  `AuditLog` (el registro de auditoría de altas de Usuario explícitamente
  excluye `passwordHash`).
- `AUTH_SECRET` vive solo en `.env` (nunca commiteado — `.gitignore` excluye
  `.env*` salvo `.env.example`). Generar uno nuevo por ambiente con
  `npx auth secret`, nunca reusar el de otro ambiente.
- `prisma/seed.ts` crea usuarios de prueba con una contraseña **compartida y
  conocida** (`uie-dev-2026`, impresa en consola al correr el seed). Es
  intencional para desarrollo — **nunca correr `prisma db seed` contra una
  base de datos de producción**, y si alguna vez se hizo por error, rotar esas
  contraseñas de inmediato.

## Rate limiting de login

Antes de Fase 10 no había ningún límite de intentos — un atacante podía
probar contraseñas indefinidamente contra cualquier correo. Ahora
(`src/lib/loginRateLimit.ts`):

- Se registra cada intento de login (éxito o fracaso) en `LoginAttempt`,
  incluso cuando el correo no existe — si no, enumerar correos quedaría fuera
  del límite.
- Tras **5 intentos fallidos en 15 minutos** para un mismo correo, el login
  se bloquea — y el bloqueo se revisa *antes* de siquiera intentar
  autenticar (`src/app/login/actions.ts`), así que ni gasta el `bcrypt.compare`
  ni deja pasar la contraseña correcta mientras está bloqueado.
- Los intentos de más de 24h se limpian solos en cada escritura — no hay un
  job de limpieza aparte.

## Validación de entrada

- Todo formulario y toda fila del importador de Excel se valida con Zod
  (`src/lib/validation/*`) antes de tocar la base.
- El importador de Excel: solo `.xlsx`, máximo 5MB (`TAMANO_MAXIMO_BYTES` en
  `src/lib/importer.ts`), y el parseo está envuelto en `try/catch` — un
  archivo corrupto devuelve un error controlado, no un 500.
- Sin SQL injection posible: todo el acceso a datos pasa por Prisma
  (queries parametrizadas), no hay SQL crudo en ningún lado del código de
  aplicación.
- Sin XSS: React escapa todo por defecto; no hay ningún `dangerouslySetInnerHTML`
  en el código de la aplicación.

## Cabeceras HTTP

`next.config.ts` agrega `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy` y `Strict-Transport-Security` a toda
respuesta.

**No se agregó Content-Security-Policy.** Definir una CSP correcta requiere
probar cada ruta (Next inyecta scripts de hidratación, Tailwind puede
requerir estilos inline) para no romper nada, y esa verificación exhaustiva
no se alcanzó a hacer en esta fase. Queda como pendiente explícito, no como
descuido.

## Vulnerabilidades conocidas en dependencias (`npm audit`)

`npm audit fix` (sin cambios que rompan nada) ya se aplicó. Quedan 8
vulnerabilidades que **requieren `--force`** — se decidió NO aplicarlas
ahora porque el fix es peor que el problema:

| Paquete | Vía | Por qué no se aplicó el fix |
|---|---|---|
| `deepmerge-ts` | `prisma` → `@prisma/config` | El fix **downgradea** Prisma a 6.12.0 (versión anterior a la que usa este proyecto). Además, el merge vulnerable ocurre al fusionar la config de Prisma en build/CLI time, no procesando datos de un usuario final — no es explotable a través de la app en producción. |
| `postcss`, `sharp` | `next` (bundleados) | El fix sube Next a 16.3.2, fuera del rango declarado — requiere probar toda la app antes de subir. Los CVEs de `sharp` son sobre transformación de imágenes; esta app no usa `next/image` con imágenes subidas por usuarios (el único upload es el Excel del importador), así que no hay una ruta de ataque real hoy. |
| `uuid` | `exceljs` | El fix **downgradea** ExcelJS a 3.4.0. `uuid` se usa internamente por ExcelJS para IDs de objetos, no procesa tamaños/buffers controlados por el usuario en el flujo de esta app (generar plantillas/exportar `.xlsx` con datos ya validados). |

Revisar de nuevo cuando Next/Prisma/ExcelJS publiquen una versión compatible
que ya no dependa de las versiones vulnerables — no hace falta forzar un
downgrade mientras tanto.

## Para producción

- **HTTPS obligatorio.** La cookie de sesión de Auth.js solo se marca
  `Secure` automáticamente si el sitio corre sobre https — sin eso, la
  sesión viaja en claro.
- SQLite (`better-sqlite3`) es de un solo escritor a la vez — está bien para
  el volumen actual (una institución, decenas de usuarios), pero si la
  concurrencia de escritura crece, migrar a Postgres es la salida natural
  (Prisma ya abstrae el motor).
- Hacer backup periódico del archivo de base de datos — no hay ningún
  mecanismo de respaldo automático hoy.
- Rotar `AUTH_SECRET` y las contraseñas de cualquier cuenta creada por el
  seed antes de considerar el ambiente productivo.
