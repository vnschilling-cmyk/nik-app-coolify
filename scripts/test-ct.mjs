const token = "VbLguIRXGuMAgzAIhe1N84ORF609OIhhHQHv6dTjpgnYVMsBMs4CvBE02xZy78KnNSM2ejKuew378ZSQOszifOCKRZD1IHNGDnPDAlCG9pYev4ceykMbr1iLZZSRk9PJxTXgsBBazUJ1wOKuYxvJLoGrwUIoLfATmHR9bnOfdVgcH1uq6zFQ1K6VvveaWUV89n9H9OCkSMCssR7kJhgzCd8OnJGVwFFbf4KL3yyr1LcJ8fPGnpvEDCNiRtXXYhUg";
const url = "https://cbggruenberg.church.tools/api/groups";

async function test() {
    console.log(`Connecting to ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Login ${token}`,
                'Accept': 'application/json',
            },
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response snippet: ${text.slice(0, 500)}`);

        try {
            const json = JSON.parse(text);
            console.log("JSON Parse: Success");
            console.log("Groups found:", json.data?.length);
        } catch (e) {
            console.log("JSON Parse: Failed");
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

test();
