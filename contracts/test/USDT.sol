// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDT is ERC20, Ownable {
  uint constant _INITIAL_SUPPLY = 1_000_000 ether;

  constructor() ERC20("Fake USDT", "USDT") Ownable(msg.sender) {
    _mint(msg.sender, _INITIAL_SUPPLY);
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
