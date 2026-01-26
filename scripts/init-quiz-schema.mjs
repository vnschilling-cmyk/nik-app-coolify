import 'dotenv/config';
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090'; // Use local or provided URL
// Use the known good URL
const TARGET_URL = 'https://pocketbase-nik-app-coolify.195.201.231.49.nip.io';

const pb = new PocketBase(TARGET_URL);

async function main() {
    console.log(`Connecting to ${TARGET_URL}...`);
    try {
        await pb.admins.authWithPassword('admin@nik-app.de', '12345678');
        console.log('Logged in.');
    } catch (e) {
        console.error('Authentication failed:', e.message);
        process.exit(1);
    }

    // 1. Create 'quizzes' collection
    try {
        console.log("Checking 'quizzes' collection...");
        try {
            await pb.collections.getOne('quizzes');
            console.log("'quizzes' already exists.");
        } catch (e) {
            console.log("Creating 'quizzes'...");
            await pb.collections.create({
                name: 'quizzes',
                type: 'base',
                schema: [
                    {
                        name: 'lesson_id',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'lessons',
                            cascadeDelete: false,
                            maxSelect: 1,
                            displayFields: []
                        }
                    },
                    {
                        name: 'title',
                        type: 'text',
                        required: true
                    },
                    {
                        name: 'questions',
                        type: 'json',
                        required: true,
                        options: {
                            maxSize: 2000000
                        }
                    }
                ]
            });
            console.log("'quizzes' created.");
        }

        // 2. Create 'quiz_results' collection
        console.log("Checking 'quiz_results' collection...");
        try {
            await pb.collections.getOne('quiz_results');
            console.log("'quiz_results' already exists.");
        } catch (e) {
            console.log("Creating 'quiz_results'...");
            await pb.collections.create({
                name: 'quiz_results',
                type: 'base',
                schema: [
                    {
                        name: 'quiz_id',
                        type: 'relation',
                        required: true,
                        options: {
                            collectionId: 'quizzes',
                            cascadeDelete: true, // If quiz is deleted, results indicate nothing
                            maxSelect: 1,
                            displayFields: []
                        }
                    },
                    {
                        name: 'score',
                        type: 'number',
                        required: true,
                        options: {
                            min: 0,
                            max: 100
                        }
                    },
                    {
                        name: 'max_score',
                        type: 'number',
                        required: true,
                        options: {
                            min: 0,
                            max: 100
                        }
                    },
                    {
                        name: 'user_id', // Optional, if we had auth, but good to have prepared
                        type: 'text',
                        options: {
                            max: 100
                        }
                    }
                ]
            });
            console.log("'quiz_results' created.");
        }

    } catch (e) {
        console.error("Error initializing schema:", e);
        if (e.response) console.log(JSON.stringify(e.response, null, 2));
    }
}

main().catch(console.error);
