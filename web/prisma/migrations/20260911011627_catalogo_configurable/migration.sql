-- CreateTable
CREATE TABLE "Fase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Etapa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "color" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "faseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Etapa_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "Fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instrumento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "proposito" TEXT NOT NULL,
    "origenManual" TEXT,
    "faseId" TEXT,
    "momento" TEXT,
    "responsableDiligencia" TEXT,
    "responsableRevisa" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "camposSchema" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Instrumento_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "Fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstrumentoRespuesta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentoId" TEXT NOT NULL,
    "emprendedorId" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstrumentoRespuesta_instrumentoId_fkey" FOREIGN KEY ("instrumentoId") REFERENCES "Instrumento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentoRespuesta_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentoRespuesta_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReglaAvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "faseOrigenId" TEXT,
    "faseDestinoId" TEXT NOT NULL,
    "instrumentosClaves" JSONB NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReglaAvance_faseOrigenId_fkey" FOREIGN KEY ("faseOrigenId") REFERENCES "Fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReglaAvance_faseDestinoId_fkey" FOREIGN KEY ("faseDestinoId") REFERENCES "Fase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "Emprendedor_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprendedor_lastImportRunId_fkey" FOREIGN KEY ("lastImportRunId") REFERENCES "ImportRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprendedor_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "Fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Emprendedor" ("codigoInstitucional", "correo", "createdAt", "deletedAt", "emprendimiento", "estado", "etapa", "fechaIngreso", "id", "lastImportRunId", "nombre", "responsableId", "sector", "telefono", "updatedAt") SELECT "codigoInstitucional", "correo", "createdAt", "deletedAt", "emprendimiento", "estado", "etapa", "fechaIngreso", "id", "lastImportRunId", "nombre", "responsableId", "sector", "telefono", "updatedAt" FROM "Emprendedor";
DROP TABLE "Emprendedor";
ALTER TABLE "new_Emprendedor" RENAME TO "Emprendedor";
CREATE UNIQUE INDEX "Emprendedor_codigoInstitucional_key" ON "Emprendedor"("codigoInstitucional");
CREATE UNIQUE INDEX "Emprendedor_correo_key" ON "Emprendedor"("correo");
CREATE INDEX "Emprendedor_etapa_idx" ON "Emprendedor"("etapa");
CREATE INDEX "Emprendedor_estado_idx" ON "Emprendedor"("estado");
CREATE INDEX "Emprendedor_faseId_idx" ON "Emprendedor"("faseId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Fase_clave_key" ON "Fase"("clave");

-- CreateIndex
CREATE INDEX "Fase_activa_idx" ON "Fase"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "Etapa_clave_key" ON "Etapa"("clave");

-- CreateIndex
CREATE INDEX "Etapa_activa_idx" ON "Etapa"("activa");

-- CreateIndex
CREATE INDEX "Etapa_faseId_idx" ON "Etapa"("faseId");

-- CreateIndex
CREATE UNIQUE INDEX "Instrumento_clave_key" ON "Instrumento"("clave");

-- CreateIndex
CREATE INDEX "Instrumento_activo_idx" ON "Instrumento"("activo");

-- CreateIndex
CREATE INDEX "Instrumento_faseId_idx" ON "Instrumento"("faseId");

-- CreateIndex
CREATE INDEX "InstrumentoRespuesta_emprendedorId_idx" ON "InstrumentoRespuesta"("emprendedorId");

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentoRespuesta_instrumentoId_emprendedorId_key" ON "InstrumentoRespuesta"("instrumentoId", "emprendedorId");

-- CreateIndex
CREATE INDEX "ReglaAvance_faseDestinoId_idx" ON "ReglaAvance"("faseDestinoId");

-- CreateIndex
CREATE INDEX "ReglaAvance_activa_idx" ON "ReglaAvance"("activa");
