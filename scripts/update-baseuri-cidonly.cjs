const hre = require("hardhat");
const fs = require("fs");

async function main() {
  // Load deployment info
  const deployment = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
  const contractAddress = deployment.contractAddress;

  // Set your IPFS CID here (no ipfs:// prefix)
  const NEW_CID = "bafkreig76hhuhd3q4xfnkxatozbuvjeyqazjzvvb2hwadj5uiaove7gp4i";

  // Get signer
  const [deployer] = await hre.ethers.getSigners();

  // Attach to contract
  const VoxelAvatars = await hre.ethers.getContractFactory("VoxelAvatars");
  const contract = await VoxelAvatars.attach(contractAddress);

  // Update base URI
  console.log(`Updating base URI to CID only: ${NEW_CID}`);
  const tx = await contract.setBaseURI(NEW_CID);
  await tx.wait();
  console.log("✅ Base URI updated to CID only!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
