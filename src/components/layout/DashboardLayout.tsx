"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const loading = status === "loading";

    // Se não estiver logado, renderiza apenas o conteúdo (ex: tela de login) sem sidebar/header
    if (!session) {
        return <main className="flex-1 w-full h-screen overflow-auto">{children}</main>;
    }

    // Se estiver logado (ou carregando), renderiza a estrutura completa de dashboard
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            <Sidebar />
            <div className="flex flex-1 flex-col md:pl-64 min-w-0">
                <Header />
                <main className="flex-1 flex flex-col min-h-0 relative overflow-y-auto">
                    <div className="p-3 md:p-6 w-full flex-1 flex flex-col min-h-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
