const hre = require("hardhat");

async function main() {
  console.log("Deploying VoxelAvatars NFT contract...");

  // Contract configuration
  const NAME = "Voxel Avatars";
  const SYMBOL = "VOXEL";
  const MAX_SUPPLY = 10000;
  const MINT_PRICE = hre.ethers.parseEther("0.01"); // 0.01 ETH per mint
  const BASE_URI = "bafkreig76hhuhd3q4xfnkxatozbuvjeyqazjzvvb2hwadj5uiaove7gp4i"; // Just the CID, no ipfs://

  // Deploy the contract
  const VoxelAvatars = await hre.ethers.getContractFactory("VoxelAvatars");
  const voxelAvatars = await VoxelAvatars.deploy(
    NAME,
    SYMBOL,
    MAX_SUPPLY,
    MINT_PRICE,
    BASE_URI
  );

  await voxelAvatars.waitForDeployment();
  const contractAddress = await voxelAvatars.getAddress();

  console.log("✅ VoxelAvatars deployed to:", contractAddress);
  console.log("Configuration:");
  console.log("- Name:", NAME);
  console.log("- Symbol:", SYMBOL);
  console.log("- Max Supply:", MAX_SUPPLY);
  console.log("- Mint Price:", hre.ethers.formatEther(MINT_PRICE), "ETH");
  console.log("- Base URI:", BASE_URI);
  
  console.log("\n⚠️  Remember to:");
  console.log("1. Update BASE_URI with your IPFS CID after uploading metadata");
  console.log("2. Enable minting by calling toggleMinting()");
  console.log("3. Verify contract on Etherscan");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    config: {
      name: NAME,
      symbol: SYMBOL,
      maxSupply: MAX_SUPPLY.toString(),
      mintPrice: hre.ethers.formatEther(MINT_PRICE),
      baseURI: BASE_URI
    }
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📝 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
