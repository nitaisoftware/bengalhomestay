const fs   = require('fs');
const path = require('path');

function fixDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
      fixDir(full);
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      const buf     = fs.readFileSync(full);
      const cleaned = buf.filter(b => b !== 0);
      if (cleaned.length !== buf.length) {
        fs.writeFileSync(full, cleaned);
        console.log('Fixed:', full);
      }
    }
  }
}

fixDir(path.join(__dirname, 'src'));
console.log('Done.');
