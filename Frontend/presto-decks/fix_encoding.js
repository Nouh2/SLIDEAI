const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'locales', 'fr.json');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã«': 'ë',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ã®': 'î',
    'Ã¯': 'ï',
    'Ã´': 'ô',
    'Ã¶': 'ö',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã¼': 'ü',
    'Ã§': 'ç',
    'Ã‰': 'É',
    'Ãˆ': 'È',
    'ÃŠ': 'Ê',
    'Ã€': 'À',
    'Ã‚': 'Â',
    'ÃŽ': 'Î',
    'Ã”': 'Ô',
    'Ã›': 'Û',
    'Ã‡': 'Ç',
    'â€™': "'",
    'â€œ': '"',
    'â€': '"',
    'â€"': '-',
    'â€”': '—',
    'â€¦': '...',
    'Ã…â€œ': 'Œ',
    'Ã…â€œ': 'œ',
    'Ã': 'à' // Sometimes 'Ã ' is à, but we need to match carefully. Let's just do 'Ã ' explicitly.
};

// Also 'Ã\xa0' is 'à'
// Let's do a more robust approach if it's strictly UTF8 interpreted as Windows-1252.
// Alternatively, we can just replace the strings.

// Let's do buffer conversion first to see if it fixes it perfectly.
// Because "mojibake" is often due to reading UTF-8 as Latin-1 (Windows-1252) and saving it as UTF-8.
function fixMojibake(str) {
    // Try to encode string to latin1, then decode as utf8
    try {
        const buf = Buffer.from(str, 'latin1');
        const fixed = buf.toString('utf8');
        // If the fixed string still has weird chars like '', it might not have been a pure latin1 issue,
        // or it's mixed. But since it represents standard text, this usually works perfectly.
        // Let's check if it throws or gives garbage.
        if (fixed.includes('')) {
            return str; // Fallback
        }
        return fixed;
    } catch (e) {
        return str;
    }
}

// Actually, the issue is that the text is already saved with "Ã©" characters in UTF-8.
// So Buffer.from(content, 'latin1').toString('utf8') works if the "Ã©" was read from a file that actually had those bytes in latin1 range.
// Let's try it on a sample.
let testStr = "CrÃ©er";
let testFixed = Buffer.from(testStr, 'latin1').toString('utf8');
if (testFixed === "Créer") {
    content = Buffer.from(content, 'latin1').toString('utf8');
} else {
    // Manual replace
    for (const [bad, good] of Object.entries(replacements)) {
        content = content.split(bad).join(good);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed encoding in fr.json');
