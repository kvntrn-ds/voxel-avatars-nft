const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const contractAddress = deployment.contractAddress;

  // Get signer
  const [deployer] = await hre.ethers.getSigners();

  // Attach to contract
  const VoxelAvatars = await hre.ethers.getContractFactory("VoxelAvatars");
  const contract = await VoxelAvatars.attach(contractAddress);

  // Set the number of tokens to reset (update as needed)
  const totalTokens = 15; // Update to your actual supply

  for (let tokenId = 1; tokenId <= totalTokens; tokenId++) {
    console.log(`Resetting tokenURI for tokenId ${tokenId}...`);
    const tx = await contract.resetTokenURI(tokenId);
    await tx.wait();
    console.log(`✅ tokenId ${tokenId} reset!`);
  }
  console.log("All tokenURIs reset!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
