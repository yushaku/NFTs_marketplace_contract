// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Whitelist {
  uint8 public maxWhitelistedAddresses;

  // Create a mapping of whitelistedAddresses
  // if an address is whitelisted, we would set it to true, it is false by default for all other addresses.
  mapping(address => bool) public whitelisted;

  // numAddressesWhitelisted would be used to keep track of how many addresses have been whitelisted
  uint8 public numAddressesWhitelisted;

  // Setting the Max number of whitelisted addresses
  // User will put the value at the time of deployment
  constructor(uint8 _maxWhitelistedAddresses) {
    maxWhitelistedAddresses = _maxWhitelistedAddresses;
  }

  /**
    addAddressToWhitelist - This function adds the address of the sender to the whitelist
  */
  function addAddressToWhitelist() public {
    require(!whitelisted[msg.sender], "Sender has already been whitelisted");
    require(
      numAddressesWhitelisted < maxWhitelistedAddresses,
      "More addresses cant be added, limit reached"
    );
    whitelisted[msg.sender] = true;
    numAddressesWhitelisted += 1;
  }
}
