"use client";

import React, { useState } from "react";
import { Download, Mail, CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { sendReportEmail } from "@/lib/actions/export";
import { ScheduleModal } from "./builder/schedule-modal";
import * as XLSX from 'xlsx';

interface ExportToolbarProps {
    elementIdToExport: string; // ID of the wrapper div to capture
    fileName: string;
    dataset?: string;
    filtros?: any;
    selectedColumns?: string[];
    availableColumns?: { id: string; label: string }[];
    data?: any[]; // The actual data to export
    availableFornecedores?: string[]; // Optional list of suppliers for scheduling
}

export function ExportToolbar({
    elementIdToExport,
    fileName,
    dataset,
    filtros,
    selectedColumns,
    availableColumns = [],
    data = [],
    availableFornecedores = []
}: ExportToolbarProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    // Email form state
    const [emailTo, setEmailTo] = useState("");
    const [emailSubject, setEmailSubject] = useState(`Relatório: ${fileName}`);
    const [emailBody, setEmailBody] = useState("Olá,\n\nSegue em anexo o relatório solicitado.\n\nAtenciosamente,");

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById(elementIdToExport);
            const workbook = XLSX.utils.book_new();
            let worksheet;

            // Tentativa 1: Exportar via DOM (Captura exatamente o que o usuário está vendo, incluindo headers complexos e cores)
            if (element) {
                const table = element.querySelector('table');
                if (table) {
                    worksheet = XLSX.utils.table_to_sheet(table);
                }
            }

            // Tentativa 2: Fallback via Prop data (Se não houver tabela no DOM ou se for uma lista invisível)
            if (!worksheet && data && data.length > 0 && availableColumns.length > 0) {
                const activeCols = availableColumns.filter(c => !selectedColumns || selectedColumns.includes(c.id));
                const formattedData = data.map(item => {
                    const row: Record<string, any> = {};
                    activeCols.forEach(col => {
                        row[col.label] = item[col.id] ?? "";
                    });
                    return row;
                });
                worksheet = XLSX.utils.json_to_sheet(formattedData);
            }

            if (!worksheet) {
                toast.error("Nenhum dado disponível para exportar no momento. Aguarde o carregamento ou verifique os filtros.");
                setIsExporting(false);
                return;
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

            // Gera e baixa o arquivo
            const fileNameWithExt = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileNameWithExt);

            toast.success("Relatório Excel gerado com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar Excel: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsExporting(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailTo) {
            toast.error("Por favor, informe o destinatário.");
            return;
        }

        setIsExporting(true);
        try {
            const element = document.getElementById(elementIdToExport);
            const workbook = XLSX.utils.book_new();
            let worksheet;

            // Mesma lógica de prioridade: DOM Table -> Data Prop
            if (element) {
                const table = element.querySelector('table');
                if (table) {
                    worksheet = XLSX.utils.table_to_sheet(table);
                }
            }

            if (!worksheet && data && data.length > 0 && availableColumns.length > 0) {
                const activeCols = availableColumns.filter(c => !selectedColumns || selectedColumns.includes(c.id));
                const formattedData = data.map(item => {
                    const row: Record<string, any> = {};
                    activeCols.forEach(col => {
                        row[col.label] = item[col.id] ?? "";
                    });
                    return row;
                });
                worksheet = XLSX.utils.json_to_sheet(formattedData);
            }

            if (!worksheet) {
                toast.error("Não foi possível gerar dados para o anexo.");
                setIsExporting(false);
                return;
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

            // Gera o buffer em base64
            const excelBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
            const fileNameWithExt = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;

            const result = await sendReportEmail({
                to: emailTo,
                subject: emailSubject,
                body: emailBody,
                attachmentBase64: excelBase64,
                fileName: fileNameWithExt
            });

            if (result.success) {
                setEmailOpen(false);
                toast.success(`E-mail com anexo Excel enviado para ${emailTo}!`);
            } else {
                toast.error(`Falha ao enviar e-mail: ${result.error}`);
            }
        } catch (err) {
            console.error("Erro no fluxo de e-mail:", err);
            toast.error("Erro no processamento do e-mail: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
                variant="default"
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all whitespace-nowrap"
                onClick={handleExportExcel}
                disabled={isExporting}
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden xs:inline">Exportar Excel</span>
                <span className="xs:hidden">Excel</span>
            </Button>

            {/* MODAL EMAIL */}
            <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary/10 whitespace-nowrap">
                        <Mail className="w-4 h-4 text-primary" />
                        <span className="hidden xs:inline">Enviar Agora</span>
                        <span className="xs:hidden">Enviar</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-card border-border/50 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle>Enviar Relatório por E-mail</DialogTitle>
                        <DialogDescription>
                            O arquivo Excel com os dados atuais será anexado automaticamente a este e-mail.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="to" className="text-right">Para</Label>
                            <Input
                                id="to"
                                value={emailTo}
                                onChange={(e) => setEmailTo(e.target.value)}
                                placeholder="nome@empresa.com"
                                className="col-span-3 bg-background/50"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="subject" className="text-right">Assunto</Label>
                            <Input
                                id="subject"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                className="col-span-3 bg-background/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="body">Mensagem (Corpo do E-mail)</Label>
                            <textarea
                                id="body"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                className="col-span-4 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEmailOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSendEmail} disabled={isExporting} className="gap-2">
                            {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Disparar E-mail
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MODAL AGENDAMENTO */}
            <Button
                variant="outline"
                size="sm"
                className="gap-2 border-chart-1/30 hover:bg-chart-1/10 group whitespace-nowrap"
                onClick={() => setScheduleOpen(true)}
            >
                <CalendarClock className="w-4 h-4 text-chart-1 group-hover:animate-pulse" />
                <span className="hidden xs:inline">Agendar Envios</span>
                <span className="xs:hidden">Agendar</span>
            </Button>

            <ScheduleModal
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                availableColumns={availableColumns}
                defaultColumns={selectedColumns || []}
                dataset={dataset}
                filtros={filtros}
                reportName={fileName}
                availableFornecedores={availableFornecedores}
            />
        </div>
    );
}
