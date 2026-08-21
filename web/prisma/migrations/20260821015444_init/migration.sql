-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emprendedorId" TEXT,
    CONSTRAINT "Usuario_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Emprendedor" (
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
    CONSTRAINT "Emprendedor_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Emprendedor_lastImportRunId_fkey" FOREIGN KEY ("lastImportRunId") REFERENCES "ImportRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Acompanamiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emprendedorId" TEXT NOT NULL,
    "docenteId" TEXT,
    "fecha" DATETIME NOT NULL,
    "etapa" TEXT NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "recomendaciones" TEXT NOT NULL,
    "avancePct" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Acompanamiento_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Acompanamiento_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Compromiso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "acompanamientoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaCompromiso" DATETIME NOT NULL,
    "fechaCumplimiento" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Compromiso_acompanamientoId_fkey" FOREIGN KEY ("acompanamientoId") REFERENCES "Acompanamiento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reunion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emprendedorId" TEXT NOT NULL,
    "docenteId" TEXT,
    "fecha" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "accion" TEXT NOT NULL,
    "observaciones" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reunion_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reunion_docenteId_fkey" FOREIGN KEY ("docenteId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "rolSnapshot" TEXT,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "resultado" TEXT NOT NULL DEFAULT 'EXITO',
    "importRunId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_importRunId_fkey" FOREIGN KEY ("importRunId") REFERENCES "ImportRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "archivoHash" TEXT NOT NULL,
    "archivoStoragePath" TEXT,
    "totalFilas" INTEGER NOT NULL DEFAULT 0,
    "nuevos" INTEGER NOT NULL DEFAULT 0,
    "actualizados" INTEGER NOT NULL DEFAULT 0,
    "sinCambios" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'EN_PROGRESO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportRun_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EmprendedoresAfectados" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EmprendedoresAfectados_A_fkey" FOREIGN KEY ("A") REFERENCES "Emprendedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EmprendedoresAfectados_B_fkey" FOREIGN KEY ("B") REFERENCES "ImportRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_emprendedorId_key" ON "Usuario"("emprendedorId");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Emprendedor_codigoInstitucional_key" ON "Emprendedor"("codigoInstitucional");

-- CreateIndex
CREATE UNIQUE INDEX "Emprendedor_correo_key" ON "Emprendedor"("correo");

-- CreateIndex
CREATE INDEX "Emprendedor_etapa_idx" ON "Emprendedor"("etapa");

-- CreateIndex
CREATE INDEX "Emprendedor_estado_idx" ON "Emprendedor"("estado");

-- CreateIndex
CREATE INDEX "Acompanamiento_emprendedorId_fecha_idx" ON "Acompanamiento"("emprendedorId", "fecha");

-- CreateIndex
CREATE INDEX "Compromiso_estado_idx" ON "Compromiso"("estado");

-- CreateIndex
CREATE INDEX "Reunion_emprendedorId_fecha_idx" ON "Reunion"("emprendedorId", "fecha");

-- CreateIndex
CREATE INDEX "AuditLog_entidad_entidadId_idx" ON "AuditLog"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_EmprendedoresAfectados_AB_unique" ON "_EmprendedoresAfectados"("A", "B");

-- CreateIndex
CREATE INDEX "_EmprendedoresAfectados_B_index" ON "_EmprendedoresAfectados"("B");
