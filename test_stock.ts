import { config } from 'dotenv';
config();
import oracledb from 'oracledb';

async function test() {
    try {
        if (process.env.ORACLE_CLIENT_DIR) {
            oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_DIR });
        }
    } catch (e) { }

    const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING,
    });

    const query = `SELECT max (C.DTCARGA),
       C.CODPROD,
       C.CODFILIALPAI,
       C.DESCRICAO,
       C.COMPRADOR,
       P.CODFORNEC,
       C.FORNECEDOR,
       C.ABC_CATEGORY,
       SUM(QTESTGER) AS QT , 
       SUM(C.VLVENDA) AS VENDA_90_DIAS,
       SUM(C.LUCROBRUTO) AS LUCRO_90_DIAS,
       SUM(C.VLESTOQUEVENDA) AS ESTOQUE
  FROM POWERBI.SR_CURVA_ABC_90D C, PCPRODUT P
  WHERE C.CODFILIALPAI IN ('3', '6')
  AND
   C.CODPROD = P.CODPROD
   AND P.CODEPTO <> 6
 GROUP BY C.DTCARGA, C.CODPROD, C.DESCRICAO, C.COMPRADOR, P.CODFORNEC, C.CODFILIALPAI, C.ABC_CATEGORY, C.FORNECEDOR
 ORDER BY SUM(C.VLVENDA) DESC
 FETCH FIRST 5 ROWS ONLY`;

    try {
        const result = await connection.execute(query, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error(e);
    }

    await connection.close();
}

test();
