"use client";

import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, Package, Clock } from "lucide-react";

export default function POSPage() {
    const { data: session } = useSession();

    return (
        <div className="flex flex-col gap-8 h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-2 whitespace-nowrap">
                        Ponto de Venda (PDV)
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Bem-vindo, {session?.user?.name || "Funcionário"}.
                    </p>
                </div>
                <Button variant="outline" onClick={() => signOut()} className="gap-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                    <LogOut className="h-4 w-4" />
                    Sair do Sistema
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Nova Venda</CardTitle>
                        <CardDescription>Iniciar um novo registro de venda direta.</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/50 transition-colors cursor-pointer group opacity-60">
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center mb-2">
                            <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Estoque</CardTitle>
                        <CardDescription>Consulta rápida de disponibilidade.</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/50 transition-colors cursor-pointer group opacity-60">
                    <CardHeader className="pb-4">
                        <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center mb-2">
                            <Clock className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <CardTitle>Histórico</CardTitle>
                        <CardDescription>Vendas realizadas no seu turno.</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card className="flex-1 bg-card/20 backdrop-blur-sm border-dashed border-2 border-border/40 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                    <LayoutDashboard className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-bold text-muted-foreground/60">Sistema de POS em Desenvolvimento</h3>
                <p className="max-w-[400px] text-muted-foreground/40 mt-2">
                    A interface de vendas será integrada ao banco de dados Oracle em breve.
                </p>
                <Button className="mt-6 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20" disabled>
                    Acessar Terminal de Vendas
                </Button>
            </Card>
        </div>
    );
}
