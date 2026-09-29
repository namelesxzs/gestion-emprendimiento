-- CreateTable
CREATE TABLE "SolicitudRestablecimiento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "atendidaPorId" TEXT,
    "atendidaEn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolicitudRestablecimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SolicitudRestablecimiento_atendidaPorId_fkey" FOREIGN KEY ("atendidaPorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "sede" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emprendedorId" TEXT,
    CONSTRAINT "Usuario_emprendedorId_fkey" FOREIGN KEY ("emprendedorId") REFERENCES "Emprendedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Usuario" ("activo", "correo", "createdAt", "emprendedorId", "id", "nombre", "passwordHash", "rol", "sede", "updatedAt") SELECT "activo", "correo", "createdAt", "emprendedorId", "id", "nombre", "passwordHash", "rol", "sede", "updatedAt" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
CREATE UNIQUE INDEX "Usuario_emprendedorId_key" ON "Usuario"("emprendedorId");
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");
CREATE INDEX "Usuario_sede_idx" ON "Usuario"("sede");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SolicitudRestablecimiento_estado_idx" ON "SolicitudRestablecimiento"("estado");
