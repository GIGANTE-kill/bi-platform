import { config } from 'dotenv';
config();
import oracledb from 'oracledb';

async function runDiagnostics() {
    let connection;
    try {
        console.log("Conectando ao banco de dados...");
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
        });
        console.log("Conectado com sucesso!\n");

        const queries = [
            {
                name: "Contagem de Faturamento (Ultimo Ano)",
                sql: `SELECT COUNT(*) AS total FROM POWERBI.AGE_FATURAMENTO WHERE CODFILIAL IN ('3','6') AND DATA >= TO_DATE('2025-01-01', 'YYYY-MM-DD')`
            },
            {
                name: "Contagem de CurvaABC_90D (Global)",
                sql: `SELECT COUNT(*) AS total FROM POWERBI.SR_CURVA_ABC_90D WHERE CODFILIALPAI IN ('3', '6')`
            },
            {
                name: "Teste Join Limitado (FETCH FIRST 10 ROWS)",
                sql: `
            WITH CurvaABC AS (
                SELECT C.DTCARGA,
                       C.CODPROD,
                       C.CODFILIALPAI,
                       C.DESCRICAO,
                       C.COMPRADOR,
                       P.CODFORNEC,
                       C.FORNECEDOR,
                       C.ABC_CATEGORY,
                       SUM(C.QTESTGER) AS QT, 
                       SUM(C.VLVENDA) AS VENDA_90_DIAS,
                       SUM(C.LUCROBRUTO) AS LUCRO_90_DIAS,
                       SUM(C.VLESTOQUEVENDA) AS ESTOQUE
                  FROM POWERBI.SR_CURVA_ABC_90D C
                  JOIN PCPRODUT P ON C.CODPROD = P.CODPROD
                 WHERE C.CODFILIALPAI IN ('3', '6')
                   AND P.CODEPTO <> 6
                 GROUP BY C.DTCARGA, C.CODPROD, C.DESCRICAO, C.COMPRADOR, P.CODFORNEC, C.CODFILIALPAI, C.ABC_CATEGORY, C.FORNECEDOR
            ),
            Faturamento AS (
                SELECT *
                  FROM POWERBI.AGE_FATURAMENTO
                 WHERE CODFILIAL IN ('3','6')
                   AND DATA >= TO_DATE('2025-01-01', 'YYYY-MM-DD') 
            )
            SELECT A.CODPROD, A.VENDA_90_DIAS
              FROM CurvaABC A
              LEFT JOIN Faturamento F 
                ON A.CODPROD = F.CODPROD 
               AND A.CODFILIALPAI = F.CODFILIAL
             ORDER BY A.VENDA_90_DIAS DESC
             FETCH FIRST 10 ROWS ONLY
        `
            }
        ];

        for (const q of queries) {
            console.log(`Executando: ${q.name}...`);
            const start = Date.now();
            try {
                const result = await connection.execute(q.sql);
                const tempo = Date.now() - start;
                console.log(`[SUCESSO] Tempo: ${tempo}ms`);
                console.log(`Resultado:`, result.rows);
            } catch (err: any) {
                const tempo = Date.now() - start;
                console.error(`[ERRO] Tempo: ${tempo}ms. Detalhes:`, err.message);
            }
            console.log("--------------------------------------------------");
        }

    } catch (error) {
        console.error("Erro fatal de conexão:", error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

runDiagnostics();
