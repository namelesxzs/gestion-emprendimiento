import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const ETAPA_ORDER = ["Descubrir", "Incubar", "Formar", "Fomentar", "Financiar"] as const;
type Etapa = (typeof ETAPA_ORDER)[number];

const DOCENTES = [
  { nombre: "Docente A", correo: "docente.a@uie.local", sede: "Medellín" },
  { nombre: "Docente B", correo: "docente.b@uie.local", sede: "Neiva" },
  { nombre: "Docente C", correo: "docente.c@uie.local", sede: "Popayán" },
];

const EMPRENDEDORES_SEED = [
  { nombre: "Ana Gómez", emprendimiento: "EcoBolsas", sector: "Ambiental", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-01-10", responsable: "Docente A", correo: "ana@test.com", telefono: "3001111111" },
  { nombre: "Luis Pérez", emprendimiento: "AgroSmart", sector: "Agrotech", etapa: "Incubar", estado: "Activo", fechaIngreso: "2026-02-12", responsable: "Docente A", correo: "luis@test.com", telefono: "3002222222" },
  { nombre: "María Díaz", emprendimiento: "FinEdu", sector: "Fintech", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-03-03", responsable: "Docente B", correo: "maria@test.com", telefono: "3003333333" },
  { nombre: "Carlos Ruiz", emprendimiento: "CafePlus", sector: "Alimentos", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2026-04-05", responsable: "Docente B", correo: "carlos@test.com", telefono: "3004444444" },
  { nombre: "Sara López", emprendimiento: "HealthIA", sector: "Salud", etapa: "Financiar", estado: "Graduado", fechaIngreso: "2026-01-18", responsable: "Docente A", correo: "sara@test.com", telefono: "3005555555" },
  { nombre: "Jorge Martínez", emprendimiento: "TurismoVerde", sector: "Turismo", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-05-02", responsable: "Docente C", correo: "jorge@test.com", telefono: "3006666666" },
  { nombre: "Paula Ramírez", emprendimiento: "ModaCircular", sector: "Textil", etapa: "Incubar", estado: "Activo", fechaIngreso: "2026-02-28", responsable: "Docente C", correo: "paula@test.com", telefono: "3007777777" },
  { nombre: "Andrés Torres", emprendimiento: "EduTech360", sector: "Educación", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-01-25", responsable: "Docente B", correo: "andres@test.com", telefono: "3008888888" },
  { nombre: "Camila Rojas", emprendimiento: "PetCareApp", sector: "Mascotas", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2025-11-14", responsable: "Docente A", correo: "camila@test.com", telefono: "3009999999" },
  { nombre: "Felipe Castro", emprendimiento: "ConstruSmart", sector: "Construcción", etapa: "Financiar", estado: "Graduado", fechaIngreso: "2025-09-20", responsable: "Docente B", correo: "felipe@test.com", telefono: "3010101010" },
  { nombre: "Daniela Vargas", emprendimiento: "ArteUrbano", sector: "Cultura", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-05-20", responsable: "Docente C", correo: "daniela@test.com", telefono: "3011111111" },
  { nombre: "Santiago Morales", emprendimiento: "LogisFast", sector: "Logística", etapa: "Incubar", estado: "Inactivo", fechaIngreso: "2025-12-01", responsable: "Docente A", correo: "santiago@test.com", telefono: "3012121212" },
  { nombre: "Valentina Herrera", emprendimiento: "BioCosmética", sector: "Cosméticos", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-02-15", responsable: "Docente B", correo: "valentina@test.com", telefono: "3013131313" },
  { nombre: "Nicolás Ortiz", emprendimiento: "GameLab", sector: "Videojuegos", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2025-10-08", responsable: "Docente C", correo: "nicolas@test.com", telefono: "3014141414" },
  { nombre: "Isabella Sánchez", emprendimiento: "AguaPura", sector: "Ambiental", etapa: "Financiar", estado: "Activo", fechaIngreso: "2025-08-11", responsable: "Docente A", correo: "isabella@test.com", telefono: "3015151515" },
  { nombre: "Sebastián Vega", emprendimiento: "CryptoLocal", sector: "Fintech", etapa: "Descubrir", estado: "Activo", fechaIngreso: "2026-06-01", responsable: "Docente B", correo: "sebastian@test.com", telefono: "3016161616" },
  { nombre: "Mariana Castillo", emprendimiento: "RecicloYa", sector: "Ambiental", etapa: "Incubar", estado: "Activo", fechaIngreso: "2026-03-22", responsable: "Docente C", correo: "mariana@test.com", telefono: "3017171717" },
  { nombre: "Juan Delgado", emprendimiento: "AgroDrone", sector: "Agrotech", etapa: "Formar", estado: "Activo", fechaIngreso: "2026-01-05", responsable: "Docente A", correo: "juan@test.com", telefono: "3018181818" },
  { nombre: "Laura Guzmán", emprendimiento: "SaludMental+", sector: "Salud", etapa: "Fomentar", estado: "Activo", fechaIngreso: "2025-12-19", responsable: "Docente B", correo: "laura@test.com", telefono: "3019191919" },
  { nombre: "Diego Herrera", emprendimiento: "ArtesaníaDigital", sector: "Cultura", etapa: "Financiar", estado: "Inactivo", fechaIngreso: "2025-07-30", responsable: "Docente C", correo: "diego@test.com", telefono: "3020202020" },
];

const ETAPA_PLANTILLA: Record<Etapa, { diagnostico: string; recomendaciones: string; compromiso: string }> = {
  Descubrir: { diagnostico: "Idea en fase de validación de problema y mercado.", recomendaciones: "Entrevistar clientes potenciales y afinar la propuesta de valor.", compromiso: "Realizar 15 entrevistas de descubrimiento." },
  Incubar: { diagnostico: "MVP construido, primeras pruebas con usuarios reales.", recomendaciones: "Iterar el prototipo según la retroalimentación recibida.", compromiso: "Ejecutar dos ciclos de prueba con usuarios." },
  Formar: { diagnostico: "Modelo de negocio consolidado; requiere fortalecer la gestión.", recomendaciones: "Completar formación en finanzas y gestión empresarial.", compromiso: "Finalizar el módulo de formación de la UIE." },
  Fomentar: { diagnostico: "Producto en el mercado, buscando escalar ventas.", recomendaciones: "Diseñar estrategia de marketing y participar en ferias.", compromiso: "Participar en la próxima feria de emprendimiento." },
  Financiar: { diagnostico: "Negocio validado, en búsqueda de capital para escalar.", recomendaciones: "Preparar pitch deck y explorar fondos de inversión.", compromiso: "Presentar la propuesta ante dos fondos de inversión." },
};

const REUNION_TEMA: Record<Etapa, string> = {
  Descubrir: "Mentoría de validación de idea",
  Incubar: "Seguimiento de prototipo",
  Formar: "Sesión de formación empresarial",
  Fomentar: "Revisión de estrategia comercial",
  Financiar: "Preparación de pitch a inversionistas",
};

function addDays(fecha: string, dias: number): Date {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d;
}

function hh(hora: number): string {
  return `${hora.toString().padStart(2, "0")}:00`;
}

const DEV_PASSWORD = "uie-dev-2026";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  console.log("Limpiando datos existentes...");
  await prisma.auditLog.deleteMany();
  await prisma.compromiso.deleteMany();
  await prisma.acompanamiento.deleteMany();
  await prisma.reunion.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.emprendedor.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("Creando usuarios...");
  const admin = await prisma.usuario.create({
    data: { nombre: "Admin UIE", correo: "admin@uie.local", passwordHash, rol: "ADMINISTRADOR" },
  });
  const coordinador = await prisma.usuario.create({
    data: { nombre: "Coordinador UIE", correo: "coordinador@uie.local", passwordHash, rol: "COORDINADOR" },
  });

  const docentesPorNombre = new Map<string, string>();
  for (const d of DOCENTES) {
    const u = await prisma.usuario.create({
      data: { nombre: d.nombre, correo: d.correo, passwordHash, rol: "DOCENTE", sede: d.sede },
    });
    docentesPorNombre.set(d.nombre, u.id);
  }

  console.log("Creando emprendedores, acompañamientos, compromisos y reuniones...");
  for (const [index, e] of EMPRENDEDORES_SEED.entries()) {
    const emprendedor = await prisma.emprendedor.create({
      data: {
        nombre: e.nombre,
        emprendimiento: e.emprendimiento,
        sector: e.sector,
        etapa: e.etapa,
        estado: e.estado,
        fechaIngreso: new Date(`${e.fechaIngreso}T00:00:00`),
        correo: e.correo,
        telefono: e.telefono,
        responsableId: docentesPorNombre.get(e.responsable),
      },
    });

    const etapaIndex = ETAPA_ORDER.indexOf(e.etapa as Etapa);
    const etapasRecorridas = ETAPA_ORDER.slice(0, etapaIndex + 1);

    for (const [i, etapa] of etapasRecorridas.entries()) {
      const esUltima = i === etapasRecorridas.length - 1;
      const plantilla = ETAPA_PLANTILLA[etapa];
      const avancePct = Math.round(((i + 1) / ETAPA_ORDER.length) * 100);
      const compromisoEstado = esUltima ? (e.estado === "Graduado" ? "Cumplido" : "En proceso") : "Cumplido";
      const fecha = addDays(e.fechaIngreso, (i + 1) * 35);

      const acompanamiento = await prisma.acompanamiento.create({
        data: {
          emprendedorId: emprendedor.id,
          docenteId: docentesPorNombre.get(e.responsable),
          fecha,
          etapa,
          diagnostico: plantilla.diagnostico,
          recomendaciones: plantilla.recomendaciones,
          avancePct,
        },
      });

      await prisma.compromiso.create({
        data: {
          acompanamientoId: acompanamiento.id,
          descripcion: plantilla.compromiso,
          fechaCompromiso: fecha,
          fechaCumplimiento: compromisoEstado === "Cumplido" ? fecha : null,
          estado: compromisoEstado,
        },
      });
    }

    const tema = REUNION_TEMA[e.etapa as Etapa];
    const idNum = index + 1;

    const estadoPasado = idNum % 5 === 0 ? "Cancelada" : "Realizada";
    await prisma.reunion.create({
      data: {
        emprendedorId: emprendedor.id,
        docenteId: docentesPorNombre.get(e.responsable),
        fecha: addDays("2026-07-01", idNum % 20),
        hora: hh(8 + (idNum % 8)),
        estado: estadoPasado,
        accion: estadoPasado === "Cancelada" ? "Cancelar" : "Crear",
        observaciones:
          estadoPasado === "Cancelada"
            ? `${tema} — el emprendedor no pudo asistir.`
            : `${tema}, realizada con normalidad.`,
      },
    });

    if (e.estado !== "Inactivo") {
      const estadoFuturo = idNum % 3 === 0 ? "Reagendada" : "Programada";
      await prisma.reunion.create({
        data: {
          emprendedorId: emprendedor.id,
          docenteId: docentesPorNombre.get(e.responsable),
          fecha: addDays("2026-08-04", idNum % 15),
          hora: hh(9 + (idNum % 6)),
          estado: estadoFuturo,
          accion: estadoFuturo === "Reagendada" ? "Reagendar" : "Crear",
          observaciones:
            estadoFuturo === "Reagendada"
              ? `${tema} — reagendada por disponibilidad del mentor.`
              : `${tema}, programada como seguimiento.`,
        },
      });
    }

    // El primer emprendedor (Ana Gómez) recibe una cuenta de portal propia,
    // para poder probar el flujo de rol EMPRENDEDOR de extremo a extremo.
    if (index === 0) {
      await prisma.usuario.create({
        data: {
          nombre: e.nombre,
          correo: `portal.${e.correo}`,
          passwordHash,
          rol: "EMPRENDEDOR",
          emprendedorId: emprendedor.id,
        },
      });
    }
  }

  console.log("\nListo. Usuarios de prueba (misma contraseña para todos):");
  console.log(`  contraseña: ${DEV_PASSWORD}`);
  console.log(`  admin@uie.local           (ADMINISTRADOR)`);
  console.log(`  coordinador@uie.local     (COORDINADOR)`);
  console.log(`  docente.a@uie.local       (DOCENTE)`);
  console.log(`  portal.ana@test.com       (EMPRENDEDOR — Ana Gómez)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
