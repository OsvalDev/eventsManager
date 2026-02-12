import sql from 'mssql';
import axios from 'axios';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';

const dbConfig = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER_211 || 'localhost',
    database: process.env.DB_DATABASE_CTRL || 'test',
    options: {
        encrypt: false,
    }
};

type Size = {
    style: string;
    size: string;
    cup: string;
};

type Color = {
    style: string;
    color: string;
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

        console.log(result.recordset);

        //send data to api
        // const sizesResponse = await axios.post(
        //     'http://localhost:3000/api/sizes',
        //     { sizes: dataForSizes }
        // );
        // const colorsResponse = await axios.post(
        //     'http://localhost:3000/api/colors',
        //     { colors: dataForColors }
        // );

        //Construct log msg
        // const endDate = new Date();
        // const diffInSeconds = (endDate.getTime() - initialDate.getTime()) / 1000;
        // let logMsg = `Start time: ${initialDate.toString()}\n`;
        // logMsg += `End time: ${endDate.toString()}\n`;
        // logMsg += sizesResponse.status === 200 ? `Sizes updated successfully\n` : `Sizes update failed\n`;
        // logMsg += colorsResponse.status === 200 ? `Colors updated successfully\n` : `Colors update failed\n`;
        // logMsg += `Total time: ${diffInSeconds} seconds\n`;

        //Update log file in folder ../logs/updateDimentions.txt
        // const logPath = path.join(__dirname, '..', 'logs', 'updateDimentions.txt');
        // fs.appendFileSync(logPath, logMsg);
    } catch (err) {
        //Update log file in folder ../logs/updateDimentions.txt
        const logPath = path.join(__dirname, '..', 'logs', 'updateDimentions.txt');
        fs.appendFileSync(logPath, `Date: ${new Date().toString()} ,Error: ${err}\n`);
    } finally {
        if (pool) {
            pool.close();
        }
    }
}

export default task;
