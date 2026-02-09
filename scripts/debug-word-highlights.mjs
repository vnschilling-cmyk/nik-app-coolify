import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function debug() {
    // Check facts with word_study
    const facts = await pb.collection('facts').getFullList({
        filter: `fact_kind="word_study"`
    });

    console.log('\n=== Word Study Facts ===');
    console.log(`Total: ${facts.length}`);
    facts.forEach(f => {
        console.log(`- Word: "${f.word}" | Title: ${f.title} | ID: ${f.id}`);
    });

    // Check all facts that have a "word" field set
    const factsWithWord = await pb.collection('facts').getFullList();
    const withWord = factsWithWord.filter(f => f.word && f.word.trim() !== '');

    console.log('\n=== All Facts with word field ===');
    console.log(`Total: ${withWord.length}`);
    withWord.forEach(f => {
        console.log(`- Word: "${f.word}" | Type: ${f.fact_kind} | Title: ${f.title}`);
    });
}

debug();
