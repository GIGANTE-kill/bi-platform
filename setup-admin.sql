INSERT INTO "User" ("id", "email", "name", "password", "role", "updatedAt")
VALUES ('admin-id', 'admin@admin.com', 'Administrador', '$2b$10$zyWU381eg6AX7oxYVA5b4OyV0rr62kGJi8.CBoB0SrIzsBkmia7a2', 'GERENTE', NOW())
ON CONFLICT ("email") DO UPDATE 
SET "password" = EXCLUDED."password", "role" = EXCLUDED."role", "updatedAt" = EXCLUDED."updatedAt";
