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
    'â€ ': '"',
    'â€"': '-',
    'â€”': '—',
    'â€¦': '...',
    'Ã…â€œ': 'œ',
    'Ã': 'à'
};

let testStr = "CrÃ©er";
let testFixed = Buffer.from(testStr, 'latin1').toString('utf8');

// I will just use manual replacements to be safe.
for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed encoding in fr.json');
