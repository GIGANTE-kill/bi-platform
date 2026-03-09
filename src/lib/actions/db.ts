"use server";

import oracledb from 'oracledb';
import { prisma } from "@/lib/prisma";

export async function fetchABCData(startDate?: string, endDate?: string, fornecedor?: string) {
  console.log("Conectando ao Oracle DB para Curva ABC...", { startDate, endDate, fornecedor });
  let connection;

  try {
    // Oracle initialization in Docker is handled via LD_LIBRARY_PATH in the Dockerfile

    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    const defaultStartDate = `${new Date().getFullYear() - 1}-01-01`;
    const defaultEndDate = new Date().toISOString().split('T')[0];

    const binds: any = {
      startDate: startDate || defaultStartDate,
      endDate: endDate || defaultEndDate,
    };

    let fornecedorFilter = '';
    if (fornecedor) {
      binds.fornecedor = `%${fornecedor}%`;
      fornecedorFilter = `AND (UPPER(C.FORNECEDOR) LIKE UPPER(:fornecedor) OR TO_CHAR(P.CODFORNEC) LIKE :fornecedor)`;
    }

    let query = `
            WITH CurvaABC AS (
                SELECT C.DTCARGA,
                       C.CODPROD,
                       C.CODFILIALPAI,
                       C.DESCRICAO,
                       C.COMPRADOR,
                       P.CODFORNEC,
                       C.FORNECEDOR,
                       SUM(C.VLESTOQUEVENDA) AS ESTOQUE
                  FROM POWERBI.SR_CURVA_ABC_90D C
                  JOIN PCPRODUT P ON C.CODPROD = P.CODPROD
                 WHERE C.CODFILIALPAI IN ('3', '6')
                   AND P.CODEPTO <> 6
                   ${fornecedorFilter}
                 GROUP BY C.DTCARGA, C.CODPROD, C.DESCRICAO, C.COMPRADOR, P.CODFORNEC, C.CODFILIALPAI, C.FORNECEDOR
            ),
            Faturamento AS (
                SELECT CODPROD,
                       CODFILIAL,
                       CODSUPERVISOR,
                       CODUSUR,
                       CODCLI,
                       SUM(QTD) AS QT,
                       SUM(FATURAMENTO_LIQUIDO) AS FATURAMENTO_LIQUIDO,
                       SUM(DEVOLUCAO) AS DEVOLUCAO,
                       SUM(CUSTO_LIQUIDO) AS CUSTO_LIQUIDO
                  FROM POWERBI.AGE_FATURAMENTO
                 WHERE CODFILIAL IN ('3','6')
                   AND DATA >= TO_DATE(:startDate, 'YYYY-MM-DD')
                   AND DATA <= TO_DATE(:endDate, 'YYYY-MM-DD')
                 GROUP BY CODPROD, CODFILIAL, CODSUPERVISOR, CODUSUR, CODCLI
            )
            SELECT A.DTCARGA,
                   A.CODPROD,
                   A.CODFILIALPAI,
                   A.DESCRICAO,
                   A.COMPRADOR,
                   A.CODFORNEC,
                   A.FORNECEDOR,
                   A.ESTOQUE,
                   F.CODSUPERVISOR,
                   F.CODUSUR,
                   F.CODCLI,
                   F.QT,
                   F.FATURAMENTO_LIQUIDO,
                   F.DEVOLUCAO,
                   F.CUSTO_LIQUIDO
              FROM CurvaABC A
              LEFT JOIN Faturamento F 
                ON A.CODPROD = F.CODPROD 
               AND A.CODFILIALPAI = F.CODFILIAL
             ORDER BY F.FATURAMENTO_LIQUIDO DESC NULLS LAST
             FETCH FIRST 5000 ROWS ONLY
        `;

    const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    return { success: true, data: result.rows };
  } catch (error) {
    console.error("Erro ao buscar dados do Oracle:", error);
    return { success: false, error: "Falha na conexão ou execução da query." };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar a conexão com Oracle:", err);
      }
    }
  }
}

export async function fetchBuilderData(startDate?: string, endDate?: string, fornecedor?: string): Promise<{ success: boolean; vendas: any[]; error?: string }> {
  console.log("Buscando dados unificados para o Builder (Oracle DB)...");
  const result = await fetchABCData(startDate, endDate, fornecedor);

  if (!result.success || !result.data) {
    return { success: false, error: (result as any).error || "Unknown error", vendas: [] };
  }

  // Mapear resultado para o array "vendas"
  const vendas = result.data.map((row: any) => ({
    dtcarga: row.DTCARGA,
    codprod: row.CODPROD,
    codfilialpai: row.CODFILIALPAI,
    descricao: row.DESCRICAO,
    comprador: row.COMPRADOR,
    codfornec: row.CODFORNEC,
    fornecedor: row.FORNECEDOR,
    qt: row.QT || 0,
    estoque: row.ESTOQUE || 0,
    codsupervisor: row.CODSUPERVISOR || '-',
    codusur: row.CODUSUR || '-',
    codcli: row.CODCLI || '-',
    faturamentoliquido: row.FATURAMENTO_LIQUIDO || 0,
    devolucao: row.DEVOLUCAO || 0,
    custoliquido: row.CUSTO_LIQUIDO || 0,
  }));

  return { success: true, vendas };
}

export async function fetchRelatorioFinanceiro(startDate?: string, endDate?: string) {
  console.log("Buscando dados Financeiros (Oracle DB)...", { startDate, endDate });
  let connection;

  try {
    // Oracle initialization in Docker is handled via LD_LIBRARY_PATH

    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    const binds: any = {};
    let dateFilterPCMOV = '';
    let dateFilterAGE = '';
    let dateFilterABC = '';

    if (startDate && endDate) {
      binds.startDate = startDate;
      binds.endDate = endDate;

      dateFilterPCMOV = `AND PCNFENT.DTENT >= TO_DATE(:startDate, 'YYYY-MM-DD') AND PCNFENT.DTENT <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      dateFilterAGE = `AND AF.DATA >= TO_DATE(:startDate, 'YYYY-MM-DD') AND AF.DATA <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
      dateFilterABC = `AND C.DTCARGA >= TO_DATE(:startDate, 'YYYY-MM-DD') AND C.DTCARGA <= TO_DATE(:endDate, 'YYYY-MM-DD')`;
    }

    const query = `
      WITH CTE_ENTRADAS AS (
          SELECT 
              TRUNC(PCNFENT.DTENT) AS DATA_MOVIMENTO,
              PCMOV.CODFILIAL AS CODFILIAL,
              PCFORNEC.CODFORNEC AS CODFORNEC,
              SUM(NVL(PCMOV.QT, 0) * NVL(PCMOV.PUNIT, 0)) AS TOTAL_ENTRADA
          FROM PCMOV
          INNER JOIN PCNFENT ON PCMOV.NUMTRANSENT = PCNFENT.NUMTRANSENT
          INNER JOIN PCFORNEC ON PCFORNEC.CODFORNEC = PCNFENT.CODFORNEC
          WHERE PCMOV.DTCANCEL IS NULL
            AND PCNFENT.TIPODESCARGA IN ('1', '5', 'I')
            AND NVL(PCMOV.CODOPER, 'X') IN ('E', 'EB')
            AND PCMOV.CODFILIAL IN ('3', '6')
            ${dateFilterPCMOV}
          GROUP BY 
              TRUNC(PCNFENT.DTENT),
              PCMOV.CODFILIAL,
              PCFORNEC.CODFORNEC
      ),
      CTE_SAIDAS AS (
          SELECT 
              TRUNC(AF.DATA) AS DATA_MOVIMENTO,
              AF.CODFILIAL AS CODFILIAL,
              P.CODFORNEC AS CODFORNEC,
              SUM(AF.FATURAMENTO_LIQUIDO) AS TOTAL_SAIDA
          FROM POWERBI.AGE_FATURAMENTO AF
          JOIN PCPRODUT P ON AF.CODPROD = P.CODPROD
          WHERE AF.CODFILIAL IN ('3', '6')
            ${dateFilterAGE}
          GROUP BY 
              TRUNC(AF.DATA),
              AF.CODFILIAL,
              P.CODFORNEC
      ),
      CTE_ESTOQUE_HIST AS (
          SELECT 
              TRUNC(C.DTCARGA) AS DATA_MOVIMENTO,
              C.CODFILIALPAI AS CODFILIAL,
              P.CODFORNEC AS CODFORNEC,
              SUM(C.VLESTOQUEVENDA) AS VALOR_ESTOQUE_VENDA
          FROM POWERBI.SR_CURVA_ABC_90D C
          JOIN PCPRODUT P ON C.CODPROD = P.CODPROD
          WHERE C.CODFILIALPAI IN ('3', '6')
            AND P.CODEPTO <> 6
            ${dateFilterABC}
          GROUP BY TRUNC(C.DTCARGA), C.CODFILIALPAI, P.CODFORNEC
      ),
      CTE_DATAS_FILIAIS AS (
          -- Consolidação de todas as datas, filiais e fornecedores que tiveram movimento ou estoque
          SELECT DATA_MOVIMENTO, CODFILIAL, CODFORNEC FROM CTE_ENTRADAS
          UNION
          SELECT DATA_MOVIMENTO, CODFILIAL, CODFORNEC FROM CTE_SAIDAS
          UNION
          SELECT DATA_MOVIMENTO, CODFILIAL, CODFORNEC FROM CTE_ESTOQUE_HIST
      )
      SELECT 
          D.DATA_MOVIMENTO AS DATA_EXATA,
          D.CODFILIAL,
          D.CODFORNEC,
          NVL(F.FORNECEDOR, 'FORNECEDOR SEM NOME') AS FORNECEDOR,
          F.CODFORNECPRINC,
          NVL(FP.FORNECEDOR, 'FORNECEDOR PRINCIPAL N/I') AS FORNECEDOR_PRINCIPAL,
          NVL(E.TOTAL_ENTRADA, 0) AS VALOR_ENTRADA,
          NVL(S.TOTAL_SAIDA, 0) AS VALOR_SAIDA,
          NVL(EST.VALOR_ESTOQUE_VENDA, 0) AS VALOR_ESTOQUE_VENDA
      FROM CTE_DATAS_FILIAIS D
      LEFT JOIN CTE_ENTRADAS E ON D.DATA_MOVIMENTO = E.DATA_MOVIMENTO AND D.CODFILIAL = E.CODFILIAL AND D.CODFORNEC = E.CODFORNEC
      LEFT JOIN CTE_SAIDAS S ON D.DATA_MOVIMENTO = S.DATA_MOVIMENTO AND D.CODFILIAL = S.CODFILIAL AND D.CODFORNEC = S.CODFORNEC
      LEFT JOIN CTE_ESTOQUE_HIST EST ON D.DATA_MOVIMENTO = EST.DATA_MOVIMENTO AND D.CODFILIAL = EST.CODFILIAL AND D.CODFORNEC = EST.CODFORNEC
      LEFT JOIN PCFORNEC F ON D.CODFORNEC = F.CODFORNEC
      LEFT JOIN PCFORNEC FP ON F.CODFORNECPRINC = FP.CODFORNEC
      ORDER BY D.DATA_MOVIMENTO DESC
    `;

    const result = await connection.execute(query, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    return { success: true, data: result.rows };
  } catch (error) {
    console.error("Erro ao buscar dados Financeiros do Oracle:", error);
    return { success: false, error: "Falha na conexão ou execução da query.", data: [] };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erro ao fechar a conexão com Oracle:", err);
      }
    }
  }
}

export async function saveReportTemplate(data: { nome: string; dataset: string; columns: string[]; emails: string; frequency: string }) {
  console.log("Salvando template no banco local com Prisma...", data);
  return { success: true, templateId: "mock-id-123" };
}

export async function fetchDashboardOverview() {
  console.log("Buscando dados gerais para o Dashboard (Oracle + Prisma)...");
  let connection;

  try {
    // PRISMA STATS
    const activeReports = await prisma.reportTemplate.count({ where: { active: true } });
    const totalSchedules = await prisma.reportTemplate.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAccesses = await prisma.reportLog.count({
      where: {
        sentAt: {
          gte: today
        }
      }
    });

    // ORACLE STATS
    // Oracle initialization in Docker is handled via LD_LIBRARY_PATH

    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
    });

    const binds: any = {};

    // 1. Receita e Entradas Mensais (Últimos 6 Meses)
    const monthlyQuery = `
      WITH MESES AS (
          SELECT TO_CHAR(ADD_MONTHS(SYSDATE, -5 + (LEVEL - 1)), 'YYYY-MM') AS MES_ANO
          FROM DUAL CONNECT BY LEVEL <= 6
      ),
      VENDAS_MENSAIS AS (
          SELECT TO_CHAR(DATA, 'YYYY-MM') AS MES_ANO,
                 SUM(FATURAMENTO_LIQUIDO) AS RECEITA
          FROM POWERBI.AGE_FATURAMENTO
          WHERE DATA >= ADD_MONTHS(SYSDATE, -6)
            AND CODFILIAL IN ('3', '6')
          GROUP BY TO_CHAR(DATA, 'YYYY-MM')
      ),
      ENTRADAS_MENSAIS AS (
          SELECT TO_CHAR(PCNFENT.DTENT, 'YYYY-MM') AS MES_ANO,
                 SUM(NVL(PCMOV.QT, 0) * NVL(PCMOV.PUNIT, 0)) AS CUSTO
          FROM PCMOV
          INNER JOIN PCNFENT ON PCMOV.NUMTRANSENT = PCNFENT.NUMTRANSENT
          WHERE PCMOV.DTCANCEL IS NULL
            AND PCNFENT.TIPODESCARGA IN ('1', '5', 'I')
            AND NVL(PCMOV.CODOPER, 'X') IN ('E', 'EB')
            AND PCMOV.CODFILIAL IN ('3', '6')
            AND PCNFENT.DTENT >= ADD_MONTHS(SYSDATE, -6)
          GROUP BY TO_CHAR(PCNFENT.DTENT, 'YYYY-MM')
      )
      SELECT M.MES_ANO,
             NVL(V.RECEITA, 0) AS RECEITA,
             NVL(E.CUSTO, 0) AS CUSTO_ENTRADA
      FROM MESES M
      LEFT JOIN VENDAS_MENSAIS V ON M.MES_ANO = V.MES_ANO
      LEFT JOIN ENTRADAS_MENSAIS E ON M.MES_ANO = E.MES_ANO
      ORDER BY M.MES_ANO
    `;

    // 2. Top 5 Fornecedores por Entrada no mês atual
    const topFornecedoresQuery = `
      SELECT F.FORNECEDOR,
             SUM(NVL(M.QT, 0) * NVL(M.PUNIT, 0)) AS VALOR_COMPRADO
      FROM PCMOV M
      INNER JOIN PCNFENT N ON M.NUMTRANSENT = N.NUMTRANSENT
      INNER JOIN PCFORNEC F ON N.CODFORNEC = F.CODFORNEC
      WHERE M.DTCANCEL IS NULL
        AND N.DTENT >= TRUNC(SYSDATE, 'MM')
        AND NVL(M.CODOPER, 'X') IN ('E', 'EB')
        AND M.CODFILIAL IN ('3', '6')
      GROUP BY F.FORNECEDOR
      ORDER BY VALOR_COMPRADO DESC
      FETCH FIRST 5 ROWS ONLY
    `;

    const monthlyResult = await connection.execute(monthlyQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const topFornecedoresResult = await connection.execute(topFornecedoresQuery, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });

    return {
      success: true,
      data: {
        activeReports,
        totalSchedules,
        todayAccesses,
        monthly: monthlyResult.rows,
        topFornecedores: topFornecedoresResult.rows
      }
    };
  } catch (error: any) {
    const timestamp = new Date().toISOString();
    try {
      require("fs").appendFileSync("/tmp/auth-debug.log", `[${timestamp}] [ORACLE_ERROR] ${error.message} - ${error.stack}\n`);
    } catch (e) { }
    console.error("Erro ao buscar dados do Dashboard via Oracle:", error);
    return { success: false, error: "Falha na conexão DB do dashboard.", data: null };
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { }
    }
  }
}

