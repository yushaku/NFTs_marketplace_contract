// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OnChainWhitelistContract is Ownable {
  mapping(address => bool) public whitelist;

  /**
   * @notice Add to whitelist
   */
  function addToWhitelist(address[] calldata addresses) external onlyOwner {
    for (uint i = 0; i < addresses.length; i++) {
      whitelist[addresses[i]] = true;
    }
  }

  /**
   * @notice Remove from whitelist
   */
  function removeFromWhitelist(
    address[] calldata addresses
  ) external onlyOwner {
    for (uint i = 0; i < addresses.length; i++) {
      delete whitelist[addresses[i]];
    }
  }

  /**
   * @notice Function with whitelist
   */
  function whitelistFunc() external view {
    require(whitelist[msg.sender], "NOT_IN_WHITELIST");
  }
}
