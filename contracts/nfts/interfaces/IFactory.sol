// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFactory {
  function list(address owner) external view returns (address[] memory);

  function isMakeByFactory(address collection) external view returns (bool);
}
