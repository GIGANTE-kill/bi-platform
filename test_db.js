import { fetchBuilderData } from './src/lib/actions/db.js';

async function test() {
    const result = await fetchBuilderData("", "");
    console.log(result.success ? "SUCCESS" : "ERROR", result.error || "");
}

test();
