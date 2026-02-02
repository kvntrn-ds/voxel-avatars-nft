const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const contractAddress = deployment.contractAddress;

  // Load traits hashes
  const traitsHashes = JSON.parse(fs.readFileSync("traits-hashes.json", "utf8"));

  // How many to mint in this batch
  const count = traitsHashes.length; // Automatically set to number of hashes
  const hashesToMint = traitsHashes.slice(0, count);

  // Get signer
  const [deployer] = await hre.ethers.getSigners();

  // Attach to contract
  const VoxelAvatars = await hre.ethers.getContractFactory("VoxelAvatars");
  const contract = await VoxelAvatars.attach(contractAddress);

  // Batch mint
  console.log(`Batch minting ${count} avatars to ${deployer.address}...`);
  const tx = await contract.batchMint(deployer.address, hashesToMint, count);
  await tx.wait();
  console.log("✅ Batch mint complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
