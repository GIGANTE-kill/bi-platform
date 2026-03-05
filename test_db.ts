import { config } from 'dotenv';
config();

import { fetchBuilderData } from './src/lib/actions/db';

async function test() {
    console.log("Testing with valid dates and NO fornecedor...");
    const res1 = await fetchBuilderData("2024-01-01", "2024-12-31");
    console.log("Result success:", res1.success);
    if (res1.vendas && res1.vendas.length > 0) {
        console.log("First row:", JSON.stringify(res1.vendas[0], null, 2));
    }

    console.log("\nTesting with fornecedor filter (e.g., '10')...");
    const res2 = await fetchBuilderData("2024-01-01", "2024-12-31", "10");
    console.log("Result success:", res2.success);
    if (res2.vendas && res2.vendas.length > 0) {
        console.log("Rows found with fornecedor '10':", res2.vendas.length);
        console.log("Sample row:", JSON.stringify(res2.vendas[0], null, 2));
    }
}

test();
