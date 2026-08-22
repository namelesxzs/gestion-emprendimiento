-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "sede" TEXT;

-- CreateIndex
CREATE INDEX "Usuario_sede_idx" ON "Usuario"("sede");
