"use client";

import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileBarChart,
  CalendarClock,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Search
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { data: session } = useSession();

  const stats = [
    { label: "Relatórios Ativos", value: "12", icon: FileBarChart, color: "text-primary" },
    { label: "Agendamentos", value: "8", icon: CalendarClock, color: "text-chart-2" },
    { label: "Acessos Hoje", value: "24", icon: UserIcon, color: "text-sky-400" },
  ];

  const quickActions = [
    {
      title: "Construtor de Relatórios",
      description: "Crie relatórios personalizados arrastando colunas.",
      link: "/builder",
      icon: LayoutDashboard
    },
    {
      title: "Relatório Financeiro",
      description: "Visualize o fluxo de caixa semanal por fornecedor.",
      link: "/relatorio-financeiro",
      icon: FileBarChart
    }
  ];

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header / Welcome Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-2 whitespace-nowrap">
            Bem-vindo, {session?.user?.name || "Usuário"}!
          </h1>
          <p className="text-muted-foreground font-medium">
            Plataforma de BI - Painel Administrativo de Gerência.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/40 p-1.5 rounded-xl border border-border/50 backdrop-blur-lg">
          <div className="px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sessão Ativa</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 gap-2 font-bold">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card/40 border-border/50 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-black tabular-nums">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-2xl bg-muted/20 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-2 flex-1 min-h-0">
        <Card className="bg-linear-to-br from-card/60 to-background/40 border-border/50 flex flex-col h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Acesso Rápido
            </CardTitle>
            <CardDescription>Principais ferramentas para análise de dados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.link}>
                <div className="group p-4 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted/30 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{action.title}</h4>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/20 border-dashed border-2 border-border/40 flex items-center justify-center p-8 text-center min-h-[300px]">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted/10 mx-auto flex items-center justify-center">
              <LayoutDashboard className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <h4 className="text-lg font-bold text-muted-foreground/40">Seu Dashboard Principal</h4>
            <p className="text-sm text-muted-foreground/30 max-w-[280px]">
              Implemente gráficos e métricas de desempenho aqui para ter uma visão geral do negócio.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
