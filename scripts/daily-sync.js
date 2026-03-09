/**
 * Script para processamento offline do Dashboard.
 * Deve ser executado pelo container 'cron' ou manualmente via node.
 */
const { fetchDashboardOverview } = require('../src/lib/actions/db');

async function sync() {
    console.log(`[${new Date().toISOString()}] Iniciando sincronização diária do Dashboard...`);
    try {
        const result = await fetchDashboardOverview({ forceRefresh: true });
        if (result.success) {
            console.log(`[${new Date().toISOString()}] Sucesso: Dashboard processado e cache atualizado.`);
        } else {
            console.error(`[${new Date().toISOString()}] Erro no processamento:`, result.error);
        }
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Erro fatal na sincronização:`, err.message);
    } finally {
        process.exit(0);
    }
}

sync();
