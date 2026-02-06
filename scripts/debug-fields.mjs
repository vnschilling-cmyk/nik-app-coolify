import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
dotenv.config();

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function debug() {
    try {
        console.log("Authentifiziere...");
        await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

        console.log("Hole alle Illustrationen...");
        const records = await pb.collection('facts').getFullList({
            filter: 'fact_kind = "illustration"'
        });

        if (records.length > 0) {
            console.log(`Gefunden: ${records.length} Illustrationen`);
            console.log("Erster Eintrag Felder:", Object.keys(records[0]));
            console.log("Erster Eintrag Daten:", JSON.stringify(records[0], null, 2));
        } else {
            console.log("Keine Illustrationen gefunden.");
        }
    } catch (error) {
        console.error("Fehler:", error);
    }
}

debug();
