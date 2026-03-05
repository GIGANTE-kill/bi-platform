import oracledb from 'oracledb';

async function test() {
    let connection;
    try {
        if (process.env.ORACLE_CLIENT_DIR) {
            oracledb.initOracleClient({ libDir: process.env.ORACLE_CLIENT_DIR });
        }
        connection = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING,
        });
        console.log("Connected!");

        // Original simplified
        let query = `
      SELECT 1 AS TEST 
      FROM DUAL 
      WHERE 1 >= COALESCE(TO_DATE(:startDate, 'YYYY-MM-DD'), 1)
    `;
        const binds = { startDate: null };
        try {
            const res = await connection.execute(query, binds);
            console.log(res.rows);
        } catch (e) {
            console.log("Error running test query bindings:", e);
        }

    } catch (error) {
        console.error("Connection error:", error);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

test();
