import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function checkViktor() {
    try {
        const users = await pb.collection('users').getFullList({
            filter: 'name ~ "Viktor" || email ~ "schilling"'
        });
        console.log('Found users:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

checkViktor();
