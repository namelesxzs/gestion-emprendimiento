-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Instrumento" (
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
    "plazoRevisionDias" INTEGER,
    "permiteMultiples" BOOLEAN NOT NULL DEFAULT false,
    "transversal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Instrumento_faseId_fkey" FOREIGN KEY ("faseId") REFERENCES "Fase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Instrumento" ("activo", "camposSchema", "clave", "createdAt", "faseId", "id", "momento", "nombre", "orden", "origenManual", "proposito", "responsableDiligencia", "responsableRevisa", "updatedAt") SELECT "activo", "camposSchema", "clave", "createdAt", "faseId", "id", "momento", "nombre", "orden", "origenManual", "proposito", "responsableDiligencia", "responsableRevisa", "updatedAt" FROM "Instrumento";
DROP TABLE "Instrumento";
ALTER TABLE "new_Instrumento" RENAME TO "Instrumento";
CREATE UNIQUE INDEX "Instrumento_clave_key" ON "Instrumento"("clave");
CREATE INDEX "Instrumento_activo_idx" ON "Instrumento"("activo");
CREATE INDEX "Instrumento_faseId_idx" ON "Instrumento"("faseId");
CREATE TABLE "new_InstrumentoRespuesta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentoId" TEXT NOT NULL,
    "emprendedorId" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "estadoRevision" TEXT NOT NULL DEFAULT 'Pendiente',
    "revisadoPorId" TEXT,
    "revisadoEn" DATETIME,
    "comentarioRevision" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstrumentoRespuesta_instrumentoId_fkey" FOREIGN KEY ("instrumentoId") REFERENCES "Instrumento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentoRespuesta_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentoRespuesta_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InstrumentoRespuesta_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InstrumentoRespuesta" ("createdAt", "datos", "emprendedorId", "id", "instrumentoId", "registradoPorId", "updatedAt") SELECT "createdAt", "datos", "emprendedorId", "id", "instrumentoId", "registradoPorId", "updatedAt" FROM "InstrumentoRespuesta";
DROP TABLE "InstrumentoRespuesta";
ALTER TABLE "new_InstrumentoRespuesta" RENAME TO "InstrumentoRespuesta";
CREATE INDEX "InstrumentoRespuesta_instrumentoId_emprendedorId_idx" ON "InstrumentoRespuesta"("instrumentoId", "emprendedorId");
CREATE INDEX "InstrumentoRespuesta_emprendedorId_idx" ON "InstrumentoRespuesta"("emprendedorId");
CREATE INDEX "InstrumentoRespuesta_estadoRevision_idx" ON "InstrumentoRespuesta"("estadoRevision");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
