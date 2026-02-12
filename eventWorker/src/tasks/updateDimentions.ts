import sql from 'mssql';
import axios from 'axios';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';

const dbConfig = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER_211 || 'localhost',
    database: process.env.DB_DATABASE_COL || 'test',
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
            SELECT DISPLAYPRODUCTNUMBER
            FROM ECORESPRODUCT
            WHERE DISPLAYPRODUCTNUMBER LIKE '%ALTA%'
            AND DISPLAYPRODUCTNUMBER NOT LIKE '%# : #%'
            AND (DISPLAYPRODUCTNUMBER NOT LIKE 'q%'
            OR DISPLAYPRODUCTNUMBER NOT LIKE 'w%'
            OR DISPLAYPRODUCTNUMBER NOT LIKE 'z%'
            OR DISPLAYPRODUCTNUMBER NOT LIKE 'Q%'
            OR DISPLAYPRODUCTNUMBER NOT LIKE 'W%'
            OR DISPLAYPRODUCTNUMBER NOT LIKE 'Z%');
        `);
        //value expected follows the next structure: "20038 : C : 32 : 226 : ALTA"
        const cleanData = result.recordset.map(item => {
            const parts = item.DISPLAYPRODUCTNUMBER.split(' : ');
            return {
                style: parts[0],
                cup: parts[1],
                size: parts[2],
                color: parts[3]
            };
        });

        const dataForSizes: Size[] = [];
        const dataForColors: Color[] = [];
        const sizesSet = new Set();
        const colorsSet = new Set();

        cleanData.forEach(item => {
            //size unique key
            const sizeKey = `${item.style}|${item.size}|${item.cup}`;
            if (!sizesSet.has(sizeKey)) {
                sizesSet.add(sizeKey);
                dataForSizes.push({
                    style: item.style,
                    size: item.size,
                    cup: item.cup
                });
            }
            //color unique key
            const colorKey = `${item.style}|${item.color}`;
            if (!colorsSet.has(colorKey)) {
                colorsSet.add(colorKey);
                dataForColors.push({
                    style: item.style,
                    color: /^\d+$/.test(item.color) ? item.color.padStart(3, '0') : item.color
                });
            }
        });

        //send data to api
        const sizesResponse = await axios.post(
            'https://carnivaldevelop.ddns.net/stylesInformation/api/sizes',
            { sizes: dataForSizes }
        );
        const colorsResponse = await axios.post(
            'https://carnivaldevelop.ddns.net/stylesInformation/api/colors',
            { colors: dataForColors }
        );

        //Construct log msg
        const endDate = new Date();
        const diffInSeconds = (endDate.getTime() - initialDate.getTime()) / 1000;
        let logMsg = `Start time: ${initialDate.toString()}\n`;
        logMsg += `End time: ${endDate.toString()}\n`;
        logMsg += sizesResponse.status === 200 ? `Sizes updated successfully\n` : `Sizes update failed\n`;
        logMsg += colorsResponse.status === 200 ? `Colors updated successfully\n` : `Colors update failed\n`;
        logMsg += `Total time: ${diffInSeconds} seconds\n`;

        //Update log file in folder ../logs/updateDimentions.txt
        const logPath = path.join(__dirname, '..', 'logs', 'updateDimentions.txt');
        fs.appendFileSync(logPath, logMsg);
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
