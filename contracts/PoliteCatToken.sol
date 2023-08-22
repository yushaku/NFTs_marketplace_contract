//SPDX-License-Identifier: Unlicense
//Declare the version of solidity to compile this contract.
//This must match the version of solidity in your hardhat.config.js file
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//This function instantiates the contract and
//classifies ERC20 for storage schema
contract PoliteCatToken is ERC20 {
  //Feel free to change the initial supply of 50 * 10^18 token
  uint constant _initial_supply = 50 * (10 ** 18);

  // make sure to replace the "PoliteCatToken" reference with your own ERC-20 name
  constructor() ERC20("PoliteCatToken", "PCT") {
    _mint(msg.sender, _initial_supply);
  }
}
