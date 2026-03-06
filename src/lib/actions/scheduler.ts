"use server";

import { prisma } from "@/lib/prisma";



export interface ScheduleData {
    nome: string;
    dataset: string;
    filtros?: any; // JSON object with UI filters
    selectedColumns: string[];
    emails: string;
    frequency: string;
}

/**
 * Cria um novo agendamento no banco de dados.
 */
export async function createSchedule(data: ScheduleData) {
    try {
        // Calcula a próxima data de envio baseada na frequência escolhida
        const nextRunAt = calculateNextRun(data.frequency);

        const result = await prisma.reportTemplate.create({
            data: {
                nome: data.nome,
                dataset: data.dataset,
                filtros: data.filtros ? JSON.stringify(data.filtros) : null,
                selectedColumns: JSON.stringify(data.selectedColumns),
                emails: data.emails,
                frequency: data.frequency,
                nextRunAt: nextRunAt,
            },
        });

        return { success: true, scheduleId: result.id };
    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        return { success: false, error: "Falha ao salvar o agendamento no banco de dados." };
    }
}

/**
 * Lista todos os agendamentos ativos.
 */
export async function getSchedules() {
    try {
        const schedules = await prisma.reportTemplate.findMany({
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: schedules };
    } catch (error) {
        console.error("Erro ao listar agendamentos:", error);
        return { success: false, error: "Falha ao carregar agendamentos do banco de dados.", data: [] };
    }
}

/**
 * Deleta um agendamento.
 */
export async function deleteSchedule(id: string) {
    try {
        await prisma.reportTemplate.delete({
            where: { id },
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao deletar agendamento:", error);
        return { success: false, error: "Falha ao excluir o agendamento." };
    }
}

/**
 * Atualiza o status de um agendamento (ativo/inativo).
 */
export async function toggleScheduleStatus(id: string, active: boolean) {
    try {
        await prisma.reportTemplate.update({
            where: { id },
            data: { active },
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { success: false, error: "Falha ao atualizar o agendamento." };
    }
}

/**
 * Usado pelo Cron Job para atualizar o registro após um envio bem-sucedido.
 */
export async function markScheduleAsRun(id: string, frequency: string) {
    try {
        await prisma.reportTemplate.update({
            where: { id },
            data: {
                lastRunAt: new Date(),
                nextRunAt: calculateNextRun(frequency),
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Erro ao registrar envio:", error);
        return { success: false };
    }
}

/**
 * Atualiza um agendamento existente.
 */
export async function updateSchedule(id: string, data: Partial<ScheduleData>) {
    try {
        const updateData: any = {};
        if (data.nome !== undefined) updateData.nome = data.nome;
        if (data.dataset !== undefined) updateData.dataset = data.dataset;
        if (data.filtros !== undefined) updateData.filtros = JSON.stringify(data.filtros);
        if (data.selectedColumns !== undefined) updateData.selectedColumns = JSON.stringify(data.selectedColumns);
        if (data.emails !== undefined) updateData.emails = data.emails;
        if (data.frequency !== undefined) {
            updateData.frequency = data.frequency;
            updateData.nextRunAt = calculateNextRun(data.frequency);
        }

        const result = await prisma.reportTemplate.update({
            where: { id },
            data: updateData,
        });

        return { success: true, scheduleId: result.id };
    } catch (error) {
        console.error("Erro ao atualizar agendamento:", error);
        return { success: false, error: "Falha ao atualizar o agendamento no banco de dados." };
    }
}

/**
 * Helper interno para calcular a próxima execução baseada na frequência
 */
function calculateNextRun(frequency: string): Date {
    const now = new Date();

    // Exemplo simplificado. Num ambiente real, podemos usar bibliotecas como cron-parser
    switch (frequency.toUpperCase()) {
        case "DAILY":
            now.setDate(now.getDate() + 1);
            // Reseta para as 08:00 da manhã do dia seguinte, por exemplo
            now.setHours(8, 0, 0, 0);
            break;
        case "WEEKLY":
            now.setDate(now.getDate() + 7);
            now.setHours(8, 0, 0, 0);
            break;
        case "MONTHLY":
            now.setMonth(now.getMonth() + 1);
            now.setHours(8, 0, 0, 0);
            break;
        default:
            // Se mandar a string literal (ex: "hoje", etc), definimos fallback para daqui 1 hora
            now.setHours(now.getHours() + 1);
    }

    return now;
}
