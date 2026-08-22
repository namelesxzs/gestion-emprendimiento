-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "correo" TEXT NOT NULL,
    "exitoso" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "LoginAttempt_correo_createdAt_idx" ON "LoginAttempt"("correo", "createdAt");
