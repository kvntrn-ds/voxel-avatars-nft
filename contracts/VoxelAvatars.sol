// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title VoxelAvatars
 * @dev NFT contract for minting unique voxel avatars with traits stored on IPFS
 */
contract VoxelAvatars is ERC721, ERC721URIStorage, Ownable {
                /**
                 * @dev Admin function to reset a single tokenURI by tokenId
                 */
                function resetTokenURI(uint256 tokenId) external onlyOwner {
                    require(_exists(tokenId), "Token does not exist");
                    string memory uri = string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
                    _setTokenURI(tokenId, uri);
                }
            /**
             * @dev Admin function to reset tokenURIs for all existing tokens
             */
            function resetAllTokenURIs() external onlyOwner {
                uint256 currentSupply = _tokenIdCounter.current();
                for (uint256 tokenId = 0; tokenId < currentSupply; tokenId++) {
                    string memory uri = string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
                    _setTokenURI(tokenId, uri);
                }
            }
        // Helper function to get substring
        function _substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
            bytes memory strBytes = bytes(str);
            bytes memory result = new bytes(endIndex - startIndex);
            for(uint i = startIndex; i < endIndex; i++) {
                result[i - startIndex] = strBytes[i];
            }
            return string(result);
        }
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Base URI for metadata (IPFS folder)
    string private _baseTokenURI;
    
    // Minting configuration
    uint256 public maxSupply;
    uint256 public mintPrice;
    bool public mintingEnabled;
    
    // Mapping from token ID to traits hash (for verification)
    mapping(uint256 => bytes32) public tokenTraits;
    
    // Events
    event AvatarMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string newBaseURI);
    event MintingToggled(bool enabled);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        string memory baseURI
    ) ERC721(name, symbol) Ownable() {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
        // Always store only the CID in _baseTokenURI
        if (bytes(baseURI).length >= 7 && keccak256(bytes(_substring(baseURI, 0, 7))) == keccak256(bytes("ipfs://"))) {
            _baseTokenURI = _substring(baseURI, 7, bytes(baseURI).length);
        } else {
            _baseTokenURI = baseURI;
        }
        mintingEnabled = false;
    }

    /**
     * @dev Mint a new avatar NFT
     * @param to Address to mint the NFT to
     * @param traitsHash Hash of the traits JSON for this avatar
     */
    function mint(address to, bytes32 traitsHash) public payable {
        require(mintingEnabled, "Minting is not enabled");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        // Store the traits hash for this token
        tokenTraits[tokenId] = traitsHash;
        
        // Construct the token URI (points to IPFS metadata JSON)
        string memory uri = string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
        _setTokenURI(tokenId, uri);
        
        emit AvatarMinted(to, tokenId, uri);
    }

    /**
     * @dev Public mint function - mints to sender
     * @param traitsHash Hash of the traits JSON for verification
     */
    function publicMint(bytes32 traitsHash) external payable {
        mint(msg.sender, traitsHash);
    }

    /**
     * @dev Owner can mint for free (for team/giveaways)
     * @param to Address to mint to
     * @param traitsHash Hash of the traits JSON
     */
    function ownerMint(address to, bytes32 traitsHash) external onlyOwner {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        tokenTraits[tokenId] = traitsHash;
        
                    string memory uri = string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
                    _setTokenURI(tokenId, uri);
        
        emit AvatarMinted(to, tokenId, uri);
    }

    /**
     * @dev Batch mint multiple avatars (owner only)
     * @param to Address to mint to
     * @param traitsHashes Array of traits hashes
     * @param count Number of avatars to mint
     */
    function batchMint(address to, bytes32[] calldata traitsHashes, uint256 count) external onlyOwner {
        require(_tokenIdCounter.current() + count <= maxSupply, "Would exceed max supply");
        require(traitsHashes.length == count, "Traits hashes count mismatch");
        
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _safeMint(to, tokenId);
            tokenTraits[tokenId] = traitsHashes[i];
            
                    string memory uri = string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
                    _setTokenURI(tokenId, uri);
            
            emit AvatarMinted(to, tokenId, uri);
        }
    }

    // Admin functions
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        // Always store only the CID in _baseTokenURI, stripping any ipfs:// prefix
        string memory cid = newBaseURI;
        if (bytes(cid).length >= 7 && keccak256(bytes(_substring(cid, 0, 7))) == keccak256(bytes("ipfs://"))) {
            cid = _substring(cid, 7, bytes(cid).length);
        }
        _baseTokenURI = cid;
        emit BaseURIUpdated(newBaseURI);
    }

    function toggleMinting() external onlyOwner {
        mintingEnabled = !mintingEnabled;
        emit MintingToggled(mintingEnabled);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // View functions
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

        // Debug: Public view for raw baseTokenURI
        function getRawBaseTokenURI() public view returns (string memory) {
            return _baseTokenURI;
        }

        // Debug: Public view for raw tokenURI (calls ERC721URIStorage logic)
        function getRawTokenURI(uint256 tokenId) public view returns (string memory) {
            require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
            return string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
        }

    // Required overrides
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return string(abi.encodePacked("ipfs://", _baseTokenURI, "/", _toString(tokenId), ".json"));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
