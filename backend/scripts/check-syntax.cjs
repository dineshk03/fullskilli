const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let checked = 0;
let failed = 0;
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'uploads', '.git'].includes(entry.name)) continue;
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (/\.(js|cjs)$/.test(file)) {
            checked++;
            const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
            if (result.status !== 0) { failed++; console.error(path.relative(root, file), result.stderr || result.error?.message); }
        }
    }
}
walk(root);
console.log(`Syntax checked ${checked} files; ${failed} failures.`);
process.exitCode = failed ? 1 : 0;
