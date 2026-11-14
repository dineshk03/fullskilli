const fs = require('node:fs');
const path = require('node:path');
const icons = require('react-icons/fa');

const root = path.resolve(__dirname, '..');
const pickerPath = path.join(root, 'src/components/core/Dashboard/AddCategory/CourseCategories.jsx');
const outputPath = path.join(root, 'src/components/common/categoryIconRegistry.js');
const picker = fs.readFileSync(pickerPath, 'utf8');
const match = picker.match(/const availableIcons = \[([\s\S]*?)\n  \]/);
if (!match) throw new Error('Category icon picker list was not found');

const names = [...new Set([...match[1].matchAll(/'(?<name>Fa[A-Za-z0-9]+)'/g)].map(item => item.groups.name))]
  .filter(name => typeof icons[name] === 'function')
  .sort();
const lines = [
  '// Generated from CourseCategories.jsx by npm run icons:generate.',
  `import { ${names.join(', ')} } from 'react-icons/fa';`,
  '',
  `export const categoryIcons = { ${names.join(', ')} };`,
  ''
];
fs.writeFileSync(outputPath, lines.join('\n'));
console.log(`Generated ${names.length} category icons.`);
