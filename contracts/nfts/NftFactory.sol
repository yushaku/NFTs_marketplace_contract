//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./NFTCollection.sol";

interface IFactory {
  function list(address owner) external view returns (address[] memory);

  function isMakeByFactory(address collection) external view returns (bool);
}

contract NftFactory is IFactory {
  mapping(address => address[]) public user_collections;
  mapping(address => bool) public collectionList;

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
    user_collections[msg.sender].push(address(nftAddress));
    collectionList[address(nftAddress)] = true;

    emit createCollection(msg.sender, name, address(newCollecion));

    return nftAddress;
  }

  function list(address owner) external view returns (address[] memory) {
    return user_collections[owner];
  }

  function isMakeByFactory(address collection) external view returns (bool) {
    return collectionList[collection];
  }
}
