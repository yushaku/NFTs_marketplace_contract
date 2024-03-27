// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PowerDelegationMixin } from "../token/PowerDelegation.sol";

interface IGovernanceToken {
  function _totalSupplySnapshots(
    uint256
  ) external view returns (PowerDelegationMixin.Snapshot memory);

  function _totalSupplySnapshotsCount() external view returns (uint256);
}
