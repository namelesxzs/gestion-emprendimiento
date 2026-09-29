-- CreateTable
CREATE TABLE "Cohorte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "sede" TEXT,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "IntegranteEquipo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emprendedorId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT,
    "programaAcademico" TEXT,
    "semestre" TEXT,
    "correo" TEXT,
    "telefono" TEXT,
    "rolEquipo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegranteEquipo_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Emprendedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoInstitucional" TEXT,
    "correo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "emprendimiento" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fechaIngreso" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "responsableId" TEXT,
    "lastImportRunId" TEXT,
    "faseId" TEXT,
    "sede" TEXT,
    "programaAcademico" TEXT,
    "facultad" TEXT,
    "tipoInnovacion" TEXT,
    "madurez" TEXT,
    "problema" TEXT,
    "descripcionIdea" TEXT,
    "canalPostulacion" TEXT,
    "cohorteId" TEXT,
    CONSTRAINT "Emprendedor_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprendedor_lastImportRunId_fkey" FOREIGN KEY ("lastImportRunId") REFERENCES "ImportRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprendedor_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "Fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprendedor_cohorteId_fkey" FOREIGN KEY ("cohorteId") REFERENCES "Cohorte" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Emprendedor" ("codigoInstitucional", "correo", "createdAt", "deletedAt", "emprendimiento", "estado", "etapa", "faseId", "fechaIngreso", "id", "lastImportRunId", "nombre", "responsableId", "sector", "telefono", "updatedAt") SELECT "codigoInstitucional", "correo", "createdAt", "deletedAt", "emprendimiento", "estado", "etapa", "faseId", "fechaIngreso", "id", "lastImportRunId", "nombre", "responsableId", "sector", "telefono", "updatedAt" FROM "Emprendedor";
DROP TABLE "Emprendedor";
ALTER TABLE "new_Emprendedor" RENAME TO "Emprendedor";
CREATE UNIQUE INDEX "Emprendedor_codigoInstitucional_key" ON "Emprendedor"("codigoInstitucional");
CREATE UNIQUE INDEX "Emprendedor_correo_key" ON "Emprendedor"("correo");
CREATE INDEX "Emprendedor_etapa_idx" ON "Emprendedor"("etapa");
CREATE INDEX "Emprendedor_cohorteId_idx" ON "Emprendedor"("cohorteId");
CREATE INDEX "Emprendedor_estado_idx" ON "Emprendedor"("estado");
CREATE INDEX "Emprendedor_faseId_idx" ON "Emprendedor"("faseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Cohorte_activa_idx" ON "Cohorte"("activa");

-- CreateIndex
CREATE INDEX "IntegranteEquipo_emprendedorId_idx" ON "IntegranteEquipo"("emprendedorId");
