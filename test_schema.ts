import { config } from 'dotenv';
config();
import oracledb from 'oracledb';
import fs from 'fs';

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

    const result = await connection.execute(
        `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = 'AGE_FATURAMENTO' ORDER BY COLUMN_NAME`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    fs.writeFileSync('schema_faturamento.json', JSON.stringify(result.rows, null, 2));
    console.log("Written to schema_faturamento.json");

    await connection.close();
}
test();
