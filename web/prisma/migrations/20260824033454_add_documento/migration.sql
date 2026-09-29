-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emprendedorId" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "subidoPorId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "comentarioRevision" TEXT,
    "revisadoPorId" TEXT,
    "revisadoEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Documento_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Documento_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Documento_emprendedorId_etapa_idx" ON "Documento"("emprendedorId", "etapa");

-- CreateIndex
CREATE INDEX "Documento_estado_idx" ON "Documento"("estado");
