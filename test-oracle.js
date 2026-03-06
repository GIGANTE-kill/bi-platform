require('dotenv').config({ path: './.env' });
const oracledb = require('oracledb');

async function testOracle() {
    console.log("Variáveis de ambiente:");
    console.log("DB_USER:", process.env.DB_USER);
    console.log("ORACLE_CLIENT_DIR:", process.env.ORACLE_CLIENT_DIR);

    try {
        if (process.env.ORACLE_CLIENT_DIR) {
            oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_DIR });
        }
        const connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
        });
        console.log("Conexão bem-sucedida!");
        await connection.close();
    } catch (err) {
        console.error("Erro Oracle:", err);
    }
}

testOracle();
