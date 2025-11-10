// this is a deno file.
// read inputs/prompts.xlsx file
// which has 2 columns: Category, Prompt
// there's 8 categories, and each category has 10 prompts
// total 80 prompts
// we need to loop through each prompt and call ollama-js
// and write the Category, Prompt, and responses of both
// llama2 and llama3.2 to outputs/ollama-responses.xlsx file
// each prompt should be ran 5 times in each model
// and saved as LLama3-1, LLama3-2, LLama3-3, LLama3-4, LLama3-5
// LLama2-1, LLama2-2, LLama2-3, LLama2-4, LLama2-5
// here's a usage example:
// ```
// import ollama from 'ollama'
//
// const response = await ollama.chat({
//   model: 'llama3.2',
//   messages: [{ role: 'user', content: 'Why is the sky blue?' }],
// })
// console.log(response.message.content)
// ```

import ollama from 'ollama';
import * as XLSX from 'https://unpkg.com/xlsx@0.18.5/xlsx.mjs';

const workbook = await Deno.readFile('./inputs/prompts.xlsx');

const book = XLSX.read(workbook, { type: 'array' });

const firstSheetName = book.SheetNames[0];

const sheet = book.Sheets[firstSheetName];

const data = XLSX.utils.sheet_to_json(sheet) as {
    Category: string;
    Prompt: string;
}[];

console.log('input first 2 rows are', data.slice(0, 2));

type Response = {
    Category: string;
    Prompt: string;
    Llama3: string[];
    Llama2: string[];
};

const writeResponsesToXlsx = async (responses: Response[]) => {
    console.log('responses to be written are', responses);

    const responsesMapped = responses.map(function (item) {
        return {
            Category: item.Category,
            Prompt: item.Prompt,

            'Llama3-1': item.Llama3[0],
            'Llama3-2': item.Llama3[1],
            'Llama3-3': item.Llama3[2],
            'Llama3-4': item.Llama3[3],
            'Llama3-5': item.Llama3[4],

            'Llama2-1': item.Llama2[0],
            'Llama2-2': item.Llama2[1],
            'Llama2-3': item.Llama2[2],
            'Llama2-4': item.Llama2[3],
            'Llama2-5': item.Llama2[4],
        };
    });

    const xlsxOut = XLSX.utils.json_to_sheet(responsesMapped);

    // mkdir outputs
    await Deno.mkdir('./outputs', { recursive: true });

    const xlsxWritten = await XLSX.write(
        { Sheets: { Sheet1: xlsxOut }, SheetNames: ['Sheet1'] },
        { bookType: 'xlsx', type: 'array' }
    );

    // Convert xlsxWritten to Uint8Array
    const xlsxData = new Uint8Array(xlsxWritten);

    await Deno.writeFile('./outputs/ollama-responses.xlsx', xlsxData);
};

const llama2Name = 'llama2';
const llama3Name = 'llama3.2';
const models = [llama3Name, llama2Name];

const triesForEachPrompt = 5;

const responses: Response[] = [];

let i = 0;

const [from, to] = [0, data.length];

const runForModel = async (model: string) => {
    for (const row of data.slice(from, to)) {
        const currentResponse: Response = {
            Category: row.Category,
            Prompt: row.Prompt,
            Llama3: [],
            Llama2: [],
        };

        console.log(
            `sending ${i++}th prompt:` +
                '\n```\n' +
                row.Prompt +
                '\n```\nto ollama'
        );

        // Then run llama3 for all
        for (let i = 1; i <= triesForEachPrompt; i++) {
            const response = await ollama.chat({
                model: model,
                messages: [{ role: 'user', content: row.Prompt }],
            });
            if (model === llama2Name)
                currentResponse.Llama2.push(response.message.content);
            else {
                currentResponse.Llama3.push(response.message.content);
            }
            // sleep for 1 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        responses.push(currentResponse);

        await writeResponsesToXlsx(responses);
    }
};

for (const model of models) {
    await runForModel(model);
}

// exit
Deno.exit(0);
