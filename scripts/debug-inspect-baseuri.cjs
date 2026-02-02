// Script to inspect raw baseTokenURI and tokenURI for a given tokenId
const hre = require("hardhat");

async function main() {
  const deployment = require('../deployment-info.json');
  const contractAddress = deployment.contractAddress;
  const tokenId = process.env.DEBUG_TOKENID || 0;
  const VoxelAvatars = await hre.ethers.getContractFactory("VoxelAvatars");
  const contract = VoxelAvatars.attach(contractAddress);

  const rawBaseTokenURI = await contract.getRawBaseTokenURI();
  console.log("Raw baseTokenURI:", rawBaseTokenURI);

  try {
    const rawTokenURI = await contract.getRawTokenURI(tokenId);
    console.log(`Raw tokenURI for tokenId ${tokenId}:`, rawTokenURI);
  } catch (e) {
    console.log(`Error fetching tokenURI for tokenId ${tokenId}:`, e.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
