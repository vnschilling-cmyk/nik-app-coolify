// Script to create the 'notes' collection in PocketBase
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://nik-pocketbase.vnschilling.de');
await pb.admins.authWithPassword('admin@vnschilling.de', 'Trex6550!');

const notesSchema = {
    name: 'notes',
    type: 'base',
    schema: [
        {
            name: 'content',
            type: 'text',
            required: true,
            options: {}
        },
        {
            name: 'lesson_id',
            type: 'relation',
            required: true,
            options: {
                collectionId: 'lessons',
                maxSelect: 1,
                cascadeDelete: false
            }
        },
        {
            name: 'user_id',
            type: 'text',
            required: false,
            options: {}
        },
        {
            name: 'verse_start',
            type: 'number',
            required: false,
            options: { min: 0, max: 200 }
        },
        {
            name: 'verse_end',
            type: 'number',
            required: false,
            options: { min: 0, max: 200 }
        },
        {
            name: 'is_private',
            type: 'bool',
            required: false,
            options: {}
        }
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: ''
};

async function createNotesCollection() {
    try {
        // Check if collection exists
        const collections = await pb.collections.getFullList();
        const exists = collections.find(c => c.name === 'notes');

        if (exists) {
            console.log('Notes collection already exists, updating...');
            await pb.collections.update(exists.id, notesSchema);
            console.log('Updated notes collection');
        } else {
            await pb.collections.create(notesSchema);
            console.log('Created notes collection');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

createNotesCollection();
