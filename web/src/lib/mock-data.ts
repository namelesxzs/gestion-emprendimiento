import type { Acompanamiento, Emprendedor, Etapa, EstadoReunion, Reunion } from "./types";

/**
 * Mock data — mirrors the exact sheets/columns of
 * Plantilla_Proyecto_UIE_Cadena_Valor.xlsx so swapping this module for a
 * real API later is a 1:1 field mapping. Los emprendedores son literales;
 * historiales y reuniones se generan a partir de plantillas por etapa para
 * tener un dataset de demo más rico y variado.
 */

export const ETAPA_ORDER: Etapa[] = [
  "Descubrir",
  "Incubar",
  "Formar",
  "Fomentar",
  "Financiar",
];

export const emprendedores: Emprendedor[] = [
  { id: 1, nombre: "Ana Gómez", emprendimiento: "EcoBolsas", sector: "Ambiental", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-01-10", responsable: "Docente A", correo: "ana@test.com", telefono: "3001111111" },
  { id: 2, nombre: "Luis Pérez", emprendimiento: "AgroSmart", sector: "Agrotech", etapa: "Incubar", estado: "Activo", fechaIngreso: "2026-02-12", responsable: "Docente A", correo: "luis@test.com", telefono: "3002222222" },
  { id: 3, nombre: "María Díaz", emprendimiento: "FinEdu", sector: "Fintech", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-03-03", responsable: "Docente B", correo: "maria@test.com", telefono: "3003333333" },
  { id: 4, nombre: "Carlos Ruiz", emprendimiento: "CafePlus", sector: "Alimentos", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2026-04-05", responsable: "Docente B", correo: "carlos@test.com", telefono: "3004444444" },
  { id: 5, nombre: "Sara López", emprendimiento: "HealthIA", sector: "Salud", etapa: "Financiar", estado: "Graduado", fechaIngreso: "2026-01-18", responsable: "Docente A", correo: "sara@test.com", telefono: "3005555555" },
  { id: 6, nombre: "Jorge Martínez", emprendimiento: "TurismoVerde", sector: "Turismo", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-05-02", responsable: "Docente C", correo: "jorge@test.com", telefono: "3006666666" },
  { id: 7, nombre: "Paula Ramírez", emprendimiento: "ModaCircular", sector: "Textil", etapa: "Incubar", estado: "Activo", fechaIngreso: "2026-02-28", responsable: "Docente C", correo: "paula@test.com", telefono: "3007777777" },
  { id: 8, nombre: "Andrés Torres", emprendimiento: "EduTech360", sector: "Educación", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-01-25", responsable: "Docente B", correo: "andres@test.com", telefono: "3008888888" },
  { id: 9, nombre: "Camila Rojas", emprendimiento: "PetCareApp", sector: "Mascotas", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2025-11-14", responsable: "Docente A", correo: "camila@test.com", telefono: "3009999999" },
  { id: 10, nombre: "Felipe Castro", emprendimiento: "ConstruSmart", sector: "Construcción", etapa: "Financiar", estado: "Graduado", fechaIngreso: "2025-09-20", responsable: "Docente B", correo: "felipe@test.com", telefono: "3010101010" },
  { id: 11, nombre: "Daniela Vargas", emprendimiento: "ArteUrbano", sector: "Cultura", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-05-20", responsable: "Docente C", correo: "daniela@test.com", telefono: "3011111111" },
  { id: 12, nombre: "Santiago Morales", emprendimiento: "LogisFast", sector: "Logística", etapa: "Incubar", estado: "Inactivo", fechaIngreso: "2025-12-01", responsable: "Docente A", correo: "santiago@test.com", telefono: "3012121212" },
  { id: 13, nombre: "Valentina Herrera", emprendimiento: "BioCosmética", sector: "Cosméticos", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-02-15", responsable: "Docente B", correo: "valentina@test.com", telefono: "3013131313" },
  { id: 14, nombre: "Nicolás Ortiz", emprendimiento: "GameLab", sector: "Videojuegos", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2025-10-08", responsable: "Docente C", correo: "nicolas@test.com", telefono: "3014141414" },
  { id: 15, nombre: "Isabella Sánchez", emprendimiento: "AguaPura", sector: "Ambiental", etapa: "Financiar", estado: "Activo", fechaIngreso: "2025-08-11", responsable: "Docente A", correo: "isabella@test.com", telefono: "3015151515" },
  { id: 16, nombre: "Sebastián Vega", emprendimiento: "CryptoLocal", sector: "Fintech", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-06-01", responsable: "Docente B", correo: "sebastian@test.com", telefono: "3016161616" },
  { id: 17, nombre: "Mariana Castillo", emprendimiento: "RecicloYa", sector: "Ambiental", etapa: "Incubar", estado: "Activo", fechaIngreso: "2026-03-22", responsable: "Docente C", correo: "mariana@test.com", telefono: "3017171717" },
  { id: 18, nombre: "Juan Delgado", emprendimiento: "AgroDrone", sector: "Agrotech", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-01-05", responsable: "Docente A", correo: "juan@test.com", telefono: "3018181818" },
  { id: 19, nombre: "Laura Guzmán", emprendimiento: "SaludMental+", sector: "Salud", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2025-12-19", responsable: "Docente B", correo: "laura@test.com", telefono: "3019191919" },
  { id: 20, nombre: "Diego Herrera", emprendimiento: "ArtesaníaDigital", sector: "Cultura", etapa: "Financiar", estado: "Inactivo", fechaIngreso: "2025-07-30", responsable: "Docente C", correo: "diego@test.com", telefono: "3020202020" },
];

function addDays(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function hh(hora: number): string {
  return `${hora.toString().padStart(2, "0")}:00`;
}

const ETAPA_PLANTILLA: Record<
  Etapa,
  { diagnostico: string; recomendaciones: string; compromisos: string }
> = {
  Descubrir: {
    diagnostico: "Idea en fase de validación de problema y mercado.",
    recomendaciones: "Entrevistar clientes potenciales y afinar la propuesta de valor.",
    compromisos: "Realizar 15 entrevistas de descubrimiento.",
  },
  Incubar: {
    diagnostico: "MVP construido, primeras pruebas con usuarios reales.",
    recomendaciones: "Iterar el prototipo según la retroalimentación recibida.",
    compromisos: "Ejecutar dos ciclos de prueba con usuarios.",
  },
  Formar: {
    diagnostico: "Modelo de negocio consolidado; requiere fortalecer la gestión.",
    recomendaciones: "Completar formación en finanzas y gestión empresarial.",
    compromisos: "Finalizar el módulo de formación de la UIE.",
  },
  Fomentar: {
    diagnostico: "Producto en el mercado, buscando escalar ventas.",
    recomendaciones: "Diseñar estrategia de marketing y participar en ferias.",
    compromisos: "Participar en la próxima feria de emprendimiento.",
  },
  Financiar: {
    diagnostico: "Negocio validado, en búsqueda de capital para escalar.",
    recomendaciones: "Preparar pitch deck y explorar fondos de inversión.",
    compromisos: "Presentar la propuesta ante dos fondos de inversión.",
  },
};

function buildAcompanamientos(): Acompanamiento[] {
  let nextId = 1;
  const registros: Acompanamiento[] = [];

  for (const e of emprendedores) {
    const hastaIndex = ETAPA_ORDER.indexOf(e.etapa);
    const etapasRecorridas = ETAPA_ORDER.slice(0, hastaIndex + 1);

    etapasRecorridas.forEach((etapa, i) => {
      const esUltima = i === etapasRecorridas.length - 1;
      const plantilla = ETAPA_PLANTILLA[etapa];

      registros.push({
        id: nextId++,
        emprendedorId: e.id,
        fecha: addDays(e.fechaIngreso, (i + 1) * 35),
        etapa,
        diagnostico: plantilla.diagnostico,
        recomendaciones: plantilla.recomendaciones,
        compromisos: plantilla.compromisos,
        avancePct: Math.round(((i + 1) / ETAPA_ORDER.length) * 100),
        estado: esUltima ? (e.estado === "Graduado" ? "Cumplido" : "En proceso") : "Cumplido",
      });
    });
  }

  return registros;
}

export const acompanamientos: Acompanamiento[] = buildAcompanamientos();

const REUNION_TEMA: Record<Etapa, string> = {
  Descubrir: "Mentoría de validación de idea",
  Incubar: "Seguimiento de prototipo",
  Formar: "Sesión de formación empresarial",
  Fomentar: "Revisión de estrategia comercial",
  Financiar: "Preparación de pitch a inversionistas",
};

function buildReuniones(): Reunion[] {
  let nextId = 1;
  const registros: Reunion[] = [];

  for (const e of emprendedores) {
    const tema = REUNION_TEMA[e.etapa];

    const estadoPasado: EstadoReunion = e.id % 5 === 0 ? "Cancelada" : "Realizada";
    registros.push({
      id: nextId++,
      emprendedorId: e.id,
      fecha: addDays("2026-07-01", e.id % 20),
      hora: hh(8 + (e.id % 8)),
      estado: estadoPasado,
      accion: estadoPasado === "Cancelada" ? "Cancelar" : "Crear",
      observaciones:
        estadoPasado === "Cancelada"
          ? `${tema} — el emprendedor no pudo asistir.`
          : `${tema}, realizada con normalidad.`,
    });

    if (e.estado !== "Inactivo") {
      const estadoFuturo: EstadoReunion = e.id % 3 === 0 ? "Reagendada" : "Programada";
      registros.push({
        id: nextId++,
        emprendedorId: e.id,
        fecha: addDays("2026-08-04", e.id % 15),
        hora: hh(9 + (e.id % 6)),
        estado: estadoFuturo,
        accion: estadoFuturo === "Reagendada" ? "Reagendar" : "Crear",
        observaciones:
          estadoFuturo === "Reagendada"
            ? `${tema} — reagendada por disponibilidad del mentor.`
            : `${tema}, programada como seguimiento.`,
      });
    }
  }

  return registros;
}

export const reuniones: Reunion[] = buildReuniones();

export function getEtapaDistribution(): { etapa: Etapa; count: number }[] {
  return ETAPA_ORDER.map((etapa) => ({
    etapa,
    count: emprendedores.filter((e) => e.etapa === etapa).length,
  }));
}

export function getKpis() {
  const totalEmprendedores = emprendedores.length;
  const activos = emprendedores.filter((e) => e.estado === "Activo").length;
  const totalAcompanamientos = acompanamientos.length;
  const avancePromedio = totalAcompanamientos
    ? Math.round(
        acompanamientos.reduce((sum, a) => sum + a.avancePct, 0) /
          totalAcompanamientos
      )
    : 0;

  return { totalEmprendedores, activos, totalAcompanamientos, avancePromedio };
}

export function getUltimoAvance(emprendedorId: number): number | undefined {
  const historial = acompanamientos
    .filter((a) => a.emprendedorId === emprendedorId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return historial[0]?.avancePct;
}

export function getAcompanamientosByEmprendedor(emprendedorId: number): Acompanamiento[] {
  return acompanamientos
    .filter((a) => a.emprendedorId === emprendedorId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function getReunionesByEmprendedor(emprendedorId: number): Reunion[] {
  return reuniones
    .filter((r) => r.emprendedorId === emprendedorId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function getProximasReuniones() {
  return reuniones
    .filter((r) => r.estado === "Programada" || r.estado === "Reagendada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((r) => ({
      ...r,
      emprendedorNombre:
        emprendedores.find((e) => e.id === r.emprendedorId)?.nombre ?? "—",
    }));
}
