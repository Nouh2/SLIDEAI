import 'dotenv/config';

console.log('=== UNSPLASH API DEBUG ===\n');

const accessKey = process.env.UNSPLASH_ACCESS_KEY;

console.log('1. Clé chargée depuis .env:');
console.log(`   Key: ${accessKey ? `${accessKey.slice(0, 10)}...${accessKey.slice(-5)}` : 'MISSING'}`);
console.log(`   Length: ${accessKey?.length || 0} chars\n`);

if (!accessKey || accessKey === 'fake' || accessKey.includes('fake')) {
    console.error('❌ ERREUR: Clé invalide ou fake détectée');
    process.exit(1);
}

// Test 1: Endpoint /photos/random (ancien style avec client_id)
console.log('2. Test avec query param client_id:');
const url1 = `https://api.unsplash.com/photos/random?query=technology&client_id=${accessKey}`;
try {
    const res1 = await fetch(url1);
    console.log(`   Status: ${res1.status} ${res1.statusText}`);

    if (!res1.ok) {
        const error = await res1.text();
        console.log(`   Error Body: ${error}\n`);
    } else {
        console.log('   ✅ SUCCESS with client_id query param\n');
    }
} catch (e: any) {
    console.error(`   ❌ Exception: ${e.message}\n`);
}

// Test 2: Endpoint /search/photos avec Header Authorization
console.log('3. Test avec Authorization Header (/search):');
const url2 = 'https://api.unsplash.com/search/photos?query=technology&per_page=1';
try {
    const res2 = await fetch(url2, {
        headers: {
            'Authorization': `Client-ID ${accessKey}`,
            'Accept-Version': 'v1'  // Unsplash recommande d'ajouter ce header
        }
    });

    console.log(`   Status: ${res2.status} ${res2.statusText}`);

    if (!res2.ok) {
        const error = await res2.text();
        console.log(`   Error Body: ${error}\n`);
    } else {
        const data = await res2.json();
        console.log(`   ✅ SUCCESS - Found ${data.total} images`);
        if (data.results?.[0]) {
            console.log(`   First result: ${data.results[0].urls.small}\n`);
        }
    }
} catch (e: any) {
    console.error(`   ❌ Exception: ${e.message}\n`);
}

// Test 3: Endpoint /photos/random avec Header Authorization
console.log('4. Test avec Authorization Header (/photos/random):');
const url3 = 'https://api.unsplash.com/photos/random?query=technology&orientation=landscape';
try {
    const res3 = await fetch(url3, {
        headers: {
            'Authorization': `Client-ID ${accessKey}`,
            'Accept-Version': 'v1'
        }
    });

    console.log(`   Status: ${res3.status} ${res3.statusText}`);

    if (!res3.ok) {
        const error = await res3.text();
        console.log(`   Error Body: ${error}\n`);
    } else {
        const data = await res3.json();
        console.log(`   ✅ SUCCESS`);
        console.log(`   Image URL: ${data.urls?.regular}\n`);
    }
} catch (e: any) {
    console.error(`   ❌ Exception: ${e.message}\n`);
}

console.log('=== FIN DEBUG ===');
