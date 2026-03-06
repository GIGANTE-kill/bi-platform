"use client";

import { useReportStore } from "@/store/useReportStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Mail, CalendarClock, Loader2, Filter, Settings2, AlertTriangle, Columns3, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExportToolbar } from "@/components/ExportToolbar";
import { useState, useEffect } from "react";
import { fetchBuilderData } from "@/lib/actions/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// DnD Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableHeaderCell } from "@/components/builder/SortableHeaderCell";

const DATASETS_CONFIG = {
    vendas: {
        label: "Vendas por Período",
        columns: [
            { id: "dtcarga", label: "Dt Carga" },
            { id: "codprod", label: "Cód. Prod" },
            { id: "codfilialpai", label: "Cód. Filial Pai" },
            { id: "descricao", label: "Descrição" },
            { id: "comprador", label: "Comprador" },
            { id: "codfornec", label: "Cód. Fornecedor" },
            { id: "fornecedor", label: "Fornecedor" },
            { id: "qt", label: "QT" },
            { id: "estoque", label: "Estoque" },
            { id: "codsupervisor", label: "Cód. Supervisor" },
            { id: "codusur", label: "Cód. Usur" },
            { id: "codcli", label: "Cód. Cli" },
            { id: "faturamentoliquido", label: "Faturamento Líquido" },
            { id: "devolucao", label: "Devolução" },
            { id: "custoliquido", label: "Custo Líquido" },
        ],
    }
};

export default function ReportBuilder() {
    const { dataset, selectedColumns, setDataset, toggleColumn, reorderColumns } = useReportStore();

    const [data, setData] = useState<{ vendas: any[] }>({ vendas: [] });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [fornecedor, setFornecedor] = useState<string>("");
    const [selectedFornecedorLocal, setSelectedFornecedorLocal] = useState<string>("todos");
    const [appliedFilters, setAppliedFilters] = useState<{ start: string, end: string, fornecedor: string }>(
        { start: startDate, end: endDate, fornecedor: "" }
    );

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const CACHE_KEY = `builder_cache_${appliedFilters.start}_${appliedFilters.end}_${appliedFilters.fornecedor}`;
                const cached = sessionStorage.getItem(CACHE_KEY);

                if (cached) {
                    setData({ vendas: JSON.parse(cached) });
                    setLoading(false);
                    return;
                }

                const result = await fetchBuilderData(appliedFilters.start, appliedFilters.end, appliedFilters.fornecedor);

                if (result.success && result.vendas) {
                    setData({ vendas: result.vendas });
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(result.vendas));
                } else {
                    setData({ vendas: [] });
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setData({ vendas: [] });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [appliedFilters]);

    const handleApplyFilters = () => {
        setAppliedFilters({ start: startDate, end: endDate, fornecedor });
    };

    const currentDatasetInfo = DATASETS_CONFIG[dataset as keyof typeof DATASETS_CONFIG];
    const activeCols = currentDatasetInfo.columns.filter((c) => selectedColumns.includes(c.id));
    const activeData = data[dataset as keyof typeof data] || [];

    // Filtro Local, Fornecedor
    const uniqueFornecedores = Array.from(new Set(activeData.map(item => item.fornecedor))).filter(Boolean).sort() as string[];
    const filteredData = selectedFornecedorLocal !== "todos"
        ? activeData.filter(item => item.fornecedor === selectedFornecedorLocal)
        : activeData;

    const displayData = filteredData.slice(0, 100); // 🚀 OTIMIZAÇÃO: Limite de preview no DOM

    // DnD Sensors configuration
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires 5px movement before drag starts, allows clicking inputs
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = selectedColumns.indexOf(active.id as string);
            const newIndex = selectedColumns.indexOf(over?.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                reorderColumns(oldIndex, newIndex);
            }
        }
    };

    const handleDatasetChange = (value: string) => {
        // Default select all columns for the new dataset
        const newCols = DATASETS_CONFIG[value as keyof typeof DATASETS_CONFIG].columns.map((c) => c.id);
        setDataset(value, newCols);
    };
    const formatCurrency = (val: any) => {
        if (val === undefined || val === null) return "-";
        const num = Number(val);
        if (isNaN(num)) return val;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const formatNumber = (val: any) => {
        if (val === undefined || val === null) return "-";
        const num = Number(val);
        if (isNaN(num)) return val;
        return new Intl.NumberFormat('pt-BR').format(num);
    };

    const formatDate = (val: any) => {
        if (!val) return "-";
        try {
            const d = new Date(val);
            if (isNaN(d.getTime())) return val;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch (e) {
            return val;
        }
    };

    const getColumnFormatter = (colId: string) => {
        if (['faturamentoliquido', 'devolucao', 'custoliquido'].includes(colId)) return formatCurrency;
        if (['qt', 'estoque'].includes(colId)) return formatNumber;
        if (['dtcarga'].includes(colId)) return formatDate;
        return (val: any) => (val !== undefined && val !== null ? String(val) : "-");
    };

    const getColumnAlignment = (colId: string) => {
        if (['qt', 'estoque', 'faturamentoliquido', 'devolucao', 'custoliquido'].includes(colId)) return 'text-right';
        if (['dtcarga', 'codprod', 'codfilialpai', 'codfornec', 'codsupervisor', 'codusur', 'codcli'].includes(colId)) return 'text-center';
        return 'text-left';
    };

    // Observação: a exportação de PDF foi migrada para o ExportToolbar

    return (
        <div className="flex flex-col flex-1 h-full gap-6 min-h-0 min-w-0 w-full relative">
            {/* Header Area idêntico ao Relatório Financeiro */}
            <div className="flex flex-col xl:flex-row justify-between items-start gap-6 w-full">
                <div className="flex flex-col min-w-0 xl:w-auto">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-primary to-chart-2 truncate">
                        Construtor de Relatórios
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium truncate">
                        Personalize, visualize e agende seus relatórios.
                    </p>

                    <div className="mt-4 bg-card/40 p-3 rounded-xl border border-border/50 backdrop-blur shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Input Buscar Cód/Fornecedor */}
                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder="Buscar código ou fornecedor..."
                                    value={fornecedor}
                                    onChange={(e) => setFornecedor(e.target.value)}
                                    className="w-full bg-background/50 border-input shadow-inner h-9"
                                />
                            </div>

                            {/* Select Filtro de Tela */}
                            <div className="w-full sm:w-[220px]">
                                <Select value={selectedFornecedorLocal} onValueChange={setSelectedFornecedorLocal}>
                                    <SelectTrigger className="w-full bg-background/50 border-input shadow-inner h-9">
                                        <SelectValue placeholder="Fornecedor: Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos na Tela</SelectItem>
                                        {uniqueFornecedores.map(f => (
                                            <SelectItem key={String(f)} value={String(f)} className="text-sm truncate max-w-[200px]">{String(f)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filtro Data */}
                            <div className="flex items-center gap-2 bg-background/50 px-2 py-1 h-9 rounded-md border border-input shadow-inner w-full sm:w-auto">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[125px] bg-transparent border-none p-0 text-sm focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-50"
                                />
                                <span className="text-muted-foreground text-xs font-medium">até</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[125px] bg-transparent border-none p-0 text-sm focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-50"
                                />
                            </div>

                            {/* Separator */}
                            <div className="h-6 w-px bg-border/60 hidden xl:block mx-1" />

                            {/* Ações */}
                            <div className="flex items-center gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                                <Button
                                    onClick={handleApplyFilters}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-6 font-semibold flex-1 xl:flex-none shadow-md shadow-primary/10"
                                >
                                    Buscar Dados
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-9 gap-2 border-input bg-background/50 text-foreground px-4 shrink-0 shadow-sm hover:bg-muted/50">
                                            <Columns3 className="h-4 w-4 text-muted-foreground" />
                                            <span>Colunas ({selectedColumns.length})</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">
                                        <DropdownMenuLabel className="font-bold text-primary">Selecionar Colunas</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-border/50" />
                                        <ScrollArea className="h-72">
                                            <div className="p-1 space-y-1">
                                                {currentDatasetInfo.columns.map((col) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={col.id}
                                                        checked={selectedColumns.includes(col.id)}
                                                        onCheckedChange={() => toggleColumn(col.id)}
                                                        onSelect={(e) => e.preventDefault()}
                                                        className="text-sm cursor-pointer rounded-md hover:bg-primary/10 data-highlighted:bg-primary/10"
                                                    >
                                                        {col.label}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card/40 p-2 md:p-3 rounded-xl border border-border/50 backdrop-blur shadow-sm w-full xl:w-auto h-fit flex items-center justify-center">
                    <ExportToolbar
                        elementIdToExport="builder-report-data"
                        fileName={`Builder_${dataset}`}
                        dataset={dataset}
                        filtros={appliedFilters}
                        selectedColumns={selectedColumns}
                        availableColumns={currentDatasetInfo.columns}
                        data={filteredData}
                        availableFornecedores={Array.from(new Set(activeData.map(item => item.fornecedor))).filter(Boolean).sort() as string[]}
                    />
                </div>
            </div>

            {/* Data Preview Area */}
            <div id="builder-report-data" className="flex flex-col gap-6 w-full print:bg-white print:text-black rounded-lg p-2 min-h-0 flex-1 overflow-hidden">
                <Card className="flex-1 flex flex-col min-w-0 bg-linear-to-br from-background to-muted/20 backdrop-blur-xl border border-border/50 shadow-lg transition-all duration-500 hover:shadow-primary/10">
                    <CardHeader className="border-b border-border/50 pb-4 shrink-0 px-4 md:px-6 print:border-none">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl text-primary">Pré-visualização do Relatório</CardTitle>
                                <CardDescription className="text-sm">A tabela atualiza em tempo real com as seleções de colunas e dados.</CardDescription>
                            </div>
                            {filteredData.length > 200 && !loading && (
                                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider border border-yellow-500/20 uppercase">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Limite na Tela: {displayData.length} ({filteredData.length} Total)</span>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative min-h-0 min-w-0 flex flex-col">
                        {loading && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {!loading && activeCols.length === 0 ? (
                            <div className="flex h-full items-center justify-center p-6 text-muted-foreground text-sm">
                                Nenhuma coluna selecionada.
                            </div>
                        ) : (
                            <div className="flex-1 w-full overflow-x-auto rounded-b-lg">
                                {/* Desktop Table View */}
                                <div className="hidden md:block w-full min-w-max pb-4">
                                    <DndContext
                                        id="dnd-builder"
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <Table>
                                            <TableHeader className="bg-muted/30 sticky top-0 z-20 shadow-sm backdrop-blur-md border-b border-border/50">
                                                <TableRow className="hover:bg-transparent border-b-border/50">
                                                    <SortableContext
                                                        items={activeCols.map((c) => c.id)}
                                                        strategy={horizontalListSortingStrategy}
                                                    >
                                                        {activeCols.map((col) => (
                                                            <SortableHeaderCell
                                                                key={col.id}
                                                                id={col.id}
                                                                label={col.label}
                                                                alignmentClass={getColumnAlignment(col.id)}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="text-sm">
                                                {!loading && displayData.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={activeCols.length} className="text-center py-10 text-muted-foreground">
                                                            Nenhum dado encontrado.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    displayData.map((row, i) => (
                                                        <TableRow key={i} className="border-b-border/20 transition-all duration-300 hover:bg-muted/30">
                                                            {activeCols.map((col) => {
                                                                const formatter = getColumnFormatter(col.id);
                                                                const alignClass = getColumnAlignment(col.id);
                                                                const isNumeric = ['faturamentoliquido', 'devolucao'].includes(col.id);
                                                                const isNeutralAmount = ['qt', 'estoque'].includes(col.id);
                                                                const val = row[col.id as keyof typeof row];

                                                                let textColor = 'text-foreground/90 font-bold';
                                                                let widthClass = '';

                                                                if (isNumeric) {
                                                                    if (typeof val === 'number' && val > 0) textColor = 'text-emerald-400 font-semibold tabular-nums';
                                                                    else if (typeof val === 'number' && val < 0) textColor = 'text-rose-400 font-semibold tabular-nums';
                                                                    else textColor = 'text-muted-foreground font-semibold tabular-nums';
                                                                } else if (isNeutralAmount) {
                                                                    textColor = 'text-sky-400 font-semibold tabular-nums';
                                                                } else if (col.id === 'fornecedor' || col.id === 'descricao') {
                                                                    textColor = 'text-foreground font-extrabold text-sm';
                                                                    widthClass = 'max-w-[150px] sm:max-w-[200px] xl:max-w-[300px] truncate';
                                                                } else if (['codprod', 'codfornec', 'codfilialpai', 'codsupervisor', 'codusur', 'codcli'].includes(col.id)) {
                                                                    textColor = 'text-chart-4/80 font-mono font-semibold';
                                                                } else if (col.id === 'dtcarga') {
                                                                    textColor = 'text-foreground/80 font-medium';
                                                                } else {
                                                                    // Generic string fallback
                                                                    widthClass = 'max-w-[120px] sm:max-w-[150px] truncate';
                                                                }

                                                                return (
                                                                    <TableCell key={col.id} title={val !== null && val !== undefined ? String(val) : ''} className={`py-4 px-4 ${textColor} ${widthClass} ${alignClass}`}>
                                                                        {formatter(val)}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </DndContext>
                                </div>

                                <div className="md:hidden flex flex-col gap-4 p-4">
                                    {!loading && displayData.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground text-sm">
                                            Nenhum dado encontrado.
                                        </div>
                                    ) : (
                                        displayData.map((row, i) => (
                                            <Card key={i} className="bg-linear-to-br from-background/80 to-muted/20 backdrop-blur-md border border-border/50 shadow-sm hover:shadow-primary/5 transition-all">
                                                <CardContent className="p-5 grid gap-4">
                                                    {activeCols.map((col) => {
                                                        const val = row[col.id as keyof typeof row];
                                                        const formatter = getColumnFormatter(col.id);
                                                        const isNumeric = ['entrada', 'saida', 'saldo', 'faturamentoLiquido', 'tributo', 'custoFinanceiro'].includes(col.id);

                                                        let numberColor = 'text-foreground/90';
                                                        if (isNumeric) {
                                                            if (typeof val === 'number' && val > 0) numberColor = 'text-emerald-400';
                                                            else if (typeof val === 'number' && val < 0) numberColor = 'text-rose-400';
                                                            else numberColor = 'text-emerald-400/80';
                                                        }

                                                        return (
                                                            <div key={col.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-4 border-b border-border/20 pb-3 last:border-0 last:pb-0">
                                                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                                                                <span className={`text-lg break-all sm:break-normal sm:text-right font-medium py-1 ${isNumeric ? `font-semibold tabular-nums ${numberColor}` : 'text-foreground font-bold'}`}>
                                                                    {formatter(val)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
