const oracledb = require('oracledb');
require('dotenv').config({ path: '.env' });

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const startDate = '2026-03-10';
    const endDate = '2026-03-10';
    const binds = { startDate, endDate };

    let query = `
            WITH CTE_BASE AS (
                SELECT CODPROD, CODFILIALPAI AS CODFILIAL FROM POWERBI.SR_CURVA_ABC_90D WHERE DTCARGA >= TO_DATE(:startDate, 'YYYY-MM-DD') AND DTCARGA < TO_DATE(:endDate, 'YYYY-MM-DD') + 1
                UNION
                SELECT CODPROD, CODFILIAL FROM POWERBI.AGE_FATURAMENTO WHERE DATA >= TO_DATE(:startDate, 'YYYY-MM-DD') AND DATA < TO_DATE(:endDate, 'YYYY-MM-DD') + 1
            ),
            CurvaABC AS (
                SELECT C.CODPROD,
                       C.CODFILIALPAI,
                       MAX(C.DTCARGA) AS DTCARGA,
                       MAX(C.DESCRICAO) AS DESCRICAO,
                       MAX(C.COMPRADOR) AS COMPRADOR,
                       SUM(C.VLESTOQUEVENDA) AS ESTOQUE
                  FROM POWERBI.SR_CURVA_ABC_90D C
                 WHERE C.CODFILIALPAI IN ('3', '6')
                   AND C.DTCARGA >= TO_DATE(:startDate, 'YYYY-MM-DD')
                   AND C.DTCARGA < TO_DATE(:endDate, 'YYYY-MM-DD') + 1
                 GROUP BY C.CODPROD, C.CODFILIALPAI
            ),
            Faturamento AS (
                SELECT CODPROD,
                       CODFILIAL,
                       MAX(CODSUPERVISOR) AS CODSUPERVISOR,
                       MAX(CODUSUR) AS CODUSUR,
                       MAX(CODCLI) AS CODCLI,
                       SUM(QTD) AS QT,
                       SUM(FATURAMENTO_LIQUIDO) AS FATURAMENTO_LIQUIDO,
                       SUM(DEVOLUCAO) AS DEVOLUCAO,
                       SUM(CUSTO_LIQUIDO) AS CUSTO_LIQUIDO
                  FROM POWERBI.AGE_FATURAMENTO
                 WHERE CODFILIAL IN ('3','6')
                   AND DATA >= TO_DATE(:startDate, 'YYYY-MM-DD')
                   AND DATA < TO_DATE(:endDate, 'YYYY-MM-DD') + 1
                 GROUP BY CODPROD, CODFILIAL
            )
            SELECT COUNT(*) AS total_rows
              FROM CTE_BASE B
              LEFT JOIN CurvaABC A ON B.CODPROD = A.CODPROD AND B.CODFILIAL = A.CODFILIALPAI
              LEFT JOIN Faturamento FAT ON B.CODPROD = FAT.CODPROD AND B.CODFILIAL = FAT.CODFILIAL
              JOIN PCPRODUT P ON B.CODPROD = P.CODPROD
              JOIN PCFORNEC F ON P.CODFORNEC = F.CODFORNEC
             WHERE B.CODFILIAL IN ('3', '6')
               AND P.CODEPTO <> 6
        `;

    const res = await connection.execute(query, binds);
    console.log("Total rows found by query:", res.rows[0]);
    
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { }
    }
  }
}
run();
