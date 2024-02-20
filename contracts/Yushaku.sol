// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Yushaku is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
  uint constant _initial_supply = 50 * (10 ** 18);
  bytes32 private constant _PERMIT_TYPEHASH =
    keccak256(
      "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
    );

  constructor() ERC20("Yushaku", "YSK") Ownable() ERC20Permit("YSK") {
    _mint(msg.sender, _initial_supply);
  }

  function permittedTransferFrom(
    address from,
    address to,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public virtual returns (bool) {
    require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

    bytes32 structHash = keccak256(
      abi.encode(_PERMIT_TYPEHASH, from, to, amount, _useNonce(from), deadline)
    );
    bytes32 hash = _hashTypedDataV4(structHash);

    address signer = ECDSA.recover(hash, v, r, s);
    require(signer == from, "ERC20Permit: invalid signature");

    _transfer(from, to, amount);
    return true;
  }

  function pause() public onlyOwner {
    _pause();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20, ERC20Pausable) {
    super._beforeTokenTransfer(from, to, amount);
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }
}
