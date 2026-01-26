const https = require('https');

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyBFXbTWotvyYK82lCJBTn-QpxujLQGfmmM";

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
