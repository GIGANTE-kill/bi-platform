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

interface ExportToolbarProps {
    elementIdToExport: string; // ID of the wrapper div to capture
    fileName: string;
    dataset?: string;
    filtros?: any;
    selectedColumns?: string[];
    availableColumns?: { id: string; label: string }[];
}

export function ExportToolbar({
    elementIdToExport,
    fileName,
    dataset,
    filtros,
    selectedColumns,
    availableColumns = []
}: ExportToolbarProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);

    // Email form state
    const [emailTo, setEmailTo] = useState("");
    const [emailSubject, setEmailSubject] = useState(`Relatório: ${fileName}`);
    const [emailBody, setEmailBody] = useState("Olá,\n\nSegue em anexo o relatório solicitado.\n\nAtenciosamente,");

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById(elementIdToExport);
            if (!element) {
                toast.error("Área de exportação não encontrada na página.");
                setIsExporting(false);
                return;
            }

            // Extract the HTML content we want to render
            const htmlContent = element.outerHTML;

            // Extract current page styles to pass along
            const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(s => s.outerHTML)
                .join('\n');

            // Build a full HTML document preserving styles and Tailwind
            const fullHtml = `
                <!DOCTYPE html>
                <html class="dark">
                <head>
                    <meta charset="utf-8">
                    <base href="${window.location.origin}">
                    <style>
                        /* Forçamos fundo escuro e textos legíveis similar à tela */
                        body { background-color: #09090b !important; color: #fafafa !important; }
                        
                        /* Ajustes vitais para impressão e PDF */
                        @media print {
                            body, html { overflow: visible !important; height: auto !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            * { box-shadow: none !important; }
                            
                            /* Evita que contêineres Flex globais empurrem a tabela para a segunda página */
                            body > div, .min-h-screen, .h-screen, .h-full { height: auto !important; min-height: auto !important; display: block !important; padding: 0 !important; margin: 0 !important; }
                            
                            /* Remove espaçamentos extras de tela no PDF (gaps, paddings) */
                            .p-6, .gap-6, .py-6, .my-6, .mt-6, .mb-6 { padding: 0 !important; margin: 0 !important; gap: 4px !important; }
                            
                            /* Compactar os cartões de resumo para caberem no topo sem pular página */
                            .grid { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; gap: 8px !important; margin-bottom: 10px !important; page-break-inside: avoid !important; }
                            .grid > div { flex: 1 1 auto !important; min-width: 0 !important; padding: 10px !important; }
                            .grid h3, .grid p { margin: 0 !important; }
                            
                            /* Ajustes na Tabela */
                            table { page-break-inside: auto !important; width: 100% !important; border-collapse: collapse !important; max-width: none !important; }
                            tr { page-break-inside: avoid !important; page-break-after: auto !important; }
                            td, th { page-break-inside: avoid !important; padding: 4px 2px !important; }
                            thead { display: table-header-group !important; }
                            tfoot { display: table-footer-group !important; }
                            
                            /* Remove espaços em branco indesejados no fim/inicio */
                            .overflow-x-auto, .overflow-y-auto, .overflow-hidden { overflow: visible !important; width: auto !important; }
                            
                            /* Força o conteúdo a começar imediatamente no topo */
                            #finance-report-data { margin-top: 0 !important; padding-top: 0 !important; }
                        }
                    </style>
                    ${styles}
                </head>
                <body class="bg-background text-foreground">
                    <div style="width: 100%; display: block; padding: 0;">
                        ${htmlContent}
                    </div>
                </body>
                </html>
            `;

            const response = await fetch('/api/export-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: fullHtml, fileName })
            });

            if (!response.ok) {
                throw new Error("Falha ao gerar o PDF no servidor");
            }

            // Trigger file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Relatório gerado e baixado com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar PDF: " + (err instanceof Error ? err.message : String(err)));
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
        const element = document.getElementById(elementIdToExport);
        if (!element) {
            toast.error("Erro ao localizar o relatório para anexo.");
            setIsExporting(false);
            return;
        }

        try {
            const htmlContent = element.outerHTML;
            const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(s => s.outerHTML)
                .join('\n');

            const fullHtml = `
                <!DOCTYPE html>
                <html class="dark">
                <head>
                    <meta charset="utf-8">
                    <base href="${window.location.origin}">
                    <style>
                        /* Forçamos fundo escuro e textos legíveis similar à tela */
                        body { background-color: #09090b !important; color: #fafafa !important; }
                        
                        /* Ajustes vitais para impressão e PDF */
                        @media print {
                            body, html { overflow: visible !important; height: auto !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            * { box-shadow: none !important; }
                            
                            /* Evita que contêineres Flex globais empurrem a tabela para a segunda página */
                            body > div, .min-h-screen, .h-screen, .h-full { height: auto !important; min-height: auto !important; display: block !important; padding: 0 !important; margin: 0 !important; }
                            
                            /* Remove espaçamentos extras de tela no PDF (gaps, paddings) */
                            .p-6, .gap-6, .py-6, .my-6, .mt-6, .mb-6 { padding: 0 !important; margin: 0 !important; gap: 4px !important; }
                            
                            /* Compactar os cartões de resumo para caberem no topo sem pular página */
                            .grid { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; gap: 8px !important; margin-bottom: 10px !important; page-break-inside: avoid !important; }
                            .grid > div { flex: 1 1 auto !important; min-width: 0 !important; padding: 10px !important; }
                            .grid h3, .grid p { margin: 0 !important; }
                            
                            /* Ajustes na Tabela */
                            table { page-break-inside: auto !important; width: 100% !important; border-collapse: collapse !important; max-width: none !important; }
                            tr { page-break-inside: avoid !important; page-break-after: auto !important; }
                            td, th { page-break-inside: avoid !important; padding: 4px 2px !important; }
                            thead { display: table-header-group !important; }
                            tfoot { display: table-footer-group !important; }
                            
                            /* Remove espaços em branco indesejados no fim/inicio */
                            .overflow-x-auto, .overflow-y-auto, .overflow-hidden { overflow: visible !important; width: auto !important; }
                            
                            /* Força o conteúdo a começar imediatamente no topo */
                            #finance-report-data { margin-top: 0 !important; padding-top: 0 !important; }
                        }
                    </style>
                    ${styles}
                </head>
                <body class="bg-background text-foreground">
                    <div style="width: 100%; display: block; padding: 0;">
                        ${htmlContent}
                    </div>
                </body>
                </html>
            `;

            // Step 1: Generate PDF Buffer via our API
            const pdfResponse = await fetch('/api/export-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: fullHtml, fileName })
            });

            if (!pdfResponse.ok) {
                throw new Error("Falha ao preparar o arquivo PDF para o e-mail");
            }

            // Converter para Base64 para anexar no email
            const blob = await pdfResponse.blob();
            const pdfBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    resolve(reader.result as string); // Returns "data:application/pdf;base64,....."
                };
                reader.onerror = reject;
            });

            const fileNameWithExt = `${fileName}_${new Date().toISOString().split('T')[0]}.pdf`;

            const result = await sendReportEmail({
                to: emailTo,
                subject: emailSubject,
                body: emailBody,
                attachmentBase64: pdfBase64,
                fileName: fileNameWithExt
            });

            if (result.success) {
                setEmailOpen(false);
                toast.success(`E-mail enviado com sucesso para ${emailTo}!`);
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
        <div className="flex flex-wrap items-center gap-2 p-2 bg-card/40 border border-border/50 rounded-md backdrop-blur shadow-sm">
            <Button
                variant="default"
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                onClick={handleExportPDF}
                disabled={isExporting}
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Salvar PDF
            </Button>

            {/* MODAL EMAIL */}
            <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:bg-primary/10">
                        <Mail className="w-4 h-4 text-primary" />
                        Enviar Agora
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-card border-border/50 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle>Enviar Relatório por E-mail</DialogTitle>
                        <DialogDescription>
                            O PDF atual da página será anexado automaticamente a este e-mail.
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
                className="gap-2 border-chart-1/30 hover:bg-chart-1/10 group"
                onClick={() => setScheduleOpen(true)}
            >
                <CalendarClock className="w-4 h-4 text-chart-1 group-hover:animate-pulse" />
                Agendar Envios
            </Button>

            <ScheduleModal
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                availableColumns={availableColumns}
                defaultColumns={selectedColumns || []}
                dataset={dataset}
                filtros={filtros}
                reportName={fileName}
            />
        </div>
    );
}
