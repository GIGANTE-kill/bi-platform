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

    console.log("Connected to Oracle.");
    const dateQuery = "SELECT TRUNC(SYSDATE - 1) as YESTERDAY FROM DUAL";
    const resDate = await connection.execute(dateQuery);
    console.log("Yesterday date according to DB:", resDate.rows[0]);

    const abcQuery = "SELECT COUNT(*) AS C FROM POWERBI.SR_CURVA_ABC_90D WHERE DTCARGA >= TRUNC(SYSDATE - 1) AND DTCARGA < TRUNC(SYSDATE)";
    const resAbc = await connection.execute(abcQuery);
    console.log("ABC count for yesterday:", resAbc.rows[0]);

    const fatQuery = "SELECT COUNT(*) AS C FROM POWERBI.AGE_FATURAMENTO WHERE DATA >= TRUNC(SYSDATE - 1) AND DATA < TRUNC(SYSDATE)";
    const resFat = await connection.execute(fatQuery);
    console.log("Fat count for yesterday:", resFat.rows[0]);
    
    // Check what is the LATEST date in AGE_FATURAMENTO
    const maxFatQuery = "SELECT MAX(DATA) AS MAX_DATA FROM POWERBI.AGE_FATURAMENTO";
    const resMaxFat = await connection.execute(maxFatQuery);
    console.log("Max Faturamento DATA:", resMaxFat.rows[0]);
    
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { }
    }
  }
}
run();
