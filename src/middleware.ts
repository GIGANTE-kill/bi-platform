import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const { pathname } = req.nextUrl;

        // Hierarquia de Cargos (RBAC)
        // GERENTE: Acesso total
        // FUNCIONARIO: Apenas /pos. Bloquear acesso a dashboards administrativos.

        if (isAuth) {
            const role = token.role;

            // Se o usuário (de qualquer cargo) estiver na página de login, redireciona
            if (pathname === "/login") {
                if (role === "FUNCIONARIO") {
                    return NextResponse.redirect(new URL("/pos", req.url));
                }
                return NextResponse.redirect(new URL("/", req.url));
            }

            if (role === "FUNCIONARIO") {
                // Rotas administrativas protegidas
                const adminPaths = ["/builder", "/relatorio-financeiro", "/"];

                // Se um FUNCIONÁRIO tentar acessar o root ou dashboards, redireciona para /pos
                if (adminPaths.includes(pathname)) {
                    return NextResponse.redirect(new URL("/pos", req.url));
                }
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        "/",
        "/builder/:path*",
        "/relatorio-financeiro/:path*",
        "/pos/:path*",
    ],
};
