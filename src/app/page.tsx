"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { fetchDashboardOverview } from "@/lib/actions/db";
import { ExportToolbar } from "@/components/ExportToolbar";
import { Loader2 } from "lucide-react";

const salesChartConfig = {
  RECEITA: { label: "Receita (Vendas)", color: "var(--color-chart-1)" },
  CUSTO_ENTRADA: { label: "Entradas (Compras)", color: "var(--color-chart-5)" },
} satisfies ChartConfig;

const supplierChartConfig = {
  VALOR_COMPRADO: { label: "Volume de Compras", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [supplierData, setSupplierData] = useState<any[]>([]);

  // Indicadores
  const [totalReceita, setTotalReceita] = useState(0);
  const [totalCusto, setTotalCusto] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const CACHE_KEY = "dashboard_overview_data";

      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setMonthlyData(parsed.monthly || []);
          setSupplierData(parsed.topFornecedores || []);
          if (parsed.monthly) {
            setTotalReceita(parsed.monthly.reduce((acc: number, cur: any) => acc + (cur.RECEITA || 0), 0));
            setTotalCusto(parsed.monthly.reduce((acc: number, cur: any) => acc + (cur.CUSTO_ENTRADA || 0), 0));
          }
          setLoading(false);
          return;
        }

        const response = await fetchDashboardOverview();
        if (response.success && response.data) {
          setMonthlyData(response.data.monthly || []);
          setSupplierData(response.data.topFornecedores || []);

          if (response.data.monthly) {
            const rc = response.data.monthly.reduce((acc: number, cur: any) => acc + (cur.RECEITA || 0), 0);
            const ct = response.data.monthly.reduce((acc: number, cur: any) => acc + (cur.CUSTO_ENTRADA || 0), 0);
            setTotalReceita(rc);
            setTotalCusto(ct);
          }
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
        } else {
          setError(response.error || "Erro desconhecido ao carregar Dashboard.");
        }
      } catch (err) {
        setError("Erro na conexão com dados do dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatShortCurrency = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
    return `R$ ${val}`;
  };

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Header e Ferramentas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-3">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Desempenho financeiro semestral consolidado do Oracle ERP
          </p>
        </div>
        <ExportToolbar
          elementIdToExport="dashboard-report"
          fileName="Dashboard_Gerencial"
          dataset="Dashboard"
          availableColumns={[]}
          selectedColumns={[]}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-md">
          {error}
        </div>
      )}

      <div id="dashboard-report" className="flex flex-col gap-6 bg-background rounded-lg p-2 print:bg-white print:text-black">

        {/* Indicadores */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Faturamento 6 Meses</CardDescription>
              <CardTitle className="text-2xl text-foreground">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : formatCurrency(totalReceita)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">+ Crescimento ativo</div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Custo Entrada 6 Meses</CardDescription>
              <CardTitle className="text-2xl text-emerald-500">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : formatCurrency(totalCusto)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Volume gasto com compras</div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Top Fornecedores</CardDescription>
              <CardTitle className="text-2xl text-foreground">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : supplierData.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Volume significativo no mês</div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Margem Bruta (Est.)</CardDescription>
              <CardTitle className="text-2xl text-primary">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : `${totalReceita > 0 ? (((totalReceita - totalCusto) / totalReceita) * 100).toFixed(1) : 0}%`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Cálculo simplificado</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-linear-to-br from-background to-muted/20 backdrop-blur-xl border border-border/50 shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-500">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Receita vs. Custos (6 Meses)</CardTitle>
              <CardDescription>Fluxo histórico do balanço financeiro</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </div>
              ) : (
                <ChartContainer config={salesChartConfig}>
                  <AreaChart data={monthlyData} margin={{ left: -20, right: 12 }}>
                    <CartesianGrid vertical={false} strokeOpacity={0.1} />
                    <XAxis
                      dataKey="MES_ANO"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickCount={6}
                      tickFormatter={formatShortCurrency}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area
                      dataKey="RECEITA"
                      type="monotone"
                      fill="var(--color-RECEITA)"
                      fillOpacity={0.2}
                      stroke="var(--color-RECEITA)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="CUSTO_ENTRADA"
                      type="monotone"
                      fill="var(--color-CUSTO_ENTRADA)"
                      fillOpacity={0.2}
                      stroke="var(--color-CUSTO_ENTRADA)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-background to-muted/20 backdrop-blur-xl border border-border/50 shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-500">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Top 5 Fornecedores</CardTitle>
              <CardDescription>Por Volume de Compra (Mês Corrente)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                </div>
              ) : supplierData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">Sem dados suficientes no mês...</div>
              ) : (
                <ChartContainer config={supplierChartConfig}>
                  <BarChart data={supplierData} margin={{ left: -20, right: 12 }}>
                    <CartesianGrid vertical={false} strokeOpacity={0.1} />
                    <XAxis
                      dataKey="FORNECEDOR"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickCount={5}
                      tickFormatter={formatShortCurrency}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="VALOR_COMPRADO"
                      fill="var(--color-VALOR_COMPRADO)"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
