// Randomize traits for all metadata files in ./metadata
const fs = require('fs');
const path = require('path');

const METADATA_DIR = path.join(__dirname, '../metadata');

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function randBool() {
  return Math.random() < 0.5;
}
function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

fs.readdirSync(METADATA_DIR).forEach(file => {
  if (!file.endsWith('.json')) return;
  const filePath = path.join(METADATA_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let attrs = data.attributes || [];
  // Helper to set or update a trait
  function setTrait(trait_type, value) {
    const idx = attrs.findIndex(a => a.trait_type === trait_type);
    if (idx >= 0) attrs[idx].value = value;
    else attrs.push({ trait_type, value });
  }
  // Randomize traits
  setTrait('Skin Color R', randFloat(0.7, 1.0));
  setTrait('Skin Color G', randFloat(0.5, 0.8));
  setTrait('Skin Color B', randFloat(0.3, 0.6));
  setTrait('Cloth Color R', randFloat(0.1, 1.0));
  setTrait('Cloth Color G', randFloat(0.1, 1.0));
  setTrait('Cloth Color B', randFloat(0.1, 1.0));
  setTrait('Has Eyes', randBool());
  setTrait('Has Hat', randBool());
  setTrait('Hat Type', randChoice(['cube', 'cone']));
  setTrait('Pose Arms Down', randBool());
  setTrait('Head Size', randFloat(0.9, 1.2));
  setTrait('Body Width', randFloat(1.0, 1.5));
  setTrait('Body Height', randFloat(1.8, 2.2));
  setTrait('Arm Length', randFloat(1.0, 1.5));
  setTrait('Leg Length', randFloat(1.0, 1.5));
  data.attributes = attrs;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Randomized ${file}`);
});
console.log('All metadata files randomized with new traits.');
