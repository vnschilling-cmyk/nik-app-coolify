import PocketBase from 'pocketbase';

async function main() {
    const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');
    try {
        await pb.admins.authWithPassword('admin@nik-app.de', '12345678');
        console.log("Logged in as admin");

        // 1. Update lessons collection
        const lessonsCol = await pb.collections.getOne('lessons');
        const lessonFields = [...lessonsCol.fields];

        if (!lessonFields.find(f => f.name === 'start_date')) {
            lessonFields.push({ name: 'start_date', type: 'date', required: false });
        }
        if (!lessonFields.find(f => f.name === 'active')) {
            lessonFields.push({ name: 'active', type: 'bool', required: false });
        }

        await pb.collections.update(lessonsCol.id, { fields: lessonFields });
        console.log("✓ lessons schema updated");

        // 2. Create attendance collection
        try {
            await pb.collections.getOne('attendance');
            console.log("attendance collection already exists");
        } catch (e) {
            await pb.collections.create({
                name: 'attendance',
                type: 'base',
                fields: [
                    { name: 'lesson', type: 'relation', options: { maxSelect: 1, collectionId: 'lessons', cascadeDelete: true }, required: true },
                    { name: 'group_member', type: 'relation', options: { maxSelect: 1, collectionId: 'group_members', cascadeDelete: true }, required: true },
                    { name: 'status', type: 'select', options: { values: ['present', 'absent', 'unsure'], maxSelect: 1 }, required: true },
                    { name: 'sync_date', type: 'date', required: true }
                ],
                listRule: '@request.auth.id != ""',
                viewRule: '@request.auth.id != ""',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""'
            });
            console.log("✓ attendance collection created");
        }

    } catch (e) {
        console.error("Failed:", e.message, JSON.stringify(e.data));
    }
}

main();
