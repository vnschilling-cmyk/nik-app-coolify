
import PocketBase from 'pocketbase';

const pbClient = new PocketBase('http://127.0.0.1:8090');

async function testSearch(query) {
    console.log(`Searching for "${query}"...`);
    try {
        const filter = `text ~ "${query}"`;
        console.log(`Filter: ${filter}`);
        const result = await pbClient.collection('verses').getList(1, 10, {
            filter: filter,
        });
        console.log(`Found ${result.totalItems} items.`);
        if (result.items.length > 0) {
            console.log("First match:", result.items[0].text);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testSearch("Glaube");
testSearch("glaube"); // Test case sensitivity
