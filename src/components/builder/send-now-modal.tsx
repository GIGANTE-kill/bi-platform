"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface SendNowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSend: (emails: string) => void;
}

export function SendNowModal({ open, onOpenChange, onSend }: SendNowModalProps) {
    const [emails, setEmails] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!emails.trim()) {
            toast.error("Por favor, insira pelo menos um e-mail.");
            return;
        }

        setIsSending(true);

        try {
            // Simulando o tempo de envio e processamento do anexo
            await new Promise((resolve) => setTimeout(resolve, 1500));
            onSend(emails);
            toast.success("Relatório Enviado com Sucesso!", {
                description: `O arquivo PDF foi encaminhado para: ${emails}`,
            });
            onOpenChange(false);
            setEmails(""); // Limpa para a próxima vez
        } catch (error) {
            toast.error("Erro ao enviar o relatório.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/50 glow">
                <DialogHeader>
                    <DialogTitle className="text-primary text-xl flex items-center gap-2">
                        <Send className="h-5 w-5" /> Enviar Agora
                    </DialogTitle>
                    <DialogDescription>
                        O relatório atual será gerado em PDF e enviado imediatamente para os destinatários listados abaixo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="emails-send" className="text-sm font-medium">E-mails (separados por vírgula)</label>
                        <Input
                            id="emails-send"
                            placeholder="exemplo@email.com, gerente@email.com"
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                            className="bg-background/50 border-input"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>Cancelar</Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(191,64,255,0.4)] gap-2"
                    >
                        {isSending ? "Enviando..." : "Enviar Relatório"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
