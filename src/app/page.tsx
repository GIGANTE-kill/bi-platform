"use client";

import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileBarChart,
  CalendarClock,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Search,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardOverview } from "@/lib/actions/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

export default function HomePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  async function loadData(force = false) {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchDashboardOverview({ forceRefresh: force });
      if (res.success) {
        setData(res.data);
        // If the action returned cachedAt, we can use it
        if ((res as any).cachedAt) {
          setData((prev: any) => ({ ...prev, _cachedAt: (res as any).cachedAt }));
        }
        setError(null);
      } else {
        setError(res.error || "Erro ao carregar dados");
      }
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = [
    {
      label: "Faturamento Hoje",
      value: loading ? "..." : formatCurrency(data?.vendasHoje ?? 0),
      icon: TrendingUp,
      color: "text-emerald-500"
    },
    {
      label: "Faturamento Mês",
      value: loading ? "..." : formatCurrency(data?.vendasMes ?? 0),
      icon: FileBarChart,
      color: "text-chart-2"
    },
    {
      label: "Relatórios Ativos",
      value: loading ? "..." : (data?.activeReports ?? "0"),
      icon: CalendarClock,
      color: "text-primary"
    },
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


  const formatDate = (dateInput: any) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="border-destructive/50 bg-destructive/5 max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Erro no Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => loadData(true)} variant="outline">Tentar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pb-8 pr-2 custom-scrollbar">
      {/* Header / Welcome Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-2 whitespace-nowrap">
            Bem-vindo, {session?.user?.name || "Usuário"}!
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <p>Plataforma de BI - Painel Administrativo.</p>
            {data?._cachedAt && (
              <span className="text-[10px] bg-muted/30 px-2 py-0.5 rounded-full border border-border/50">
                Atualizado às {formatDate(data._cachedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-card/40 p-1.5 rounded-xl border border-border/50 backdrop-blur-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="text-primary hover:text-primary hover:bg-primary/10 gap-2 font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? "Processando..." : "Reprocessar"}
          </Button>

          <div className="h-4 w-px bg-border/50 mx-1" />

          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })} className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 gap-2 font-bold">
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
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
                ) : (
                  <p className="text-3xl font-black tabular-nums">{stat.value}</p>
                )}
              </div>
              <div className={`p-4 rounded-2xl bg-muted/20 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tool 1: Financial Overview Chart */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-chart-2" />
              Fluxo Financeiro Mensal
            </CardTitle>
            <CardDescription>Receitas vs. Custos de Entrada (6 meses)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthly}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="MES_ANO"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.split('-')[1] + '/' + val.split('-')[0].slice(2)}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$ ${val / 1000000}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="RECEITA" name="Receita" stroke="var(--chart-2)" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                  <Area type="monotone" dataKey="CUSTO_ENTRADA" name="Custo Ent." stroke="#ef4444" fillOpacity={1} fill="url(#colorCusto)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tool 2: Builder Proxy / Top Suppliers Chart */}
        <Card className="bg-card/40 border-border/50 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Top Fornecedores (Mês Atual)
            </CardTitle>
            <CardDescription>Volume de compras por fornecedor no Oracle.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topFornecedores} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="FORNECEDOR"
                    type="category"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tickFormatter={(val) => val.length > 15 ? val.slice(0, 15) + '...' : val}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#fafafa', fontSize: '13px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Bar dataKey="VALOR_COMPRADO" name="Total Comprado" radius={[0, 4, 4, 0]}>
                    {data?.topFornecedores?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : 'rgba(59, 130, 246, 0.5)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-linear-to-br from-card/60 to-background/40 border-border/50 flex flex-col h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Ferramentas de BI
            </CardTitle>
            <CardDescription>Acesso rápido aos módulos principais.</CardDescription>
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

        <Card className="bg-card/20 border-border/40 p-8 flex flex-col justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-foreground">Estado do Sistema</h4>
            <p className="text-sm text-muted-foreground">
              Sua infraestrutura de BI está operando normalmente com conexões ativas para Oracle e Postgres.
            </p>
          </div>
          <div className="pt-4 flex gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Latência Oracle</p>
              <p className="font-mono text-emerald-500 text-sm font-bold">~42ms</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Pool Ativo</p>
              <p className="font-mono text-emerald-500 text-sm font-bold">Ligado</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
