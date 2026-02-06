import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
dotenv.config();

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function debug() {
    try {
        console.log("Authentifiziere...");
        await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

        console.log("Hole erste 5 Einträge...");
        const records = await pb.collection('facts').getList(1, 5);
        console.log("Beispiel-Eintrag:", JSON.stringify(records.items[0], null, 2));

        console.log("Filtere manuell...");
        const all = await pb.collection('facts').getFullList();
        const filtered = all.filter(r => r.author === "Import" && r.fact_kind === "illustration");
        console.log(`${filtered.length} passende Einträge gefunden.`);

        for (const record of filtered) {
            let content = record.description || "";
            if (!content.includes('[justify]')) {
                content = `[justify][hyphen]\n${content}`;
            }

            await pb.collection('facts').update(record.id, {
                author: "Alexander Ryshov",
                category: "Andere",
                description: content
            });
            console.log(`Updated: ${record.title}`);
        }
    } catch (error) {
        console.error("Fehler:", error);
    }
}

debug();
