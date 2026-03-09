"use client";

import Link from "next/link";
import { LayoutDashboard, FileSpreadsheet, Settings, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
    {
        href: "/",
        label: "Dashboard Principal",
        icon: LayoutDashboard,
    },
    {
        href: "/builder",
        label: "Construtor de Relatórios",
        icon: FileSpreadsheet,
    },
    {
        href: "/relatorio-financeiro",
        label: "Relatório Financeiro",
        icon: TrendingUp,
    },
];

export function SidebarNav({ onClick }: { onClick?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-sidebar">
            <div className="flex h-16 items-center border-b border-sidebar-border px-6 shrink-0">
                <div className="flex items-center gap-2 font-bold text-xl tracking-wider text-primary">
                    <div className="h-4 w-4 rounded-full bg-primary animate-pulse shrink-0" />
                    Bi Relatório
                </div>
            </div>
            <div className="flex-1 overflow-auto py-6 min-h-0">
                <nav className="grid items-start px-4 text-sm font-medium gap-2">
                    {NAV_LINKS.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClick}
                                className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-all hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_10px_rgba(191,64,255,0.2)] ${isActive ? 'bg-primary/10 text-primary shadow-[0_0_10px_rgba(191,64,255,0.2)]' : 'text-sidebar-foreground'}`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto p-4 shrink-0">
                <Link
                    href="/settings"
                    onClick={onClick}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-all hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_10px_rgba(191,64,255,0.2)] ${pathname === '/settings' ? 'bg-primary/10 text-primary shadow-[0_0_10px_rgba(191,64,255,0.2)]' : 'text-sidebar-foreground'}`}
                >
                    <Settings className="h-4 w-4 shrink-0" />
                    Configurações
                </Link>
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex h-screen">
            <SidebarNav />
        </aside>
    );
}
