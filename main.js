import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Use window.ethers from CDN in browser

// Fetch NFT metadata from Sepolia and IPFS
const CONTRACT_ADDRESS = '0x9426D35274BbE8b9A4EBE9BfC37cE85613C77438'; // Sepolia contract address
const ABI = [
  // Minimal ABI for ERC721 tokenURI and totalSupply
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)"
];

async function loadTraitsFromChain() {
  // Use public Sepolia RPC (or Infura/Alchemy)
  const provider = new window.ethers.JsonRpcProvider('https://sepolia.infura.io/v3/107c67cab27d46bcb69784b01674b038'); // Infura Sepolia RPC
  const contract = new window.ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  const total = await contract.totalSupply();
  const traitsList = [];
  for (let tokenId = 0; tokenId < total; tokenId++) {
    let uri = await contract.tokenURI(tokenId);
    // Only replace ipfs:// with gateway, do not concatenate
    if (uri.startsWith('ipfs://')) {
      uri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    const response = await fetch(uri);
    if (!response.ok) {
      console.error(`Failed to fetch metadata for token ${tokenId}: ${response.status} ${response.statusText}`);
      continue;
    }
    let metadata;
    try {
      metadata = await response.json();
    } catch (e) {
      console.error(`Invalid JSON for token ${tokenId}:`, e);
      continue;
    }
    // If metadata has 'attributes' array, convert to flat traits object
    if (Array.isArray(metadata.attributes)) {
      // Map attribute names to expected variable names
      const traitMap = {
        'Head Size': 'head_size',
        'Body Width': 'body_width',
        'Body Height': 'body_height',
        'Arm Length': 'arm_length',
        'Leg Length': 'leg_length',
        'Skin Color R': 'color_skin_r',
        'Skin Color G': 'color_skin_g',
        'Skin Color B': 'color_skin_b',
        'Cloth Color R': 'color_cloth_r',
        'Cloth Color G': 'color_cloth_g',
        'Cloth Color B': 'color_cloth_b',
        'Has Hat': 'has_hat',
        'Hat Type': 'hat_type',
        'Has Eyes': 'has_eyes',
        'Pose Arms Down': 'pose_arms_down'
      };
      const traits = {};
      for (const attr of metadata.attributes) {
        if (attr.trait_type && attr.value !== undefined) {
          const key = traitMap[attr.trait_type] || attr.trait_type;
          // Convert numeric values to numbers
          if ([
            'head_size','body_width','body_height','arm_length','leg_length',
            'color_skin_r','color_skin_g','color_skin_b','color_cloth_r','color_cloth_g','color_cloth_b'
          ].includes(key)) {
            traits[key] = Number(attr.value);
          } else if (key === 'has_hat' || key === 'has_eyes' || key === 'pose_arms_down') {
            traits[key] = attr.value === true || attr.value === 'true';
          } else {
            traits[key] = attr.value;
          }
        }
      }
      traitsList.push(traits);
    } else {
      traitsList.push(metadata.traits || metadata); // fallback
    }
  }
  return traitsList;
}

// Create a single avatar from traits
function createAvatar(traits) {
  // Validate required numeric fields
  const requiredFields = [
    'head_size', 'body_width', 'body_height', 'arm_length', 'leg_length',
    'color_skin_r', 'color_skin_g', 'color_skin_b',
    'color_cloth_r', 'color_cloth_g', 'color_cloth_b'
  ];
  for (const field of requiredFields) {
    if (typeof traits[field] !== 'number' || isNaN(traits[field])) {
      console.error(`Invalid or missing trait '${field}' in:`, traits);
      return null;
    }
  }

  const group = new THREE.Group();  // Container for all parts

  // Skin and cloth materials
  const skinMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(traits.color_skin_r, traits.color_skin_g, traits.color_skin_b) });
  const clothMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(traits.color_cloth_r, traits.color_cloth_g, traits.color_cloth_b) });

  // Head
  const headGeo = new THREE.BoxGeometry(traits.head_size, traits.head_size, traits.head_size);
  const head = new THREE.Mesh(headGeo, skinMaterial);
  head.position.set(0, 0, traits.body_height + traits.head_size / 2);
  group.add(head);

  // Body
  const bodyGeo = new THREE.BoxGeometry(traits.body_width, 0.5, traits.body_height);
  const body = new THREE.Mesh(bodyGeo, clothMaterial);
  body.position.set(0, 0, traits.body_height / 2);
  group.add(body);

  // Arms
  const armWidth = 0.5;
  const armDepth = 0.5;
  for (let side = -1; side <= 1; side += 2) {
    const armGeo = new THREE.BoxGeometry(armWidth, armDepth, traits.arm_length);
    const arm = new THREE.Mesh(armGeo, skinMaterial);
    const armPosX = side * (traits.body_width / 2 + armWidth / 2);
    const armPosZ = traits.pose_arms_down ? traits.body_height * 0.75 : traits.body_height / 2;
    arm.position.set(armPosX, 0, armPosZ);
    if (!traits.pose_arms_down) {
      arm.rotation.x = Math.PI / 2;  // Rotate for T-pose
    }
    group.add(arm);
  }

  // Legs (two legs)
  const legWidth = traits.body_width / 3;
  const legDepth = 0.5;
  for (let side = -1; side <= 1; side += 2) {
    const legGeo = new THREE.BoxGeometry(legWidth, legDepth, traits.leg_length);
    const leg = new THREE.Mesh(legGeo, skinMaterial);
    const legPosX = side * (legWidth / 2);
    leg.position.set(legPosX, 0, -traits.leg_length / 2);
    group.add(leg);
  }

  // Hat
  if (traits.has_hat) {
    let hatGeo, hatScaleZ;
    if (traits.hat_type === 'cube') {
      hatGeo = new THREE.BoxGeometry(1.2 * traits.head_size, 1.2 * traits.head_size, 0.4);
      hatScaleZ = 0.4;
    } else {
      hatGeo = new THREE.ConeGeometry(traits.head_size / 2, 1.0, 32);
      hatScaleZ = 1.5;
    }
    const hat = new THREE.Mesh(hatGeo, clothMaterial);
    hat.position.set(0, 0, traits.body_height + traits.head_size + hatScaleZ / 2);
    group.add(hat);
  }

  // Eyes
  if (traits.has_eyes) {
    const eyeSize = 0.15;
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for (let side = -0.3; side <= 0.3; side += 0.6) {
      const eyeGeo = new THREE.BoxGeometry(eyeSize, eyeSize / 4, eyeSize);
      const eye = new THREE.Mesh(eyeGeo, eyeMaterial);
      eye.position.set(side, traits.head_size / 2 + 0.01, traits.body_height + traits.head_size / 2);
      group.add(eye);
    }
  }

  return group;
}

// Main setup
async function init() {
  // const traitsList = await loadTraits();
  const traitsList = await loadTraitsFromChain();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);

  // Add lights for better visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);  // Soft overall light
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);  // Directional for shadows/highlights
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Render all avatars in a row
  let avatarIndex = 0;
  traitsList.forEach((traits, index) => {
    const avatar = createAvatar(traits);
    if (!avatar) return; // Skip invalid
    avatar.position.x = avatarIndex * 3;  // Space them out along X-axis
    avatar.rotation.x = -Math.PI / 2;  // Rotate to make them stand upright (Z-up to Y-up)
    scene.add(avatar);
    avatarIndex++;
  });

  // Center camera to view all avatars from the front
  const centerX = (traitsList.length - 1) * 3 / 2;  // Center of all avatars
  camera.position.set(centerX, 3, -8);  // Position in front of avatars
  controls.target.set(centerX, 1.5, 0);  // Look at center of avatars
  controls.enableDamping = true;  // Smooth camera movements
  controls.dampingFactor = 0.05;
  controls.update();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();  // Required for damping
    renderer.render(scene, camera);
  }
  animate();
}

init();