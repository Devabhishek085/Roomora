const fs = require('fs');
let content = fs.readFileSync('src/services/compatibility.ts', 'utf8');
const lines = content.split('\n');
const corrupted = [];
lines.forEach((line, i) => {
  if (line.includes('isVerifiedDemo: true,\\r\\n')) {
    corrupted.push(i + 1);
  }
});
console.log('Corrupted lines:', corrupted.length, 'at:', corrupted.join(', '));

const newLines = [];
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('isVerifiedDemo: true,\\r\\n')) {
    // Extract the socialBadge value from the corrupted line
    const match = line.match(/socialBadge: (.+?)\r?$/);
    const badge = match ? match[1] : "''";
    const indent = '    ';
    newLines.push(indent + 'isVerifiedDemo: true,\r');
    newLines.push(indent + "demoLabel: 'AI-generated demo profile',\r");
    newLines.push(indent + 'socialBadge: ' + badge + '\r');
    fixed++;
  } else {
    newLines.push(line);
  }
}
fs.writeFileSync('src/services/compatibility.ts', newLines.join('\n'), 'utf8');
console.log('Fixed', fixed, 'corrupted lines');
