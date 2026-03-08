const fs = require('fs');
const glob = require('glob');
const parser = require('@babel/parser');

const files = [
    'src/pages/Feed.jsx',
    'src/components/layout/PostCard.jsx',
    'src/components/layout/Navbar.jsx'
];

files.forEach(file => {
    try {
        const code = fs.readFileSync(file, 'utf8');
        parser.parse(code, {
            sourceType: "module",
            plugins: ["jsx"]
        });
        console.log(`[PASS] ${file}`);
    } catch (err) {
        console.error(`[FAIL] ${file} - ${err.message}`);
    }
});
