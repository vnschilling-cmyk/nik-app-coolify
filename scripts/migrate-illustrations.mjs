import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
dotenv.config();

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function migrate() {
    try {
        console.log("Authentifiziere...");
        await pb.collection('_superusers').authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

        console.log("Sammle Illustrationen von 'Eigene'...");

        const records = await pb.collection('facts').getFullList({
            filter: 'category = "Eigene" && fact_kind = "illustration"',
        });

        console.log(`${records.length} Einträge gefunden. Starte Update...`);

        for (const record of records) {
            let content = record.description || "";

            // Add formatting tags if not present
            if (!content.includes('[justify]')) {
                content = `[justify][hyphen]\n${content}`;
            }

            await pb.collection('facts').update(record.id, {
                source: "Alexander Ryshov",
                category: "Andere",
                description: content
            });
            console.log(`Updated: ${record.title}`);
        }

        console.log("Migration erfolgreich abgeschlossen!");
    } catch (error) {
        console.error("Fehler bei der Migration:");
        if (error.data) console.error(JSON.stringify(error.data, null, 2));
        else console.error(error);
    }
}

migrate();
