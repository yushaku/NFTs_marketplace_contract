// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./impl/Admin.sol";
import "./impl/Slashing.sol";
import "./impl/Getters.sol";
import "./impl/Operators.sol";
import "./impl/Staking.sol";

/**
 * @title SafetyModule
 * @notice Contract for staking tokens,
 * which may be slashed by the permissioned slasher.
 */

contract SafetyModule is Slashing, Operators, Admin, Getters {
  string public constant EIP712_DOMAIN_NAME = "Yushaku Safety Module";
  bytes32 public constant EIP712_DOMAIN_SCHEMA_HASH =
    keccak256(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

  // ============ Constructor ============

  constructor(
    IERC20 stakedToken,
    IERC20 rewardsToken,
    address rewardsTreasury,
    uint256 distributionStart,
    uint256 distributionEnd
  )
    Staking(
      stakedToken,
      rewardsToken,
      rewardsTreasury,
      distributionStart,
      distributionEnd
    )
  {}

  // ============ External Functions ============

  function initialize(
    uint256 interval,
    uint256 offset,
    uint256 blackoutWindow
  ) external initializer {
    __SM1ExchangeRate_init();
    __Roles_init();
    __EpochSchedule_init(interval, offset, blackoutWindow);
    __Rewards_init();

    _DOMAIN_SEPARATOR_ = keccak256(
      abi.encode(
        EIP712_DOMAIN_SCHEMA_HASH,
        keccak256(bytes(EIP712_DOMAIN_NAME)),
        address(this)
      )
    );
  }
}
