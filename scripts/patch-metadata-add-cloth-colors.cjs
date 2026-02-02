// Patch all metadata files in ./metadata to add default cloth color traits if missing
const fs = require('fs');
const path = require('path');

const METADATA_DIR = path.join(__dirname, '../metadata');
const DEFAULT_COLORS = [0.2, 0.4, 0.8]; // R, G, B (values between 0 and 1)

fs.readdirSync(METADATA_DIR).forEach(file => {
  if (!file.endsWith('.json')) return;
  const filePath = path.join(METADATA_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const attrs = data.attributes || [];
  const hasR = attrs.some(a => a.trait_type === 'Cloth Color R');
  const hasG = attrs.some(a => a.trait_type === 'Cloth Color G');
  const hasB = attrs.some(a => a.trait_type === 'Cloth Color B');
  if (!hasR) attrs.push({ trait_type: 'Cloth Color R', value: DEFAULT_COLORS[0] });
  if (!hasG) attrs.push({ trait_type: 'Cloth Color G', value: DEFAULT_COLORS[1] });
  if (!hasB) attrs.push({ trait_type: 'Cloth Color B', value: DEFAULT_COLORS[2] });
  data.attributes = attrs;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Patched ${file}`);
});
console.log('All metadata files patched with cloth color traits if missing.');
