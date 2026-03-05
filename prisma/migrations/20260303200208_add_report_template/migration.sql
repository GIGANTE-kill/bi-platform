-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "filtros" TEXT,
    "selectedColumns" TEXT NOT NULL,
    "emails" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);
