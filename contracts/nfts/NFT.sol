//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTCollectible is ERC721Enumerable, Ownable {
  uint public immutable MAX_SUPPLY;

  uint256 private _tokenIdCounter;
  string public baseTokenURI;

  constructor(
    string memory baseURI,
    uint _max_supply,
    string memory _name,
    string memory _symbol,
    address initialOwner
  ) Ownable(initialOwner) ERC721(_name, _symbol) {
    setBaseURI(baseURI);
    MAX_SUPPLY = _max_supply;
  }

  function reserveNFTs(uint8 _num) public onlyOwner {
    uint newCount = _tokenIdCounter + _num;
    require(newCount <= MAX_SUPPLY, "Not enough NFTs left to reserve");

    for (uint i = 0; i < _num; i++) {
      _mintSingleNFT();
    }
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return baseTokenURI;
  }

  function setBaseURI(string memory _baseTokenURI) public onlyOwner {
    baseTokenURI = _baseTokenURI;
  }

  function mintNFTs(uint _count) public payable {
    uint newCount = _tokenIdCounter + _count;

    require(newCount <= MAX_SUPPLY, "Not enough NFTs left!");
    for (uint i = 0; i < _count; i++) {
      _mintSingleNFT();
    }
  }

  function _mintSingleNFT() private {
    uint newTokenID = _tokenIdCounter;
    _safeMint(msg.sender, newTokenID);
    _tokenIdCounter += 1;
  }

  function tokensOfOwner(address _owner) external view returns (uint[] memory) {
    uint tokenCount = balanceOf(_owner);
    uint[] memory tokensId = new uint256[](tokenCount);

    for (uint i = 0; i < tokenCount; i++) {
      tokensId[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokensId;
  }

  function withdraw() public payable onlyOwner {
    uint balance = address(this).balance;
    require(balance > 0, "No ether left to withdraw");

    (bool success, ) = (msg.sender).call{ value: balance }("");
    require(success, "Transfer failed.");
  }
}
