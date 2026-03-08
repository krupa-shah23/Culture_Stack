const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

const replacements = [
    { regex: /bg-\[#F5F5F0\]/g, replacement: 'bg-earth-bg' },
    { regex: /bg-\[#EBE8E0\]/g, replacement: 'bg-earth-surface' },
    { regex: /bg-\[#8C7851\]/g, replacement: 'bg-earth-green' },
    { regex: /text-\[#8C7851\]/g, replacement: 'text-earth-green' },
    { regex: /border-\[#8C7851\]/g, replacement: 'border-earth-green' },
    { regex: /ring-\[#8C7851\]/g, replacement: 'ring-earth-green' },
    { regex: /text-\[#1A1A1A\]/g, replacement: 'text-charcoal' },
    { regex: /bg-\[#1A1A1A\]/g, replacement: 'bg-charcoal' },
    { regex: /border-\[#1A1A1A\]/g, replacement: 'border-charcoal' },
    { regex: /text-\[#4A4A4A\]/g, replacement: 'text-charcoal\/80' },
    { regex: /border-\[#4A4A4A\]/g, replacement: 'border-charcoal\/80' },
    { regex: /bg-\[#F2EFE9\]/g, replacement: 'bg-earth-surface' },
];

function walk(directory) {
    let results = [];
    try {
        const list = fs.readdirSync(directory);
        list.forEach(file => {
            file = path.join(directory, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(walk(file));
            } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
                results.push(file);
            }
        });
    } catch (err) {
        console.error(`Error walking ${directory}:`, err);
    }
    return results;
}

const files = walk(dir);
console.log(`Found ${files.length} files to process.`);

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content;

        replacements.forEach(({ regex, replacement }) => {
            newContent = newContent.replace(regex, replacement);
        });

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated: ${file}`);
        }
    } catch (e) {
        console.error(`Failed on ${file}:`, e);
    }
});
