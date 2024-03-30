// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./SMTypes.sol";

/**
 * @title Storage
 * @dev Storage contract. Contains or inherits from all contract with storage.
 */
abstract contract Storage is AccessControlUpgradeable, ReentrancyGuard {
  // ============ Epoch Schedule ============

  /// @dev The parameters specifying the function from timestamp to epoch number.
  SMTypes.EpochParameters internal _EPOCH_PARAMETERS_;

  /// @dev The period of time at the end of each epoch in which withdrawals cannot be requested.
  uint256 internal _BLACKOUT_WINDOW_;

  // ============ STAKED TOKEN ERC20 ============

  /// @dev Allowances for ERC-20 transfers.
  mapping(address => mapping(address => uint256)) internal _ALLOWANCES_;

  // ============ GOVERNANCE POWER DELEGATION ============

  /// @dev Domain separator for EIP-712 signatures.
  bytes32 internal _DOMAIN_SEPARATOR_;

  /// @dev Mapping from (owner) => (next valid nonce) for EIP-712 signatures.
  mapping(address => uint256) internal _NONCES_;

  /// @dev Snapshots and delegates for governance voting power.
  // prettier-ignore
  mapping(address => mapping(uint256 => SMTypes.Snapshot)) internal _VOTING_SNAPSHOTS_;
  mapping(address => uint256) internal _VOTING_SNAPSHOT_COUNTS_;
  mapping(address => address) internal _VOTING_DELEGATES_;

  /// @dev Snapshots and delegates for governance proposition power.
  // prettier-ignore
  mapping(address => mapping(uint256 => SMTypes.Snapshot)) internal _PROPOSITION_SNAPSHOTS_;
  mapping(address => uint256) internal _PROPOSITION_SNAPSHOT_COUNTS_;
  mapping(address => address) internal _PROPOSITION_DELEGATES_;

  // ============ REWARDS ACCOUNTING ============

  /// @dev The emission rate of rewards.
  uint256 internal _REWARDS_PER_SECOND_;

  /// @dev The cumulative rewards earned per staked token. (Shared storage slot.)
  uint224 internal _GLOBAL_INDEX_;

  /// @dev The timestamp at which the global index was last updated. (Shared storage slot.)
  uint32 internal _GLOBAL_INDEX_TIMESTAMP_;

  /// @dev The value of the global index when the user's staked balance was last updated.
  mapping(address => uint256) internal _USER_INDEXES_;

  /// @dev The user's accrued, unclaimed rewards (as of the last update to the user index).
  mapping(address => uint256) internal _USER_REWARDS_BALANCES_;

  /// @dev The value of the global index at the end of a given epoch.
  mapping(uint256 => uint256) internal _EPOCH_INDEXES_;

  // ============ STAKER ACCOUNTING ============

  /// @dev The active balance by staker.
  mapping(address => SMTypes.StoredBalance) internal _ACTIVE_BALANCES_;

  /// @dev The total active balance of stakers.
  SMTypes.StoredBalance internal _TOTAL_ACTIVE_BALANCE_;

  /// @dev The inactive balance by staker.
  mapping(address => SMTypes.StoredBalance) internal _INACTIVE_BALANCES_;

  /// @dev The total inactive balance of stakers.
  SMTypes.StoredBalance internal _TOTAL_INACTIVE_BALANCE_;

  // ============ EXCHANGE RATE ============

  /// @dev The value of one underlying token, in the units used for staked balances, denominated
  ///  as a mutiple of EXCHANGE_RATE_BASE for additional precision.
  uint256 internal _EXCHANGE_RATE_;

  /// @dev Historical snapshots of the exchange rate, in each block that it has changed.
  mapping(uint256 => SMTypes.Snapshot) internal _EXCHANGE_RATE_SNAPSHOTS_;

  /// @dev Number of snapshots of the exchange rate.
  uint256 internal _EXCHANGE_RATE_SNAPSHOT_COUNT_;
}
