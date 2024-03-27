// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVotingStrategy {
  function getVotingPowerAt(
    address user,
    uint256 blockNumber
  ) external view returns (uint256);
}
