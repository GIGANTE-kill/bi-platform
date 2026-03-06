import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize resilient email client
// If using Nodemailer instead of Resend, you'd configure the transport here.
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback');

export async function GET(request: Request) {
    // 1. Basic Security Validation
    // Ensure only the Docker container (or authorized user) can trigger this
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'my-secure-cron-secret'}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        // 2. Logic to define date scopes based on 'type' (yesterday, month, week, etc)
        let startDate: Date;
        let endDate: Date;
        let subject = '';

        const now = new Date();

        if (type === 'yesterday') {
            // Calculate yesterday
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            startDate = yesterday;

            const yesterdayEnd = new Date(yesterday);
            yesterdayEnd.setHours(23, 59, 59, 999);
            endDate = yesterdayEnd;

            subject = `[Diário] Relatório Financeiro - ${yesterday.toLocaleDateString('pt-BR')}`;

        } else if (type === 'month') {
            // Calculate previous month
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            startDate = prevMonth;
            endDate = prevMonthEnd;

            subject = `[Mensal] Relatório Financeiro - Referência: ${prevMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
        } else {
            return NextResponse.json({ error: 'Invalid or missing ?type parameter' }, { status: 400 });
        }

        // 3. Query the Database for the selected scope
        // NOTE: This assumes a generic structure. Adjust prisma queries to your specific schema.
        /** 
         * Example:
         * const data = await db.transaction.findMany({
         *   where: {
         *     date: { gte: startDate, lte: endDate }
         *   }
         * });
         */

        // For now, simulating the payload
        const dataPayload = {
            period: { start: startDate, end: endDate },
            totalEntradas: 15400.0,
            totalSaidas: 8200.0,
            resume: "Mock de dados para o Cron"
        };

        // 4. Fire the Email!
        // We send realistic HTML here, but you should import your @react-email templates.
        // e.g., import RelatorioTemplate from '@/emails/RelatorioTemplate';
        // react: <RelatorioTemplate data={dataPayload} />

        // For this example using Resend (change to nodemailer if you prefer):
        const emailResult = await resend.emails.send({
            from: 'Relatórios BI <onboarding@resend.dev>', // Your verified domain
            to: ['seu-email@dominio.com'], // The recipient list from your DB or constants
            subject: subject,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <p>O relatório do período já foi processado.</p>
          <ul>
            <li><strong>Início:</strong> ${startDate.toLocaleDateString('pt-BR')}</li>
            <li><strong>Fim:</strong> ${endDate.toLocaleDateString('pt-BR')}</li>
            <li><strong>Entradas:</strong> R$ ${dataPayload.totalEntradas}</li>
            <li><strong>Saídas:</strong> R$ ${dataPayload.totalSaidas}</li>
          </ul>
          <p>Abra o sistema web para mais detalhes e exportação em PDF.</p>
        </div>
      `,
        });

        console.log(`✅ [CRON] Execution successful for type: ${type}`);

        return NextResponse.json({
            success: true,
            message: `Report for ${type} generated and sent`,
            payload: dataPayload,
            emailId: emailResult.data?.id
        });

    } catch (error) {
        console.error(`❌ [CRON] Error executing cron type ${type}:`, error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
