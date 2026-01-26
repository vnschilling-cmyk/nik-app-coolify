import fetch from 'node-fetch';

const token = "VbLguIRXGuMAgzAIhe1N84ORF609OIhhHQHv6dTjpgnYVMsBMs4CvBE02xZy78KnNSM2ejKuew378ZSQOszifOCKRZD1IHNGDnPDAlCG9pYev4ceykMbr1iLZZSRk9PJxTXgsBBazUJ1wOKuYxvJLoGrwUIoLfATmHR9bnOfdVgcH1uq6zFQ1K6VvveaWUV89n9H9OCkSMCssR7kJhgzCd8OnJGVwFFbf4KL3yyr1LcJ8fPGnpvEDCNiRtXXYhUg";
const baseUrl = "https://cbggruenberg.church.tools/api";

async function run() {
    try {
        console.log("Checking token identity...");
        const res0 = await fetch(`${baseUrl}/whoami`, {
            headers: { 'Authorization': `Login ${token}`, 'Accept': 'application/json' }
        });
        const me = await res0.json();
        console.log(`Loggend in as: ${me.data?.firstName} ${me.data?.lastName} (ID: ${me.data?.id})`);

        console.log("\nFetching groups (with limit=100)...");
        const res = await fetch(`${baseUrl}/groups?limit=100`, {
            headers: { 'Authorization': `Login ${token}`, 'Accept': 'application/json' }
        });
        const data = await res.json();
        const groups = data.data || [];
        console.log(`Total groups returned: ${groups.length}`);
        groups.forEach(g => console.log(` - [${g.id}] ${g.name}`));

        console.log("\nFetching group types...");
        const res2 = await fetch(`${baseUrl}/grouptypes`, {
            headers: { 'Authorization': `Login ${token}`, 'Accept': 'application/json' }
        });
        const data2 = await res2.json();
        const types = data2.data || [];
        console.log(`Total group types: ${types.length}`);
        types.forEach(t => console.log(` - [${t.id}] ${t.name}`));

    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
