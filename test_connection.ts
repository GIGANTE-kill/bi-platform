import { config } from 'dotenv';
config();
import oracledb from 'oracledb';

async function testConnection() {
    console.log("Variáveis de ambiente:");
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_CONNECT_STRING:", process.env.DB_CONNECT_STRING);
    console.log("Tentando conectar...");

    try {
        const connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
        });
        console.log("Conectado com sucesso!");
        await connection.close();
    } catch (error) {
        console.error("Erro ao conectar:", error);
    }
}

testConnection();
