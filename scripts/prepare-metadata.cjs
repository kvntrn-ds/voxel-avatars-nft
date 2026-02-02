const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * This script prepares metadata JSON files for each avatar that will be uploaded to IPFS
 * It creates OpenSea-compatible metadata with traits from voxel_avatars_traits.json
 */

// Load the traits data
const traitsData = JSON.parse(fs.readFileSync('voxel_avatars_traits.json', 'utf8'));

// Create metadata directory
const metadataDir = './metadata';
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir);
}

console.log(`📦 Preparing metadata for ${traitsData.length} avatars...\n`);

// Track all traits hashes for the contract
const traitsHashes = [];

traitsData.forEach((traits, index) => {
  // Calculate hash of traits for on-chain verification
  const traitsJson = JSON.stringify(traits);
  const traitsHash = '0x' + crypto.createHash('sha256').update(traitsJson).digest('hex');
  traitsHashes.push(traitsHash);

  // Create OpenSea-compatible metadata
  const metadata = {
    name: `Voxel Avatar #${index}`,
    description: `A unique generative voxel avatar with procedurally generated traits.`,
    image: `ipfs://YOUR_IMAGES_CID/${index}.png`, // Update after uploading images
    external_url: `https://yourwebsite.com/avatar/${index}`,
    attributes: [
      {
        trait_type: "Head Size",
        value: traits.head_size.toFixed(2),
        display_type: "number"
      },
      {
        trait_type: "Body Width",
        value: traits.body_width.toFixed(2),
        display_type: "number"
      },
      {
        trait_type: "Body Height",
        value: traits.body_height.toFixed(2),
        display_type: "number"
      },
      {
        trait_type: "Arm Length",
        value: traits.arm_length.toFixed(2),
        display_type: "number"
      },
      {
        trait_type: "Leg Length",
        value: traits.leg_length.toFixed(2),
        display_type: "number"
      },
      {
        trait_type: "Skin Color",
        value: `RGB(${Math.round(traits.color_skin_r * 255)}, ${Math.round(traits.color_skin_g * 255)}, ${Math.round(traits.color_skin_b * 255)})`
      },
      {
        trait_type: "Cloth Color",
        value: `RGB(${Math.round(traits.color_cloth_r * 255)}, ${Math.round(traits.color_cloth_g * 255)}, ${Math.round(traits.color_cloth_b * 255)})`
      },
      {
        trait_type: "Has Hat",
        value: traits.has_hat ? "Yes" : "No"
      },
      {
        trait_type: "Hat Type",
        value: traits.has_hat ? (traits.hat_type.charAt(0).toUpperCase() + traits.hat_type.slice(1)) : "None"
      },
      {
        trait_type: "Has Eyes",
        value: traits.has_eyes ? "Yes" : "No"
      },
      {
        trait_type: "Pose",
        value: traits.pose_arms_down ? "Arms Down" : "T-Pose"
      }
    ]
  };

  // Save metadata JSON
  const filename = `${index}.json`;
  fs.writeFileSync(
    path.join(metadataDir, filename),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`✅ Created metadata for Avatar #${index}`);
  console.log(`   Traits Hash: ${traitsHash}`);
});

// Save traits hashes for contract interaction
fs.writeFileSync(
  './traits-hashes.json',
  JSON.stringify(traitsHashes, null, 2)
);

console.log(`\n✅ All metadata files created in ./metadata/`);
console.log(`✅ Traits hashes saved to traits-hashes.json`);

console.log(`\n📋 Next steps:`);
console.log(`1. Generate/export images for each avatar (0.png, 1.png, etc.)`);
console.log(`2. Upload images to IPFS and get the CID`);
console.log(`3. Update the "image" field in each metadata JSON with the images CID`);
console.log(`4. Upload the metadata folder to IPFS and get the CID`);
console.log(`5. Update the BASE_URI in deploy.js with: ipfs://YOUR_METADATA_CID`);
console.log(`6. Deploy the contract`);
