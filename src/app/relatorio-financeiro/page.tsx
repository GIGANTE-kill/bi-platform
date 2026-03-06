"use client";

import { Loader2, Filter, X } from "lucide-react";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { fetchRelatorioFinanceiro } from "@/lib/actions/db";
import { ExportToolbar } from "@/components/ExportToolbar";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RelatorioFinanceiro() {
    const [financialData, setFinancialData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtros de UI
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'w3_saldo', direction: 'desc' });
    const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
    const [searchFornecedor, setSearchFornecedor] = useState("");

    // Filtros de Data. Default: Últimos 28 dias
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(endDate);
        d.setDate(d.getDate() - 28);
        return d.toISOString().split('T')[0];
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Nova lógica: calcular semanas de calendário (Domingo a Sábado)
            const baseDate = new Date(endDate + "T12:00:00");
            const currentSunday = new Date(baseDate);
            currentSunday.setDate(baseDate.getDate() - baseDate.getDay());

            // Início da Semana 1 (3 semanas antes do domingo atual)
            const dStart = new Date(currentSunday);
            dStart.setDate(currentSunday.getDate() - 21);
            const actualStart = dStart.toISOString().split('T')[0];

            setStartDate(actualStart);

            const CACHE_KEY = `finance_cache_v2_${actualStart}_${endDate}`;
            const cached = sessionStorage.getItem(CACHE_KEY);

            if (cached) {
                setFinancialData(JSON.parse(cached));
                setLoading(false);
                return;
            }

            const response = await fetchRelatorioFinanceiro(actualStart, endDate);
            if (response.success) {
                setFinancialData(response.data || []);
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
            } else {
                setError(response.error || "Erro desconhecido");
            }
        } catch (err) {
            setError("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }, [endDate]); // Simplificando dependência para o endDate

    useEffect(() => {
        loadData();
    }, [loadData]);


    // ==========================================
    // CÁLCULO DAS 4 SEMANAS
    // ==========================================

    const weeks = React.useMemo(() => {
        const result = [];
        const baseDate = new Date(endDate + "T12:00:00");

        const currentSunday = new Date(baseDate);
        currentSunday.setDate(baseDate.getDate() - baseDate.getDay());

        for (let i = 0; i < 4; i++) {
            const wStart = new Date(currentSunday);
            wStart.setDate(currentSunday.getDate() - (i * 7));

            const wEnd = new Date(wStart);
            wEnd.setDate(wStart.getDate() + 6);

            // Fim para exibição: se for a semana atual, mostra até o dia selecionado
            const displayEnd = i === 0 ? new Date(Math.min(wEnd.getTime(), baseDate.getTime())) : wEnd;

            result.push({
                index: 4 - i,
                start: wStart.toISOString().split('T')[0],
                end: wEnd.toISOString().split('T')[0],
                label: `Semana ${4 - i}`,
                dates: `${wStart.getDate().toString().padStart(2, '0')}/${(wStart.getMonth() + 1).toString().padStart(2, '0')} a ${displayEnd.getDate().toString().padStart(2, '0')}/${(displayEnd.getMonth() + 1).toString().padStart(2, '0')}`
            });
        }
        return result.reverse();
    }, [endDate]);

    // ==========================================
    // AGRUPAMENTO E TRANSFORMAÇÃO DE DADOS
    // ==========================================

    const uniqueFornecedores = React.useMemo(() => {
        const map = new Map<string, string>();
        financialData.forEach(curr => {
            const id = curr.CODFORNECPRINC || curr.CODFORNEC || "N/A";
            const nome = curr.FORNECEDOR_PRINCIPAL || curr.FORNECEDOR || "FORNECEDOR PRINCIPAL N/I";
            if (id !== "N/A") map.set(id, nome);

            const idSub = curr.CODFORNEC || "N/A";
            const nomeSub = curr.FORNECEDOR || "FORNECEDOR SEM NOME";
            if (idSub !== "N/A") map.set(idSub, nomeSub);
        });
        return Array.from(map.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [financialData]);

    const groupedData = React.useMemo(() => {
        const groups: Record<string, any> = {};

        financialData.forEach((curr) => {
            const principalId = curr.CODFORNECPRINC || curr.CODFORNEC || "N/A";
            const principalNome = curr.FORNECEDOR_PRINCIPAL || curr.FORNECEDOR || "FORNECEDOR PRINCIPAL N/I";
            const chavePrincipal = `${principalId}-${principalNome}`;

            const fornecId = curr.CODFORNEC || "N/A";
            const fornecNome = curr.FORNECEDOR || "FORNECEDOR SEM NOME";
            const subChave = `${fornecId}-${fornecNome}`;

            const itemDateStr = new Date(curr.DATA_EXATA).toISOString().split('T')[0];

            if (selectedFornecedores.length > 0) {
                if (!selectedFornecedores.includes(String(principalId)) && !selectedFornecedores.includes(String(fornecId))) {
                    return;
                }
            }

            // Encontrar em qual semana o item cai
            const weekIndex = weeks.findIndex(w => itemDateStr >= w.start && itemDateStr <= w.end);
            if (weekIndex === -1) return;

            if (!groups[chavePrincipal]) {
                groups[chavePrincipal] = {
                    codFornec: principalId,
                    fornecedor: principalNome,
                    isPrincipal: true,
                    weeksData: weeks.map(() => ({ entrada: 0, saida: 0, estoque: 0, hasStockRecord: false })),
                    subFornecedores: {}
                };
            }

            // Acumula no Principal
            groups[chavePrincipal].weeksData[weekIndex].entrada += curr.VALOR_ENTRADA || 0;
            groups[chavePrincipal].weeksData[weekIndex].saida += curr.VALOR_SAIDA || 0;

            // Pega o estoque mais recente da semana (assumindo ordem decrescente de data)
            if (!groups[chavePrincipal].weeksData[weekIndex].hasStockRecord) {
                groups[chavePrincipal].weeksData[weekIndex].estoque = curr.VALOR_ESTOQUE_VENDA || 0;
                groups[chavePrincipal].weeksData[weekIndex].hasStockRecord = true;
            }

            if (!groups[chavePrincipal].subFornecedores[subChave]) {
                groups[chavePrincipal].subFornecedores[subChave] = {
                    codFornec: fornecId,
                    fornecedor: fornecNome,
                    isPrincipal: false,
                    weeksData: weeks.map(() => ({ entrada: 0, saida: 0, estoque: 0, hasStockRecord: false }))
                };
            }

            // Acumula no Sub
            groups[chavePrincipal].subFornecedores[subChave].weeksData[weekIndex].entrada += curr.VALOR_ENTRADA || 0;
            groups[chavePrincipal].subFornecedores[subChave].weeksData[weekIndex].saida += curr.VALOR_SAIDA || 0;
            if (!groups[chavePrincipal].subFornecedores[subChave].weeksData[weekIndex].hasStockRecord) {
                groups[chavePrincipal].subFornecedores[subChave].weeksData[weekIndex].estoque = curr.VALOR_ESTOQUE_VENDA || 0;
                groups[chavePrincipal].subFornecedores[subChave].weeksData[weekIndex].hasStockRecord = true;
            }
        });

        return groups;
    }, [financialData, weeks, selectedFornecedores]);

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const displayData = React.useMemo(() => {
        let items = Object.values(groupedData).map((principal: any) => {
            const subFornecedoresArray = Object.values(principal.subFornecedores).map((sub: any) => {
                const weeks = sub.weeksData.map((w: any) => ({ ...w, saldo: w.saida - w.entrada }));
                const totalEntrada = weeks.reduce((acc: number, w: any) => acc + w.entrada, 0);
                const totalSaida = weeks.reduce((acc: number, w: any) => acc + w.saida, 0);
                return {
                    ...sub,
                    weeks,
                    totalEntrada,
                    totalSaida,
                    totalSaldo: totalSaida - totalEntrada
                };
            });

            const weeks = principal.weeksData.map((w: any) => ({ ...w, saldo: w.saida - w.entrada }));
            const totalEntrada = weeks.reduce((acc: number, w: any) => acc + w.entrada, 0);
            const totalSaida = weeks.reduce((acc: number, w: any) => acc + w.saida, 0);

            return {
                ...principal,
                subFornecedores: subFornecedoresArray,
                weeks,
                totalEntrada,
                totalSaida,
                totalSaldo: totalSaida - totalEntrada
            };
        });

        const sortedItems = [...items].sort((a, b) => {
            let valA: any, valB: any;
            if (sortConfig.key === 'codFornec' || sortConfig.key === 'fornecedor') {
                valA = String(a[sortConfig.key] || '').toLowerCase();
                valB = String(b[sortConfig.key] || '').toLowerCase();
                return sortConfig.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            } else if (sortConfig.key.startsWith('w')) {
                const parts = sortConfig.key.substring(1).split('_');
                const idx = parseInt(parts[0]);
                const metric = parts[1];
                valA = a.weeks[idx]?.[metric] || 0;
                valB = b.weeks[idx]?.[metric] || 0;
            } else if (sortConfig.key.startsWith('total')) {
                valA = a[sortConfig.key as keyof typeof a] || 0;
                valB = b[sortConfig.key as keyof typeof b] || 0;
            } else {
                valA = 0;
                valB = 0;
            }
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });

        return sortedItems;
    }, [groupedData, sortConfig]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
    };

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const toggleRow = (codFornec: string) => {
        setExpandedRows(prev => ({ ...prev, [codFornec]: !prev[codFornec] }));
    };

    const totals = React.useMemo(() => {
        let entrada = 0;
        let saida = 0;
        let estoque = 0;
        displayData.forEach(item => {
            item.weeks.forEach((w: any, idx: number) => {
                entrada += w.entrada;
                saida += w.saida;
                // Para o estoque total na tela, usamos apenas a última semana (mais atual)
                if (idx === 3) estoque += w.estoque;
            });
        });
        return { entrada, saida, estoque, saldo: saida - entrada };
    }, [displayData]);

    const exportDataFlat = React.useMemo(() => {
        return displayData.map(item => {
            const flat: any = {
                codFornec: item.codFornec,
                fornecedor: item.fornecedor,
            };
            item.weeks.forEach((w: any, idx: number) => {
                flat[`w${idx}_entrada`] = w.entrada;
                flat[`w${idx}_saida`] = w.saida;
                flat[`w${idx}_estoque`] = w.estoque;
                flat[`w${idx}_saldo`] = w.saldo;
            });
            flat.totalEntrada = item.totalEntrada;
            flat.totalSaida = item.totalSaida;
            flat.totalSaldo = item.totalSaldo;
            return flat;
        });
    }, [displayData]);

    const exportColumns = React.useMemo(() => {
        const cols = [
            { id: 'codFornec', label: 'Código' },
            { id: 'fornecedor', label: 'Fornecedor' },
        ];
        weeks.forEach((w, idx) => {
            cols.push({ id: `w${idx}_entrada`, label: `${w.label} - Entrada` });
            cols.push({ id: `w${idx}_saida`, label: `${w.label} - Saída` });
            cols.push({ id: `w${idx}_estoque`, label: `${w.label} - Estoque` });
            cols.push({ id: `w${idx}_saldo`, label: `${w.label} - Saldo` });
        });
        cols.push({ id: 'totalEntrada', label: 'Total Entrada (Geral)' });
        cols.push({ id: 'totalSaida', label: 'Total Saída (Geral)' });
        cols.push({ id: 'totalSaldo', label: 'Total Saldo (Geral)' });
        return cols;
    }, [weeks]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 min-h-[80px]">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-2 whitespace-nowrap">
                        Visão Geral de Fornecedor
                    </h1>
                    <p className="text-muted-foreground font-medium text-xs md:text-sm">
                        Acompanhamento semanal de fluxo consolidado.
                    </p>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-card/40 p-1.5 md:p-2 rounded-xl border border-border/50 backdrop-blur-lg shadow-sm w-full xl:w-auto">
                    <div className="flex items-center gap-1.5 flex-1 md:flex-none">
                        <ExportToolbar
                            elementIdToExport="finance-report-data"
                            fileName="Relatorio_Financeiro_Completo"
                            dataset="Relatório Financeiro"
                            filtros={{ endDate }}
                            availableColumns={exportColumns}
                            selectedColumns={exportColumns.map(c => c.id)}
                            data={exportDataFlat}
                        />
                    </div>

                    <div className="h-6 w-px bg-border/40 hidden md:block mx-1" />

                    <div className="flex items-center gap-2 px-2.5 bg-background/50 py-1 rounded-lg border border-border/40 shadow-inner flex-1 md:flex-none justify-between md:justify-start">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary outline-none transition-colors">
                                <Filter className="h-3 w-3" />
                                Fornecedores {selectedFornecedores.length > 0 ? `(${selectedFornecedores.length})` : '(Todos)'}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[280px] max-h-[400px] flex flex-col p-0">
                                <div className="p-2 border-b border-border/40 bg-muted/20 sticky top-0 z-10 space-y-2">
                                    <Input
                                        placeholder="Buscar código ou nome..."
                                        value={searchFornecedor}
                                        onChange={e => setSearchFornecedor(e.target.value)}
                                        className="h-8 text-xs bg-background"
                                    />
                                    {selectedFornecedores.length > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedFornecedores([]); }}
                                            className="text-[10px] text-rose-500 font-bold hover:text-rose-400 flex items-center gap-1 w-full"
                                        >
                                            <X className="h-3 w-3" /> Limpar Seleção
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-y-auto flex-1 p-1">
                                    {uniqueFornecedores.filter(f => f.nome.toLowerCase().includes(searchFornecedor.toLowerCase()) || f.id.includes(searchFornecedor)).map(f => (
                                        <DropdownMenuCheckboxItem
                                            key={f.id}
                                            checked={selectedFornecedores.includes(f.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setSelectedFornecedores(prev => [...prev, f.id]);
                                                else setSelectedFornecedores(prev => prev.filter(id => id !== f.id));
                                            }}
                                            className="text-xs py-1.5 cursor-pointer max-w-full"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <span className="font-mono text-muted-foreground mr-2 shrink-0">{f.id}</span>
                                            <span className="truncate">{f.nome}</span>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    {uniqueFornecedores.filter(f => f.nome.toLowerCase().includes(searchFornecedor.toLowerCase()) || f.id.includes(searchFornecedor)).length === 0 && (
                                        <div className="p-4 text-center text-xs text-muted-foreground">Nenhum fornecedor encontrado</div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="h-6 w-px bg-border/40 hidden md:block mx-1" />

                    <div className="flex items-center gap-2 px-2.5 bg-background/50 py-1 rounded-lg border border-border/40 shadow-inner flex-1 md:flex-none justify-between md:justify-start">
                        <span className="text-muted-foreground text-[9px] uppercase font-bold tracking-widest whitespace-nowrap opacity-70">Base</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-[120px] bg-transparent border-none h-6 p-0 focus-visible:ring-0 text-xs md:text-sm font-bold selection:bg-primary/30 cursor-pointer text-center md:text-left"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full print:bg-white print:text-black rounded-lg">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-rose-500">Consolidado Entrada (4S)</CardDescription>
                            <CardTitle className="text-2xl text-rose-500">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : formatCurrency(totals.entrada)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-emerald-500">Consolidado Saída (4S)</CardDescription>
                            <CardTitle className="text-2xl text-emerald-500">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : formatCurrency(totals.saida)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className={`bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border ${totals.saldo >= 0 ? 'border-primary/50 hover:shadow-primary/20' : 'border-red-500/50 hover:shadow-red-500/20'}`}>
                        <CardHeader className="pb-2">
                            <CardDescription className={totals.saldo >= 0 ? 'text-primary' : 'text-red-500'}>Saldo Final (4S)</CardDescription>
                            <CardTitle className={`text-2xl ${totals.saldo >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : formatCurrency(totals.saldo)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className="bg-linear-to-br from-background/90 to-muted/30 backdrop-blur-md border border-border/50 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-sky-500">Estoque Atual (Preço Venda)</CardDescription>
                            <CardTitle className="text-2xl text-sky-500">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : formatCurrency(totals.estoque)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
                <Card id="finance-report-data" className="bg-linear-to-br from-background to-muted/20 backdrop-blur-xl border border-border/50 shadow-lg flex flex-col flex-1 overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl text-primary">Comparativo Semanal</CardTitle>
                        <CardDescription>Visualização das últimas 4 semanas encerrando em {new Date(endDate).toLocaleDateString()}.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <div className="overflow-x-auto w-full">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-md z-20">
                                    <TableRow className="border-b-border/50">
                                        <TableHead
                                            rowSpan={2}
                                            className="w-[100px] min-w-[100px] max-w-[100px] font-black text-[10px] md:text-xs uppercase py-4 px-4 sticky left-0 bg-[#09090b] border-r border-border/40 cursor-pointer hover:bg-muted/80 transition-colors z-35 shadow-[2px_0_0_0_rgba(0,0,0,0.2)]"
                                            onClick={() => handleSort('codFornec')}
                                        >
                                            Cód {sortConfig.key === 'codFornec' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead
                                            rowSpan={2}
                                            className="w-[200px] min-w-[200px] max-w-[200px] font-black text-[10px] md:text-xs uppercase py-4 px-4 sticky left-[100px] bg-[#09090b] border-r border-[#18181b] shadow-[4px_0_12px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-muted/80 transition-colors z-30"
                                            onClick={() => handleSort('fornecedor')}
                                        >
                                            Fornecedor {sortConfig.key === 'fornecedor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>

                                        {weeks.map((week) => (
                                            <TableHead key={week.index} colSpan={4} className="text-center bg-primary/5 border-r border-border/20 py-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-primary/60 font-medium">{week.label}</span>
                                                    <span className="text-[9px] text-muted-foreground">{week.dates}</span>
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead colSpan={3} className="text-center bg-chart-2/10 border-r border-border/20 py-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-chart-2 font-bold uppercase tracking-wider">Geral (4 Semanas)</span>
                                                <span className="text-[9px] text-muted-foreground italic">Total do Período</span>
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                    <TableRow className="border-b-border/50">
                                        {weeks.map((week, wIdx) => (
                                            <React.Fragment key={`sub-${week.index}`}>
                                                <TableHead
                                                    className="text-right text-[10px] font-bold uppercase py-2 px-2 bg-muted/20 cursor-pointer hover:bg-muted/40"
                                                    onClick={() => handleSort(`w${wIdx}_entrada`)}
                                                >
                                                    Entrada {sortConfig.key === `w${wIdx}_entrada` && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </TableHead>
                                                <TableHead
                                                    className="text-center text-[10px] font-bold uppercase py-2 px-2 bg-muted/20 cursor-pointer hover:bg-muted/40"
                                                    onClick={() => handleSort(`w${wIdx}_saida`)}
                                                >
                                                    Saída {sortConfig.key === `w${wIdx}_saida` && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </TableHead>
                                                <TableHead
                                                    className="text-center text-[10px] font-bold uppercase py-2 px-2 bg-muted/20 cursor-pointer hover:bg-muted/40"
                                                    onClick={() => handleSort(`w${wIdx}_estoque`)}
                                                >
                                                    Estoque {sortConfig.key === `w${wIdx}_estoque` && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </TableHead>
                                                <TableHead
                                                    className="text-center text-[10px] font-bold uppercase py-2 px-2 border-r border-border/20 bg-muted/60 cursor-pointer hover:bg-muted/70 transition-colors text-primary/80"
                                                    onClick={() => handleSort(`w${wIdx}_saldo`)}
                                                >
                                                    Saldo {sortConfig.key === `w${wIdx}_saldo` && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                                </TableHead>
                                            </React.Fragment>
                                        ))}
                                        <TableHead
                                            className="text-right text-[10px] font-bold uppercase py-2 px-3 bg-chart-2/10 cursor-pointer hover:bg-chart-2/20 transition-colors"
                                            onClick={() => handleSort('totalEntrada')}
                                        >
                                            Entrada {sortConfig.key === 'totalEntrada' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead
                                            className="text-center text-[10px] font-bold uppercase py-2 px-3 bg-chart-2/10 cursor-pointer hover:bg-chart-2/20 transition-colors"
                                            onClick={() => handleSort('totalSaida')}
                                        >
                                            Saída {sortConfig.key === 'totalSaida' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead
                                            className="text-center text-[10px] font-bold uppercase py-2 px-3 border-r border-border/20 bg-chart-2/20 cursor-pointer hover:bg-chart-2/30 transition-colors shadow-inner"
                                            onClick={() => handleSort('totalSaldo')}
                                        >
                                            Saldo Geral {sortConfig.key === 'totalSaldo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={18} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                    ) : (
                                        displayData.map((item) => (
                                            <React.Fragment key={item.codFornec}>
                                                <TableRow className="hover:bg-primary/20 group transition-all duration-200 cursor-pointer border-b border-border/40 even:bg-muted/5 font-medium h-[60px]" onClick={() => toggleRow(item.codFornec)}>
                                                    <TableCell className="w-[100px] min-w-[100px] max-w-[100px] font-mono text-[11px] py-4 px-4 sticky left-0 bg-[#09090b] group-hover:bg-muted/90 transition-colors border-r border-border/40 z-20 shadow-[2px_0_0_0_rgba(0,0,0,0.2)]">
                                                        <div className="truncate w-full">{item.codFornec}</div>
                                                    </TableCell>
                                                    <TableCell className="w-[200px] min-w-[200px] max-w-[200px] font-bold text-xs py-4 px-4 sticky left-[100px] bg-[#09090b] group-hover:bg-muted/90 transition-colors border-r border-border/40 shadow-[4px_0_12px_rgba(0,0,0,0.4)] z-20">
                                                        <div className="truncate w-full">{item.fornecedor}</div>
                                                    </TableCell>

                                                    {item.weeks.map((w: any, idx: number) => (
                                                        <React.Fragment key={idx}>
                                                            <TableCell className="text-right text-[11px] tabular-nums text-foreground/80 font-medium px-2">{formatCurrency(w.entrada)}</TableCell>
                                                            <TableCell className="text-center text-[11px] tabular-nums text-foreground/80 font-medium px-2">{formatCurrency(w.saida)}</TableCell>
                                                            <TableCell className="text-center text-[11px] tabular-nums text-sky-400 font-medium px-2">{formatCurrency(w.estoque)}</TableCell>
                                                            <TableCell className="text-center p-1 border-r border-border/20 bg-muted/5">
                                                                <div className={`text-[11px] tabular-nums font-black py-1 px-2 rounded-sm inline-block min-w-[80px] ${w.saldo > 0 ? 'bg-emerald-500/15 text-emerald-500' : w.saldo < 0 ? 'bg-rose-500/15 text-rose-500' : 'bg-muted/30 text-muted-foreground/60'}`}>
                                                                    {formatCurrency(w.saldo)}
                                                                </div>
                                                            </TableCell>
                                                        </React.Fragment>
                                                    ))}

                                                    {/* Colunas Gerais */}
                                                    <TableCell className="text-right text-[11px] tabular-nums text-foreground/90 font-bold px-3 bg-chart-2/5 border-l border-border/20">
                                                        {formatCurrency(item.totalEntrada)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-[11px] tabular-nums text-foreground/90 font-bold px-3 bg-chart-2/5">
                                                        {formatCurrency(item.totalSaida)}
                                                    </TableCell>
                                                    <TableCell className="text-center p-1 border-r border-border/20 bg-chart-2/10 shadow-inner">
                                                        <div className={`text-[11px] tabular-nums font-black py-1 px-3 rounded-sm inline-block min-w-[90px] ${item.totalSaldo > 0 ? 'bg-emerald-500/25 text-emerald-500 shadow-sm' : item.totalSaldo < 0 ? 'bg-rose-500/25 text-rose-500 shadow-sm' : 'bg-muted/30 text-muted-foreground/60'}`}>
                                                            {formatCurrency(item.totalSaldo)}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {expandedRows[item.codFornec] && item.subFornecedores.map((sub: any) => (
                                                    <TableRow key={sub.codFornec} className="bg-muted/5 hover:bg-muted/10">
                                                        <TableCell className="w-[100px] min-w-[100px] max-w-[100px] font-mono text-[10px] py-2 px-4 pl-8 sticky left-0 bg-[#121214] z-10 border-r border-border/40 text-muted-foreground shadow-[2px_0_0_0_rgba(0,0,0,0.1)]">
                                                            <div className="truncate w-full">↳ {sub.codFornec}</div>
                                                        </TableCell>
                                                        <TableCell className="w-[200px] min-w-[200px] max-w-[200px] text-[10px] py-2 px-4 sticky left-[100px] bg-[#121214] z-10 border-r border-border/40 shadow-[4px_0_8px_rgba(0,0,0,0.3)] italic">
                                                            <div className="truncate w-full">{sub.fornecedor}</div>
                                                        </TableCell>

                                                        {sub.weeks.map((w: any, idx: number) => (
                                                            <React.Fragment key={idx}>
                                                                <TableCell className="text-right text-[10px] tabular-nums text-muted-foreground/80 px-2">{formatCurrency(w.entrada)}</TableCell>
                                                                <TableCell className="text-center text-[10px] tabular-nums text-muted-foreground/80 px-2">{formatCurrency(w.saida)}</TableCell>
                                                                <TableCell className="text-center text-[10px] tabular-nums text-sky-400/70 px-2">{formatCurrency(w.estoque)}</TableCell>
                                                                <TableCell className="text-center p-1 border-r border-border/20">
                                                                    <div className={`text-[10px] tabular-nums font-bold py-0.5 px-2 rounded-sm inline-block min-w-[70px] ${w.saldo > 0 ? 'bg-emerald-500/10 text-emerald-500/80' : w.saldo < 0 ? 'bg-rose-500/10 text-rose-500/80' : 'bg-muted/20 text-muted-foreground/40'}`}>
                                                                        {formatCurrency(w.saldo)}
                                                                    </div>
                                                                </TableCell>
                                                            </React.Fragment>
                                                        ))}

                                                        {/* Colunas Gerais Sub */}
                                                        <TableCell className="text-right text-[10px] tabular-nums text-muted-foreground/90 px-3 bg-chart-2/5 border-l border-border/20 italic">
                                                            {formatCurrency(sub.totalEntrada)}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[10px] tabular-nums text-muted-foreground/90 px-3 bg-chart-2/5 italic">
                                                            {formatCurrency(sub.totalSaida)}
                                                        </TableCell>
                                                        <TableCell className="text-center p-1 border-r border-border/20 bg-chart-2/10">
                                                            <div className={`text-[10px] tabular-nums font-bold py-0.5 px-3 rounded-sm inline-block min-w-[80px] ${sub.totalSaldo > 0 ? 'bg-emerald-500/15 text-emerald-500/90' : sub.totalSaldo < 0 ? 'bg-rose-500/15 text-rose-500/90' : 'bg-muted/20 text-muted-foreground/40'}`}>
                                                                {formatCurrency(sub.totalSaldo)}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
