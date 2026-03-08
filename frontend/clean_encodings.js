const fs = require('fs');

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove BOM
    content = content.replace(/^\uFEFF/, '');
    // Remove other hidden weird characters commonly found in copied code
    content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
    content = content.replace(/\uFFFD/g, '');
    // Re-save
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${filePath}`);
}

cleanFile('src/pages/Feed.jsx');
cleanFile('src/components/layout/PostCard.jsx');
