INSERT INTO "User" (id, email, name, password, role, "updatedAt")
VALUES ('admin-manual', 'admin@admin.com', 'Administrador', '.CBoB0SrIzsBkmia7a2', 'GERENTE', NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, "updatedAt" = NOW();
