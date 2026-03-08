const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    const initialContent = content;

    content = content.replace(/â€”/g, '-')
        .replace(/â€“/g, '-')
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€\x9D/g, '"')
        .replace(/â€/g, '"')
        .replace(/â€¢/g, '•')
        .replace(/ðŸ›¡ï¸ /g, '🛡️')
        .replace(/âŒ/g, '✕')
        .replace(/âœ•/g, '✕')
        .replace(/âœ…/g, '✅')
        .replace(/â Œ/g, '❌')
        .replace(/ðŸŽ¥/g, '🎥')
        .replace(/ðŸ‘‹/g, '👋')
        .replace(/ðŸ”Œ/g, '🔌')
        .replace(/ðŸš€/g, '🚀')
        .replace(/ðŸ’¡/g, '💡');

    if (content !== initialContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed encoding in: ${file}`);
    }
});
