//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./NFTCollection.sol";

contract NftFactory {
  mapping(address => address[]) public getCollecion;

  event createCollection(address from, string name, address nft);

  function create(
    string memory name,
    string memory symbol,
    uint128 _royaltyBps
  ) public returns (address) {
    NFTCollection newCollecion = new NFTCollection(
      msg.sender,
      name,
      symbol,
      msg.sender,
      _royaltyBps
    );
    address nftAddress = address(newCollecion);
    getCollecion[msg.sender].push(address(nftAddress));

    emit createCollection(msg.sender, name, address(newCollecion));

    return nftAddress;
  }

  function list(address owner) public view returns (address[] memory) {
    return getCollecion[owner];
  }
}
