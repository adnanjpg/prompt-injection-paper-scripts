import * as XLSX from 'https://unpkg.com/xlsx@0.18.5/xlsx.mjs';
import { EvaluationResult } from './main.ts';

async function convertJsonToXlsx(jsonFilePath: string, xlsxFilePath: string) {
    // Read the JSON file
    const normalData = await Deno.readTextFile(jsonFilePath);
    const jsonData = JSON.parse(normalData) as EvaluationResult[];

    const data = jsonData.map((result) => {
        return {
            ...result,
            sbs: Number.parseInt(result.sbs.score.toString()),
            dme: Number.parseInt(result.dme.score.toString()),
            rcr: Number.parseInt(result.rcr!.score.toString()),
        };
    });

    // Write the data to an XLSX file
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, xlsxFilePath, {
        bookType: 'xlsx',
        bookSST: false,
    });
}

// Define the file paths
const jsonFilePath = './security_evaluation_results.json';
const xlsxFilePath = './security_evaluation_results.xlsx';

// Convert JSON to XLSX
convertJsonToXlsx(jsonFilePath, xlsxFilePath)
    .then(() => console.log('Conversion complete!'))
    .catch((error) => console.error('Error during conversion:', error));
