require('dotenv').config();

// MOCK: simulate the db call environment
async function test() {
    process.env.DB_USER = "ANALISTA01";
    process.env.DB_PASSWORD = "SHDAoisadjOSADI";
    process.env.DB_CONNECT_STRING = "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.119.5.28)(PORT=1521))(ADDRESS=(PROTOCOL=TCP)(HOST=10.119.5.23)(PORT=1521))(ADDRESS=(PROTOCOL=TCP)(HOST=10.119.5.55)(PORT=1521))(LOAD_BALANCE=yes)(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=SROQUEWTPDB)))";

    // For local test we can only run the raw query using oracledb
    const oracledb = require('oracledb');
    let connection;
    try {
        console.log("Connecting...");
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
        });

        console.log("Connected! Running query...");
        const query = `
            SELECT COUNT(*) AS total
              FROM POWERBI.SR_CURVA_ABC_90D C
              JOIN PCPRODUT P ON C.CODPROD = P.CODPROD
             WHERE C.CODFILIALPAI IN ('3', '6')
               AND P.CODEPTO <> 6
        `;
        const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

        console.log("Query Response:", result.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (connection) {
            await connection.close();
            console.log("Connection closed.");
        }
        process.exit(0);
    }
}

test();
