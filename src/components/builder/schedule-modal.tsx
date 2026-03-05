"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CalendarClock, Plus, List, Trash2, Edit2, Power, History, Clock, Mail, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus
} from "@/lib/actions/scheduler";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScheduleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableColumns: { id: string; label: string }[];
    defaultColumns: string[];
    dataset?: string;
    filtros?: any;
    reportName?: string;
}

export function ScheduleModal({
    open,
    onOpenChange,
    availableColumns,
    defaultColumns,
    dataset = "GERAL",
    filtros = {},
    reportName = ""
}: ScheduleModalProps) {
    const [activeTab, setActiveTab] = useState("list");
    const [schedules, setSchedules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [emails, setEmails] = useState("");
    const [frequency, setFrequency] = useState("WEEKLY");
    const [selectedCols, setSelectedCols] = useState<string[]>(defaultColumns);
    const [scheduleName, setScheduleName] = useState("");

    const fetchSchedules = useCallback(async () => {
        setIsLoading(true);
        const result = await getSchedules();
        if (result.success) {
            setSchedules(result.data || []);
        } else {
            toast.error(result.error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (open) {
            fetchSchedules();
            resetForm();
            setActiveTab("list");
        }
    }, [open, fetchSchedules]);

    const resetForm = () => {
        setEmails("");
        setFrequency("WEEKLY");
        setSelectedCols(defaultColumns);
        setScheduleName(reportName ? `Envio: ${reportName}` : "Novo Agendamento");
        setEditingId(null);
    };

    const handleEdit = (schedule: any) => {
        setEditingId(schedule.id);
        setScheduleName(schedule.nome);
        setEmails(schedule.emails);
        setFrequency(schedule.frequency);
        try {
            setSelectedCols(JSON.parse(schedule.selectedColumns));
        } catch (e) {
            setSelectedCols(defaultColumns);
        }
        setActiveTab("form");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;
        const result = await deleteSchedule(id);
        if (result.success) {
            toast.success("Agendamento excluído.");
            fetchSchedules();
        } else {
            toast.error(result.error);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const result = await toggleScheduleStatus(id, !currentStatus);
        if (result.success) {
            toast.success(currentStatus ? "Agendamento desativado." : "Agendamento ativado.");
            fetchSchedules();
        } else {
            toast.error(result.error);
        }
    };

    const handleSave = async () => {
        if (!emails.trim()) {
            toast.error("Insira pelo menos um e-mail.");
            return;
        }
        if (selectedCols.length === 0) {
            toast.error("Selecione pelo menos uma coluna.");
            return;
        }

        setIsSaving(true);
        const data = {
            nome: scheduleName,
            dataset,
            filtros,
            selectedColumns: selectedCols,
            emails,
            frequency
        };

        try {
            let result;
            if (editingId) {
                result = await updateSchedule(editingId, data);
            } else {
                result = await createSchedule(data);
            }

            if (result.success) {
                toast.success(editingId ? "Agendamento atualizado!" : "Agendamento criado!");
                fetchSchedules();
                setActiveTab("list");
                resetForm();
            } else {
                toast.error(result.error || "Erro ao salvar.");
            }
        } catch (error) {
            toast.error("Erro na comunicação com o servidor.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleColumn = (id: string) => {
        setSelectedCols((prev) =>
            prev.includes(id) ? prev.filter((col) => col !== id) : [...prev, id]
        );
    };

    const formatDate = (date: any) => {
        if (!date) return "-";
        return new Date(date).toLocaleString('pt-BR');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-card border-border/50 glow max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0 border-b border-border/50">
                    <DialogTitle className="text-2xl text-primary flex items-center gap-2">
                        <CalendarClock className="h-6 w-6" /> Agendamento de Relatórios
                    </DialogTitle>
                    <DialogDescription>
                        Gerencie os envios automáticos para os destinatários desejados.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 py-2 bg-muted/20 border-b border-border/50">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list" className="gap-2">
                                <List className="h-4 w-4" /> Agendamentos Ativos
                            </TabsTrigger>
                            <TabsTrigger value="form" className="gap-2">
                                {editingId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {editingId ? "Editar Agendamento" : "Novo Agendamento"}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="list" className="flex-1 overflow-auto p-6 m-0">
                        {isLoading ? (
                            <div className="flex h-40 items-center justify-center text-muted-foreground">
                                Carregando agendamentos...
                            </div>
                        ) : schedules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-60 gap-4 text-center">
                                <div className="p-4 rounded-full bg-primary/10 text-primary">
                                    <Clock className="h-10 w-10" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Nenhum agendamento encontrado</h3>
                                    <p className="text-sm text-muted-foreground max-w-[300px]">
                                        Você ainda não configurou nenhum envio automático para este relatório.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => setActiveTab("form")} className="gap-2">
                                    <Plus className="h-4 w-4" /> Criar Primeiro Agendamento
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/50">
                                            <TableHead>Nome / Frequência</TableHead>
                                            <TableHead>Destinatários</TableHead>
                                            <TableHead>Próximo Envio</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {schedules.map((s) => (
                                            <TableRow key={s.id} className="border-border/30 hover:bg-muted/30">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold flex items-center gap-2">
                                                            {s.nome}
                                                            {!s.active && <Badge variant="secondary" className="text-[10px] py-0 px-1 opacity-70">Desativado</Badge>}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                                            <History className="h-3 w-3" /> {s.frequency}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-[150px]" title={s.emails}>
                                                        <Mail className="h-3 w-3 shrink-0" /> {s.emails}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {s.active ? formatDate(s.nextRunAt) : "Pausado"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(s)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-8 w-8 ${s.active ? 'text-amber-500' : 'text-emerald-500'}`}
                                                            onClick={() => handleToggle(s.id, s.active)}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="form" className="flex-1 overflow-auto p-6 m-0 pb-20 relative">
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold flex items-center gap-1.5">
                                    Nome do Agendamento
                                </label>
                                <Input
                                    value={scheduleName}
                                    onChange={(e) => setScheduleName(e.target.value)}
                                    placeholder="Ex: Vendas Mensal - Adm"
                                    className="bg-background/50 border-input"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                                        <Clock className="h-4 w-4" /> Frequência de Envio
                                    </label>
                                    <Select value={frequency} onValueChange={setFrequency}>
                                        <SelectTrigger className="bg-background/50 border-input">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DAILY">Diário (08:00)</SelectItem>
                                            <SelectItem value="WEEKLY">Semanal (Segunda-feira)</SelectItem>
                                            <SelectItem value="MONTHLY">Mensal (Dia 1)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                                        <Users className="h-4 w-4" /> E-mails (Destinatários)
                                    </label>
                                    <Input
                                        value={emails}
                                        onChange={(e) => setEmails(e.target.value)}
                                        placeholder="separados por vírgula"
                                        className="bg-background/50 border-input"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 pt-4 border-t border-border/30">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                                        Colunas do Relatório ({selectedCols.length})
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="xs"
                                        className="text-[10px] h-6 px-2"
                                        onClick={() => setSelectedCols(availableColumns.map(c => c.id))}
                                    >
                                        Selecionar Todas
                                    </Button>
                                </div>
                                <ScrollArea className="h-48 rounded-md border border-border/50 bg-background/30 p-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {availableColumns.map((col) => (
                                            <label
                                                key={col.id}
                                                className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1.5 rounded-sm transition-colors"
                                            >
                                                <Checkbox
                                                    checked={selectedCols.includes(col.id)}
                                                    onCheckedChange={() => toggleColumn(col.id)}
                                                />
                                                <span className="text-[11px] font-medium leading-none">
                                                    {col.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        <div className="absolute bottom-6 right-6 flex gap-3">
                            <Button variant="ghost" onClick={() => { setActiveTab("list"); resetForm(); }}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                            >
                                {isSaving ? "Salvando..." : (editingId ? "Salvar Alterações" : "Criar Agendamento")}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
