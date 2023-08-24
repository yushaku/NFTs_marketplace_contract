//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTCollectible is ERC721Enumerable, Ownable {
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  Counters.Counter private _tokenCount;

  uint public immutable MAX_SUPPLY;
  uint public immutable PRICE;
  uint public immutable MAX_PER_MINT;

  string public baseTokenURI;

  constructor(
    string memory baseURI,
    uint _max_supply,
    uint _price,
    uint _max_per_mint
  ) ERC721("Polite cat connection", "PCC") {
    setBaseURI(baseURI);
    MAX_PER_MINT = _max_per_mint;
    PRICE = _price;
    MAX_SUPPLY = _max_supply;
  }

  function reserveNFTs(uint8 _num) public onlyOwner {
    uint totalMinted = _tokenCount.current();

    require(
      totalMinted.add(_num) < MAX_SUPPLY,
      "Not enough NFTs left to reserve"
    );

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
    uint totalMinted = _tokenCount.current();

    require(totalMinted.add(_count) <= MAX_SUPPLY, "Not enough NFTs left!");
    require(
      _count > 0 && _count <= MAX_PER_MINT,
      "Cannot mint specified number of NFTs."
    );
    require(
      msg.value >= PRICE.mul(_count),
      "Not enough ether to purchase NFTs."
    );

    for (uint i = 0; i < _count; i++) {
      _mintSingleNFT();
    }
  }

  function _mintSingleNFT() private {
    uint newTokenID = _tokenCount.current();
    _safeMint(msg.sender, newTokenID);
    _tokenCount.increment();
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

    (bool success, ) = (msg.sender).call{value: balance}("");
    require(success, "Transfer failed.");
  }
}
