import sql from 'mssql';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbConfig = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER_211 || 'localhost',
    database: process.env.DB_DATABASE_CTRL || 'test',
    options: {
        encrypt: false,
    }
};

const task = async () => {
    const initialDate = new Date();
    let pool: sql.ConnectionPool | undefined;
    try {
        pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        const result = await pool.query(`
            SELECT [ESTILO]
                  ,[DESCRIPCION]
                  ,[COLOR]
                  ,[TALLA]
                  ,[COPA]
                  ,[CALIDAD]
                  ,[DISPONIBLE]
                  ,[RESERVA]
                  ,[FISICO]
            FROM CCVW_INVENMAYV3
        `);

        //construct payload
        const payload = result.recordset.map(item => {
            return {
                style: item.ESTILO,
                size: item.TALLA,
                color: item.COLOR,
                cup: item.COPA,
                available: item.DISPONIBLE,
                reserved: item.RESERVA,
                description: item.DESCRIPCION
            };
        }); 

        //send data to api
        const inventoryResponse = await axios.post(
            'https://carnivaldevelop.ddns.net/stylesInformation/api/inventory',
            { inventory: payload }
        );

        //Construct log msg
        const endDate = new Date();
        const diffInSeconds = (endDate.getTime() - initialDate.getTime()) / 1000;
        let logMsg = `Start time: ${initialDate.toString()}\n`;
        logMsg += `End time: ${endDate.toString()}\n`;
        logMsg += inventoryResponse.status === 200 ? `Inventory updated successfully\n` : `Inventory update failed\n`;
        logMsg += `Total time: ${diffInSeconds} seconds\n`;

        //Update log file in folder ../logs/updateInventory.txt
        const logPath = path.join(__dirname, '..', 'logs', 'updateInventory.txt');
        fs.appendFileSync(logPath, logMsg);
    } catch (err) {
        //Update log file in folder ../logs/updateInventory.txt
        const logPath = path.join(__dirname, '..', 'logs', 'updateInventory.txt');
        fs.appendFileSync(logPath, `Date: ${new Date().toString()} ,Error: ${err}\n`);
    } finally {
        if (pool) {
            pool.close();
        }
    }
}

export default task;
