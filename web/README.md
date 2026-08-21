# Plataforma UIE — Acompañamiento a Emprendedores

Plataforma web para la gestión integral del acompañamiento a emprendedores de la
Unidad de Innovación y Emprendimiento (UIE) de la Fundación Universitaria María Cano.

Permite registrar emprendedores, llevar su acompañamiento como una historia
evolutiva (diagnóstico, recomendaciones, compromisos), gestionar reuniones,
hacer seguimiento por la cadena de valor institucional

```
Descubrir → Incubar → Formar → Fomentar → Financiar
```

y visualizar KPIs para apoyar la toma de decisiones.

## Estado actual

En desarrollo activo. Hoy la app corre sobre datos de ejemplo
(`src/lib/mock-data.ts`, calcados 1:1 del esquema de
`Plantilla_Proyecto_UIE_Cadena_Valor.xlsx`) — todavía no hay backend, base de
datos ni autenticación. Ver la auditoría técnica y el roadmap del proyecto
para el estado detallado y las fases planeadas.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS v4
- Identidad visual institucional (fumc.edu.co): Montserrat + Didact Gothic,
  paleta azul-cian de marca

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).
