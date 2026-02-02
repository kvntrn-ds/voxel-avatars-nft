# Voxel Avatars NFT Project

This project is a full-stack NFT pipeline for generative voxel avatars, including:
- Solidity ERC721 contract
- Hardhat deployment and scripts
- Three.js + ethers.js web frontend
- IPFS metadata integration

## Features
- Mint generative voxel avatars as NFTs
- Metadata and images hosted on IPFS
- Three.js web app renders avatars from on-chain data

## Getting Started

### Prerequisites
- Node.js & npm
- Hardhat (`npm install --save-dev hardhat`)
- IPFS account (Pinata, web3.storage, etc.)

### Install
```
npm install
```

### Environment
Create a `.env` file with your private key and RPC URL:
```
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Deploy Contract
```
npx hardhat run scripts/deploy.cjs --network sepolia
```

### Upload Metadata
- Place your metadata JSON files in the `metadata/` folder.
- Upload the folder to IPFS and note the CID.
- Update the contract base URI with the new CID:
```
npx hardhat run scripts/update-baseuri-<your-cid-script>.cjs --network sepolia
npx hardhat run scripts/reset-tokenuris-safe.cjs --network sepolia
```

### Run Frontend
Open `index.html` in your browser. The app fetches and renders avatars from the blockchain and IPFS.

## Security
- **Never commit your .env or private keys to GitHub!**
- .gitignore is set up to protect secrets and build files.

## License
MIT

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```
