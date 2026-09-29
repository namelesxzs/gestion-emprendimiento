# Documento técnico — Plataforma de la Ruta de Emprendimiento FUMC

**Sistema:** Plataforma web de acompañamiento a emprendedores de la Unidad de Innovación y Emprendimiento (UIE) — Mesa Universitaria de Emprendimiento (MEUNE), Fundación Universitaria María Cano.
**Destinatario:** equipo de TI que recibe el prototipo para sostenerlo, modificarlo o escalarlo.
**Documentos de origen:** `documentacion/encargo/Manual_Ruta_Emprendimiento_FUMC.docx` (Manual de Formatos y Metodologías, agosto 2026) y `documentacion/encargo/yeim.pdf` (especificación de requisitos).

---

## Contenido

1. [Qué es y qué hace](#1-qué-es-y-qué-hace)
2. [Arquitectura](#2-arquitectura)
3. [Tecnologías y versiones](#3-tecnologías-y-versiones)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Puesta en marcha](#5-puesta-en-marcha)
6. [Configuración (variables de entorno)](#6-configuración-variables-de-entorno)
7. [Modelo de datos](#7-modelo-de-datos)
8. [Roles, autenticación y autorización](#8-roles-autenticación-y-autorización)
9. [Módulos y rutas](#9-módulos-y-rutas)
10. [Catálogo configurable y motor de formularios](#10-catálogo-configurable-y-motor-de-formularios)
11. [Trazabilidad con el Manual](#11-trazabilidad-con-el-manual)
12. [Importación, exportación y archivos](#12-importación-exportación-y-archivos)
13. [Auditoría](#13-auditoría)
14. [Pruebas automatizadas](#14-pruebas-automatizadas)
15. [Recetas de mantenimiento](#15-recetas-de-mantenimiento)
16. [Despliegue y escalamiento](#16-despliegue-y-escalamiento)
17. [Solución de problemas](#17-solución-de-problemas)
18. [Pendientes y recomendaciones](#18-pendientes-y-recomendaciones)
19. [Glosario](#19-glosario)

---

## 1. Qué es y qué hace

Aplicación web que digitaliza la Ruta de Emprendimiento de la FUMC:

- **Registro de emprendimientos** con ficha de caracterización, equipo emprendedor y cohorte.
- **Historial de acompañamiento** tipo historia clínica: diagnóstico, recomendaciones, compromisos y avance.
- **Reuniones** con calendario mensual (programar, reagendar, cancelar).
- **Seguimiento por la cadena de valor** (Descubrir, Incubar, Formar, Fomentar, Financiar) y por **fases del Manual** (Pre-incubación, Incubación, Egreso / Post-incubación). Son dos ejes independientes.
- **Los 31 formatos del Manual** como formularios digitales: se diligencian por emprendimiento, se firman, se revisan, se imprimen y se exportan.
- **Puntos de control (gates)** que impiden cambiar de fase sin el formato de tránsito favorable y firmado por el asesor (Manual §5.2).
- **Indicadores** institucionales por sede y por cohorte, y un portal propio para cada emprendedor.
- **Importación de Excel**, **exportación a Excel y PDF**, y **auditoría** de todas las operaciones.

## 2. Arquitectura

Aplicación monolítica **Next.js (App Router)**. Frontend y backend viven en el mismo proyecto y se despliegan juntos.

```
Navegador (React)
   │  formularios → Server Actions        descargas → Route Handlers (/api/...)
   ▼
Next.js (servidor Node.js)
   ├─ src/proxy.ts ............ exige sesión en todas las rutas (salvo /login y /recuperar-acceso)
   ├─ src/app/**/page.tsx ..... páginas (Server Components): leen datos y verifican rol
   ├─ src/app/**/actions.ts ... mutaciones: requireRole → validación Zod → Prisma → auditoría
   ├─ src/app/api/** .......... exportaciones, plantilla de importación, archivos, Auth.js
   └─ src/lib/** .............. reglas de negocio, consultas, validaciones, exportadores
   ▼
Prisma ORM (adaptador better-sqlite3)
   ▼
SQLite (web/dev.db)   +   disco local (web/storage/documentos) para archivos subidos
```

Principios de diseño que conviene mantener:

1. **La autorización siempre se verifica en el servidor.** Ocultar un botón es solo comodidad visual. Toda mutación llama a `requireRole` o `requireSession` (`src/lib/authz.ts`).
2. **Toda entrada se valida con Zod** (`src/lib/validation/*`) antes de tocar la base de datos.
3. **Toda mutación queda auditada** con `registrarAuditoria` (`src/lib/audit.ts`).
4. **Los formatos del Manual son datos, no código.** Su estructura vive en la tabla `Instrumento`, en el campo `camposSchema`, y una sola pantalla los dibuja todos (sección 10).

## 3. Tecnologías y versiones

| Componente | Versión | Uso |
|---|---|---|
| Node.js | 20 o superior (probado con 24.18) | Entorno de ejecución |
| Next.js | 16.2.12 | Framework web (App Router, Server Actions, Turbopack) |
| React | 19.2.4 | Interfaz |
| TypeScript | 5 | Lenguaje |
| Prisma | 7.9.x | ORM y migraciones |
| better-sqlite3 | 13 | Motor de base de datos (SQLite) |
| Auth.js (next-auth) | 5.0.0-beta | Inicio de sesión con credenciales y sesión JWT |
| bcryptjs | 3 | Hash de contraseñas |
| Zod | 4 | Validación |
| Tailwind CSS | 4 | Estilos |
| ExcelJS | 4.4 | Importar y exportar `.xlsx` |
| @react-pdf/renderer | 4.6 | Exportar `.pdf` |
| Vitest | 4 | Pruebas unitarias y de integración |

> **Importante sobre Next.js 16:** esta versión cambia convenciones respecto a versiones anteriores. Por ejemplo, el middleware se llama `src/proxy.ts` y `params`/`searchParams` de las páginas son promesas. Antes de modificar código propio de Next, consulte la documentación incluida en `web/node_modules/next/dist/docs/`.
>
> **Importante sobre Prisma 7:** usa `web/prisma.config.ts` (no la URL en el esquema), exige un adaptador explícito (`src/lib/prisma.ts`) y genera el cliente en `src/generated/prisma`.

## 4. Estructura del repositorio

```
gestion-emprendimiento/
├── README.md
├── documentacion/
│   ├── DOCUMENTO_TECNICO.md        ← este documento
│   ├── README.md                   ← índice de la carpeta
│   ├── encargo/                    ← Manual (.docx), especificación (yeim.pdf), plantilla Excel original
│   └── herramientas-ia/            ← archivos de asistentes de programación (no forman parte de la app)
└── web/                            ← la aplicación
    ├── package.json
    ├── prisma.config.ts            ← configuración de Prisma (esquema, migraciones, seed)
    ├── next.config.ts              ← cabeceras de seguridad HTTP
    ├── .env.example                ← plantilla de variables de entorno
    ├── docs/SEGURIDAD.md           ← decisiones de seguridad
    ├── prisma/
    │   ├── schema.prisma           ← modelo de datos
    │   ├── migrations/             ← historial de cambios del esquema (no editar a mano)
    │   ├── catalogoSeed.ts         ← DEFINICIÓN de fases, etapas, los 31 formatos y reglas de avance
    │   ├── seedCatalogo.ts         ← carga el catálogo sin borrar nada (idempotente)
    │   └── seed.ts                 ← datos y usuarios de ejemplo (BORRA datos operativos)
    ├── storage/documentos/         ← archivos subidos (no se versiona)
    └── src/
        ├── proxy.ts                ← middleware: exige sesión
        ├── auth.ts                 ← configuración de Auth.js
        ├── app/                    ← páginas, Server Actions y rutas /api
        ├── components/             ← componentes de interfaz
        ├── lib/                    ← lógica de negocio (ver abajo)
        ├── generated/prisma/       ← cliente Prisma generado (no editar)
        ├── test/                   ← utilidades de prueba
        └── types/next-auth.d.ts    ← tipos de sesión (rol, emprendedorId)
```

Archivos clave de `src/lib/`:

| Archivo | Responsabilidad |
|---|---|
| `prisma.ts` | Instancia única del cliente Prisma |
| `authz.ts` | `requireSession`, `requireRole`, `requireOwnEmprendedor` |
| `audit.ts` | `registrarAuditoria` |
| `queries.ts` | Consultas de lectura para las páginas |
| `reglasAvance.ts` | Motor de gates (verifica si se puede cambiar de fase) |
| `catalogo/tipos.ts` | Tipos del motor de formularios (`CampoInstrumentoDef`) |
| `catalogo/permisos.ts` | Quién diligencia y quién revisa cada formato |
| `validation/catalogo.ts` | Validación de respuestas, tablas, totales y firmas |
| `importer.ts`, `plantilla.ts` | Importador de Excel y su plantilla |
| `exports/*`, `pdf/*` | Exportaciones a Excel y PDF |
| `kpis.ts`, `view.ts` | Cálculo de indicadores |
| `loginRateLimit.ts`, `password.ts` | Bloqueo por intentos fallidos y contraseñas temporales |

## 5. Puesta en marcha

### Requisitos

- Node.js 20 o superior y npm.
- Git.
- En Windows, `better-sqlite3` trae binarios precompilados; si `npm install` intenta compilar, instalar las "Build Tools" de Visual Studio.

### Primera instalación

```bash
git clone https://github.com/namelesxzs/gestion-emprendimiento.git
cd gestion-emprendimiento/web
npm install
cp .env.example .env          # en Windows: copy .env.example .env
npx auth secret               # genera un secreto: cópielo en AUTH_SECRET dentro de .env
npx prisma migrate deploy     # crea dev.db con todas las tablas
npx prisma generate           # genera el cliente en src/generated/prisma
npx prisma db seed            # OPCIONAL: catálogo + datos y usuarios de ejemplo
npm run dev                   # http://localhost:3000
```

Si no se quieren datos de ejemplo, en lugar de `prisma db seed` ejecute solo el catálogo:

```bash
npx tsx prisma/seedCatalogo.ts
```

Después hay que crear el primer usuario Administrador. La manera más simple es correr el seed una vez en un ambiente de pruebas; en producción, insertarlo con un script propio (hash con `bcryptjs`, 10 rondas) y cambiarle la contraseña al entrar.

### Usuarios de ejemplo (solo si se ejecutó `prisma db seed`)

Todos tienen la contraseña `uie-dev-2026`.

| Correo | Rol |
|---|---|
| `admin@uie.local` | Administrador |
| `coordinador@uie.local` | Coordinador |
| `docente.a@uie.local`, `docente.b@uie.local`, `docente.c@uie.local` | Docente (asesor) |
| `portal.ana@test.com` | Emprendedor (portal de Ana Gómez) |

> Nunca ejecute `prisma db seed` contra una base de producción: **borra** emprendedores, acompañamientos, reuniones y respuestas de formatos. La configuración del catálogo, las cohortes y las reglas de avance sí se conservan.

### Comandos habituales

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` + `npm start` | Compilar y servir en modo producción |
| `npm run test` | Ejecutar todas las pruebas |
| `npm run lint` | Revisar el estilo del código |
| `npx prisma studio` | Explorar y editar la base de datos en el navegador |
| `npx prisma migrate dev --name <nombre>` | Crear una migración tras cambiar `schema.prisma` |
| `npx prisma migrate deploy` | Aplicar migraciones pendientes (producción) |

## 6. Configuración (variables de entorno)

Se definen en `web/.env`, que nunca se sube al repositorio.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Base SQLite. Valor por defecto: `file:./dev.db` |
| `AUTH_SECRET` | Sí | Secreto para firmar la sesión. Generar con `npx auth secret`, uno distinto por ambiente |

## 7. Modelo de datos

Definido en `web/prisma/schema.prisma`. Los estados se guardan como texto con valores cerrados.

| Modelo | Propósito | Campos y relaciones relevantes |
|---|---|---|
| `Usuario` | Cuentas de acceso | `rol` (ADMINISTRADOR, DOCENTE, COORDINADOR, EMPRENDEDOR), `sede`, `activo`, `debeCambiarPassword`, `emprendedorId` (solo cuentas de portal) |
| `Emprendedor` | Emprendimiento y su titular | `etapa` (cadena de valor), `faseId` (fase del Manual), `estado` (Activo, Graduado, Inactivo), ficha de caracterización (sede, programa, facultad, tipo de innovación, madurez, problema, idea, canal), `cohorteId`, `responsableId` (asesor) |
| `IntegranteEquipo` | Miembros del equipo emprendedor | Nombre, documento, programa, semestre, correo, teléfono, rol en el equipo |
| `Cohorte` | Grupo de ingreso | Nombre, sede, fechas, activa |
| `Acompanamiento` | Sesión de acompañamiento (historial) | Diagnóstico, recomendaciones, avance |
| `Compromiso` | Compromisos derivados de un acompañamiento | `estado` (Pendiente, En proceso, Cumplido), fecha límite |
| `Reunion` | Agenda | `estado` (Programada, Reagendada, Cancelada, Realizada) |
| `Documento` | Archivo de soporte por etapa | `estado` (Pendiente, Aprobado, Rechazado), ruta en disco |
| `Fase` | Fases del Manual | `clave`, `activa`, `orden` |
| `Etapa` | Etapas de la cadena de valor | `clave` = el mismo texto guardado en `Emprendedor.etapa` |
| `Instrumento` | Cada formato del Manual | `clave`, `camposSchema` (JSON con la estructura del formulario), `responsableDiligencia`, `responsableRevisa`, `plazoRevisionDias`, `permiteMultiples`, `transversal`, `activo`, `origenManual` |
| `InstrumentoRespuesta` | Un formato diligenciado para un emprendedor | `datos` (JSON), `registradoPorId`, `estadoRevision` (Pendiente, Revisado, Devuelto), `revisadoPorId`, `comentarioRevision` |
| `ReglaAvance` | Gate entre fases | `faseOrigenId` (vacío = desde cualquier fase), `faseDestinoId`, `instrumentosClaves` (JSON), `activa` |
| `AuditLog` | Bitácora de auditoría | Usuario, rol, entidad, acción, valor anterior y nuevo, origen |
| `ImportRun` | Cada importación de Excel | Estado, resumen |
| `SolicitudRestablecimiento` | Pedidos de "olvidé mi contraseña" | Los atiende el Administrador |
| `LoginAttempt` | Intentos de inicio de sesión | Base del bloqueo por fuerza bruta |

## 8. Roles, autenticación y autorización

| Rol | Alcance |
|---|---|
| **Administrador** | Todo, más gestión de usuarios (`/usuarios`), auditoría (`/auditoria`) y configuración del catálogo (`/configuracion`) |
| **Docente (asesor)** | Registrar y editar emprendedores, acompañamientos, reuniones y documentos; importar Excel; diligenciar cualquier formato; firmar como asesor; revisar los formatos que el Manual asigna al asesor |
| **Coordinador** | Consulta de indicadores y exportaciones; revisa los formatos que el Manual le asigna; no diligencia ni modifica datos operativos |
| **Emprendedor** | Portal propio: su progreso, historial, reuniones y los formatos que el Manual le asigna. Nunca ve datos de otros emprendedores |

- **Autenticación:** Auth.js con correo y contraseña (`src/auth.ts`), sesión JWT y contraseñas con bcrypt. Tras 5 intentos fallidos en 15 minutos, el correo queda bloqueado (`src/lib/loginRateLimit.ts`).
- **Tres capas de autorización:**
  1. `src/proxy.ts` exige sesión.
  2. Cada página verifica el rol.
  3. Cada acción verifica el rol antes de tocar datos.
- **Permisos por formato** (`src/lib/catalogo/permisos.ts`): se deducen del texto de `responsableDiligencia` y `responsableRevisa` de cada formato. Si el texto contiene "emprendedor", el Emprendedor puede diligenciarlo. Si `responsableRevisa` contiene "asesor", revisa el Docente; si contiene "coordinador", revisa el Coordinador. El Administrador siempre puede.

El detalle de seguridad y de las vulnerabilidades conocidas de dependencias está en `web/docs/SEGURIDAD.md`.

## 9. Módulos y rutas

| Ruta | Rol | Función |
|---|---|---|
| `/login`, `/recuperar-acceso`, `/cambiar-password` | Público / sesión | Acceso y contraseñas |
| `/` | Todos | Personal: panel de indicadores. Emprendedor: "Mi progreso" con sus formatos |
| `/emprendedores` | Admin, Docente, Coordinador | Lista y detalle; ficha, equipo, documentos, formatos del Manual, acceso al portal |
| `/acompanamientos` | Todos (Emprendedor: solo los suyos) | Historial |
| `/reuniones` | Todos (Emprendedor: solo las suyas) | Calendario y agenda |
| `/ruta` | Todos | Fases del Manual en pestañas, catálogo de formatos y exportación consolidada |
| `/formatos/[clave]` | Todos (Emprendedor: solo lo suyo) | Formato imprimible, en blanco o con los datos de un registro (`?respuesta=<id>`) |
| `/configuracion` | Administrador | Fases, etapas, formatos, reglas de avance, cohortes |
| `/importar` | Admin, Docente | Importación de Excel |
| `/usuarios` | Administrador | Gestión de cuentas |
| `/auditoria` | Administrador | Consulta de la bitácora |
| `/api/exportar/emprendedores`, `/acompanamientos`, `/indicadores`, `/emprendedores/[id]/ficha` | Personal | Descargas en Excel y PDF |
| `/api/exportar/instrumentos` | Personal | Excel con todos los formatos diligenciados; filtros `cohorteId`, `sede`, `asesorId` |
| `/api/plantilla` | Admin, Docente | Plantilla de importación |
| `/api/documentos/[id]/archivo` | Según permisos | Descarga de un documento subido |

## 10. Catálogo configurable y motor de formularios

Es el núcleo que implementa el Manual.

### 10.1 Cómo funciona

1. `prisma/catalogoSeed.ts` define las fases, las etapas, los **31 formatos** (con sus campos) y las reglas de avance.
2. `prisma/seedCatalogo.ts` los carga con `upsert` por `clave`. Se puede ejecutar las veces que se quiera: actualiza la estructura sin borrar respuestas ni la configuración del Administrador (qué está activo, plazos). Las reglas de avance solo se crean si no existe ya una para la misma transición.
3. Cada formato guarda su estructura en `Instrumento.camposSchema`.
4. `src/components/InstrumentoForm.tsx` dibuja cualquier formato a partir de esa estructura. No existe una pantalla por formato.
5. `src/app/instrumentos/actions.ts` guarda la respuesta (`guardarRespuestaInstrumento`) y registra la revisión (`revisarRespuestaInstrumento`).
6. `src/lib/validation/catalogo.ts` valida, calcula totales y sella firmas, siempre en el servidor.

### 10.2 Tipos de campo (`src/lib/catalogo/tipos.ts`)

| Tipo | Se dibuja como | Propiedades |
|---|---|---|
| `texto`, `textarea`, `fecha` | Campo de texto, área de texto o fecha | `requerido`, `ayuda` |
| `numero` | Campo numérico | `min`, `max` (por ejemplo 1–5 en las rúbricas) |
| `seleccion` | Lista desplegable | `opciones`, `valorHabilitaAvance` (gates) |
| `booleano` | Casilla de verificación | — |
| `tabla` | Tabla | `columnas` (campos anidados), `filas` (filas fijas: criterios o indicadores) o `filasIniciales` (filas libres que el usuario agrega) |
| `total` | Número calculado | `sumaDe: { tabla, columna }`, `max` |
| `firma` | Nombre más casilla "Confirmo que firmo" | `firmante: "asesor" \| "emprendedor"` |

Ejemplo (rúbrica 6.3 resumida):

```ts
{
  clave: "criterios", etiqueta: "Criterios de evaluación", tipo: "tabla", requerido: true,
  filas: [{ clave: "innovacion", etiqueta: "Innovación", descripcion: "Grado de novedad..." }],
  columnas: [
    { clave: "puntaje", etiqueta: "Puntaje (1-5)", tipo: "numero", min: 1, max: 5, requerido: true },
    { clave: "observaciones", etiqueta: "Observaciones", tipo: "textarea" },
  ],
},
{ clave: "puntajeTotal", etiqueta: "Puntaje total", tipo: "total", sumaDe: { tabla: "criterios", columna: "puntaje" }, max: 25 },
{ clave: "firmaAsesor", etiqueta: "Firma del asesor", tipo: "firma", firmante: "asesor", requerido: true },
```

Así se guarda en `InstrumentoRespuesta.datos`:

```json
{
  "criterios": [{ "fila": "innovacion", "puntaje": 4, "observaciones": "" }],
  "puntajeTotal": 21,
  "firmaAsesor": { "nombre": "…", "firmadoPorId": "…", "firmadoPorNombre": "…", "firmadoPorRol": "DOCENTE", "fecha": "ISO-8601" }
}
```

### 10.3 Reglas del motor

- **Registros múltiples.** Si `permiteMultiples` es verdadero (bitácoras, entrevistas, BMC por gate, gates, KPIs por periodo, rúbricas de pitch…), cada envío crea un registro nuevo y se conserva el historial. Si es falso, hay un único registro que se edita.
- **Transversales.** Si `transversal` es verdadero (bitácora 6.10, encuesta 7.6), el formato aparece en todas las fases.
- **Firmas.** El servidor sella usuario, rol y fecha. Un Emprendedor no puede poner la firma del asesor aunque la envíe. Editar un registro sin cambiar el nombre del firmante conserva el sello original.
- **Totales.** Siempre los calcula el servidor; el valor que muestra la pantalla es solo informativo.
- **Revisión (Manual §5.6).** Cada registro nace "Pendiente" y el responsable lo marca "Revisado" o lo "Devuelve" con un comentario obligatorio. Si se edita después, vuelve a "Pendiente". Si el formato tiene `plazoRevisionDias` y se vence el plazo, se marca como "revisión vencida".

### 10.4 Gates de avance de fase (`src/lib/reglasAvance.ts`)

Al cambiar la fase de un emprendedor (formulario de edición en `/emprendedores`), se evalúan las `ReglaAvance` activas hacia la fase destino:

1. Cada formato exigido debe tener al menos una respuesta.
2. Sobre la **respuesta más reciente**:
   - todo campo `seleccion` con `valorHabilitaAvance` debe tener exactamente ese valor ("Avanza a incubación" o "Gradúa");
   - toda firma requerida debe estar puesta.

Vienen sembradas dos reglas: pre-incubación → incubación (formato 6.13) e incubación → egreso (anexo 7.5). El Administrador puede desactivarlas o crear otras en `/configuracion`. Sin reglas activas, el cambio de fase queda libre.

## 11. Trazabilidad con el Manual

Código de origen: `6.x` = anexos de Fase 1; `7·x` = fila de la tabla del §4; `anexo 7.x` = anexo con tabla de diligenciamiento propia.

| Manual | Formato | Clave | Fase | Diligencia | Revisa | Registros |
|---|---|---|---|---|---|---|
| 6.1 | Ficha de inscripción / postulación | `ficha_inscripcion` | Pre-incubación | Emprendedor | Asesor | Uno |
| 6.2 | Ficha de caracterización del emprendimiento | `ficha_caracterizacion` | Pre-incubación | Asesor | Coordinador | Uno |
| 6.3 | Rúbrica de evaluación y selección de ideas | `rubrica_seleccion_ideas` | Pre-incubación | Asesor / comité evaluador | Coordinador | Uno |
| 6.4 | Mapa de empatía | `mapa_empatia` | Pre-incubación | Emprendedor, con el asesor | Asesor | Uno |
| 6.5 | Formato de Customer Discovery (entrevista de problema) | `customer_discovery` | Pre-incubación | Emprendedor | Asesor | Varios |
| 6.6 | Business Model Canvas (versión inicial) | `bmc_inicial` | Pre-incubación | Emprendedor, con el asesor | Asesor | Varios |
| 6.7 | Value Proposition Canvas | `vpc` | Pre-incubación | Emprendedor, con el asesor | Asesor | Uno |
| 6.8 | Matriz DOFA | `matriz_dofa` | Pre-incubación | Emprendedor, con el asesor | Asesor | Uno |
| 6.9 | Tablero Design Thinking | `tablero_design_thinking` | Pre-incubación | Emprendedor, con el asesor | Asesor | Uno |
| 6.10 | Bitácora de mentoría / acompañamiento | `bitacora_mentoria` | Pre-incubación (transversal) | Asesor | Coordinador | Varios |
| 6.11 | Acta de compromiso / carta de aceptación a la ruta | `acta_compromiso` | Pre-incubación | Asesor | Coordinador | Uno |
| 6.12 | Consentimiento informado y manejo de datos / PI | `consentimiento_datos` | Pre-incubación | Emprendedor | Asesor | Uno |
| 6.13 | Formato de tránsito de fase (gate pre-incubación → incubación) | `transito_pre_incubacion_incubacion` | Pre-incubación | Asesor | Coordinador | Varios |
| 7·1 | Business Model Canvas (versión validada e iterada) | `bmc_validado` | Incubación | Emprendedor, con el asesor | Asesor | Varios |
| 7·2 | Plan de negocio estructurado | `plan_negocio` | Incubación | Emprendedor, con el asesor | Asesor | Uno |
| 7·3 | Modelo financiero (P&G, flujo de caja, punto de equilibrio) | `modelo_financiero` | Incubación | Emprendedor, con el asesor | Asesor | Uno |
| 7·4 / anexo 7.1 | Formato de validación de MVP (experimentos Lean Startup) | `validacion_mvp` | Incubación | Emprendedor | Asesor | Varios |
| 7·5 | Estudio de mercado (tamaño, competencia, segmentación) | `estudio_mercado` | Incubación | Emprendedor, con el asesor | Asesor | Uno |
| 7·6 / anexo 7.2 | Matriz de riesgos | `matriz_riesgos` | Incubación | Asesor | Coordinador | Uno |
| 7·7 | Roadmap / plan de trabajo con hitos | `roadmap_hitos` | Incubación | Emprendedor, con el asesor | Asesor | Uno |
| 7·8 / anexo 7.3 | Formato de seguimiento de KPIs / indicadores de impacto | `kpis_impacto` | Incubación | Asesor | Coordinador | Varios |
| 7·9 | Bitácora de mentoría especializada | `bitacora_especializada` | Incubación | Asesor | Coordinador | Varios |
| 7·10 | Formato de estructura legal y tributaria | `estructura_legal_tributaria` | Incubación | Emprendedor, con el asesor | Asesor | Uno |
| 7·11 | Formato de propiedad intelectual / registro de marca o patente | `propiedad_intelectual` | Incubación | Emprendedor, con el asesor | Asesor | Uno |
| 7·12 | Plantilla de Pitch Deck | `pitch_deck` | Incubación | Emprendedor | Asesor | Uno |
| 7·13 / anexo 7.4 | Rúbrica de evaluación de pitch | `rubrica_pitch` | Incubación | Jurado / asesor evaluador | Coordinador | Varios |
| 7·14 | Formato de postulación a convocatorias externas | `postulacion_convocatorias` | Incubación | Asesor | Coordinador | Varios |
| anexo 7.5 | Formato de tránsito de fase (gate de salida de incubación) | `transito_salida_incubacion` | Incubación | Asesor | Coordinador | Varios |
| 7·15 / anexo 7.6 | Encuesta de satisfacción del emprendedor | `encuesta_satisfaccion` | Incubación (transversal) | Emprendedor | Coordinador | Varios |
| 7·16 | Certificado de graduación / informe de cierre de ruta | `certificado_graduacion` | Incubación | Asesor | Coordinador | Uno |
| 7·17 | Formato de seguimiento post-incubación | `seguimiento_post_incubacion` | Incubación | Asesor | Coordinador | Varios |

Otras secciones del Manual y dónde se implementan:

| Manual | Implementación |
|---|---|
| §2 Marcos metodológicos (Design Thinking, Lean Startup, BMC/VPC vivos) | Descripción de cada fase en `/ruta`; BMC versionado por gate |
| §5.1 BMC actualizado en cada gate | `bmc_inicial` y `bmc_validado` con registros múltiples y campo "versión / gate" |
| §5.2 Gate obligatorio firmado por el asesor | Reglas de avance sembradas y `reglasAvance.ts` |
| §5.3 Bitácora única y longitudinal | `bitacora_mentoria` transversal y con registros múltiples |
| §5.5 Una base por cohorte, sede y asesor | `/api/exportar/instrumentos` con filtros |
| §5.6 Quién diligencia, quién revisa y en qué plazo | `responsableDiligencia`, `responsableRevisa`, `plazoRevisionDias` y flujo de revisión |
| §5.7 Revisión semestral del manual | Edición de metadatos en `/configuracion`; estructura en `catalogoSeed.ts` |
| Comentario de revisión "Fases en pestañas separadas" | Pestañas en `/ruta` |

Protección contra regresiones: `src/lib/catalogo/fidelidadManual.test.ts` falla si el catálogo deja de corresponder al Manual.

## 12. Importación, exportación y archivos

- **Importar Excel** (`/importar`): solo `.xlsx` de hasta 5 MB, con la plantilla de `/api/plantilla`. Busca coincidencias por correo, muestra una vista previa de las diferencias y aplica todo en una sola transacción auditada. Nunca borra emprendedores por no aparecer en el archivo.
- **Exportar:** emprendedores, acompañamientos e indicadores (Excel y PDF), ficha PDF por emprendedor y formatos diligenciados (Excel, una hoja por formato).
- **Formatos imprimibles:** `/formatos/<clave>` (en blanco) y `/formatos/<clave>?respuesta=<id>` (diligenciado, con firmas y estado de revisión). Se imprimen o se guardan como PDF desde el navegador.
- **Documentos subidos:** se guardan en `web/storage/documentos/<emprendedorId>/`, con un máximo de 10 MB por archivo. Esta carpeta no está en Git: **hay que incluirla en los respaldos**.

## 13. Auditoría

Toda creación, edición, revisión, importación e inicio de sesión queda en `AuditLog` con usuario, rol, entidad, acción y valores anterior y nuevo. Se consulta y filtra en `/auditoria` (solo Administrador). Para auditar una acción nueva, llame a `registrarAuditoria({...})` después de la escritura.

## 14. Pruebas automatizadas

- `npm run test` ejecuta 157 pruebas: unitarias (validaciones, KPIs, permisos, fidelidad al Manual) y de integración contra una base SQLite real y aislada (`test.db`), que `vitest.globalSetup.mts` crea y borra en cada ejecución. Nunca tocan `dev.db`.
- Las pruebas de acciones simulan la sesión con `vi.mock("@/auth")` y `revalidatePath` con `vi.mock("next/cache")`. Siga ese patrón en pruebas nuevas.
- Antes de entregar cualquier cambio, ejecute: `npm run lint`, `npx tsc --noEmit`, `npm run test` y `npm run build`.

## 15. Recetas de mantenimiento

**Agregar o cambiar un campo de un formato existente**
1. Edite el formato en `prisma/catalogoSeed.ts` (busque por su `clave`).
2. Ejecute `npx tsx prisma/seedCatalogo.ts`.
3. Si el cambio se aparta del Manual, ajuste `fidelidadManual.test.ts` y ejecute `npm run test`.
- Las respuestas ya guardadas no se reescriben. Un campo nuevo aparece vacío en los registros viejos; un campo eliminado deja de mostrarse, pero su dato sigue en el JSON.

**Agregar un formato nuevo**
1. Agregue un objeto a `INSTRUMENTOS_SEED` con una `clave` única.
2. Ejecute `npx tsx prisma/seedCatalogo.ts`.
3. Aparece automáticamente en `/ruta`, en el detalle del emprendedor y en las exportaciones, sin programar pantallas.

**Cambiar quién diligencia o revisa un formato, o su plazo**
- Desde `/configuracion` → pestaña Instrumentos → Editar (Administrador). No requiere código.

**Activar o desactivar un formato o una fase**
- Desde `/configuracion`. Desactivar no borra lo diligenciado.

**Exigir otro formato para pasar de fase**
- `/configuracion` → Reglas de avance → nueva regla. Para que exija una decisión concreta, el formato debe tener un campo `seleccion` con `valorHabilitaAvance`.

**Cambiar el modelo de datos**
1. Edite `prisma/schema.prisma`.
2. Ejecute `npx prisma migrate dev --name descripcion_del_cambio`.
3. Ejecute `npx prisma generate`.
4. **Reinicie `npm run dev`**: el servidor en ejecución conserva el cliente anterior.

**Agregar una sede**
- Edite `SEDES` en `src/lib/validation/usuario.ts` y las opciones del campo `sede` de `ficha_caracterizacion` en `catalogoSeed.ts`.

**Restablecer la contraseña de un usuario**
- `/usuarios` → Restablecer (Administrador). Genera una contraseña temporal y obliga a cambiarla al entrar.

**Respaldo**
- Copie `web/dev.db` (con el servidor detenido, o con `sqlite3 dev.db ".backup copia.db"`) y la carpeta `web/storage/`.

## 16. Despliegue y escalamiento

### Opción A — Servidor institucional (recomendada para el volumen actual)

Un servidor Windows o Linux con Node.js 20 o superior:

```bash
cd web && npm ci && npx prisma migrate deploy && npx prisma generate && npm run build
npm start          # puerto 3000; publicar detrás de IIS, Nginx o Apache con HTTPS
```

- Ejecute el proceso como servicio (pm2 o NSSM en Windows, systemd en Linux).
- **HTTPS es obligatorio**: sin él, la cookie de sesión viaja sin cifrar.
- Genere un `AUTH_SECRET` propio para producción y **no** ejecute `prisma db seed`.
- Programe el respaldo diario de `dev.db` y `storage/`.

### Opción B — Escalar a PostgreSQL

SQLite admite un solo escritor a la vez: sirve para una institución con decenas de usuarios. Para más concurrencia o varios servidores:

1. En `schema.prisma`, cambie `provider = "sqlite"` a `"postgresql"`.
2. Reemplace el adaptador de `src/lib/prisma.ts` por `@prisma/adapter-pg` (ver `documentacion/herramientas-ia/.agents/skills/prisma-database-setup/references/postgresql.md`).
3. Regenere las migraciones contra la base nueva con `npx prisma migrate dev --name init_postgres` y migre los datos.
4. Mueva los archivos de `storage/` a un almacenamiento compartido (SharePoint u otro), porque varios servidores no comparten disco local.

### Plataformas serverless (Vercel y similares)

No funcionan tal como está el proyecto: SQLite y `storage/` necesitan disco persistente. Requieren antes la opción B.

### Integración con Microsoft 365

Prevista pero no implementada (inicio de sesión institucional, calendario de Outlook, SharePoint). Auth.js admite el proveedor Microsoft Entra ID; se agregaría en `src/auth.ts` conservando la tabla `Usuario` para los roles.

## 17. Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `PrismaClientValidationError` o "Unknown argument" tras actualizar el código | El cliente Prisma está desactualizado. Ejecute `npx prisma generate` y **reinicie** `npm run dev` |
| Errores 500 en `/api/auth/...` o el botón "Salir" no responde | El servidor de desarrollo quedó en mal estado (suele pasar con poca memoria RAM). Cierre el proceso de Node y vuelva a iniciarlo |
| Error "Port 3000 in use" | Ya hay un servidor corriendo. Ciérrelo o use `npm run dev -- -p 3001` |
| Error "database is locked" | Otro proceso (por ejemplo Prisma Studio) tiene la base abierta en escritura. Ciérrelo |
| El cambio de fase se rechaza | Es el gate del Manual: diligencie el formato de tránsito con decisión favorable y firma del asesor, o revise las reglas en `/configuracion` |
| Un emprendedor no ve "Diligenciar" en un formato | Según el Manual ese formato lo diligencia el asesor. Se configura en `responsableDiligencia` |
| La primera carga de una página tarda mucho en desarrollo | Turbopack compila cada ruta la primera vez; en producción (`npm run build`) no ocurre |

## 18. Pendientes y recomendaciones

1. **Editor visual de formatos.** Hoy la estructura de campos se edita en `catalogoSeed.ts`; desde la interfaz solo se editan metadatos.
2. **Política de seguridad de contenido (CSP)** y actualización de dependencias con vulnerabilidades conocidas (ver `docs/SEGURIDAD.md`).
3. **Cartera por asesor.** Hoy un Docente ve a todos los emprendedores; la especificación sugiere limitarlo a los asignados (`responsableId`).
4. **Formatos sin tabla en el Manual** (plan de negocio, modelo financiero, pitch deck, etc.): tienen campos mínimos y la referencia a un archivo. Conviene definirlos con la MEUNE, incluido el "7.1 Instructivo de Plan de Negocio FUMC" que el índice del Manual menciona sin desarrollarlo.
5. **Integración con Microsoft 365** y **notificaciones** de reuniones y plazos de revisión vencidos.
6. **Homologación con Creame** (§5.4 del Manual): comparar los formatos con los de la incubadora antes de ampliarlos.

## 19. Glosario

| Término | Significado |
|---|---|
| Fase | Pre-incubación, Incubación o Egreso (Manual) |
| Etapa | Paso de la cadena de valor institucional (Descubrir … Financiar), independiente de la fase |
| Instrumento / formato | Plantilla del Manual (ficha, rúbrica, lienzo, acta…) |
| Respuesta / registro | Un formato diligenciado para un emprendedor |
| Gate | Punto de control para cambiar de fase |
| Cohorte | Grupo de emprendimientos que ingresan juntos |
| MEUNE | Mesa Universitaria de Emprendimiento |
| Server Action | Función de servidor que Next.js invoca desde un formulario |
| Seed | Script que carga datos iniciales en la base |
