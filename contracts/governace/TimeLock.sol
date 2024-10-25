// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title Timelock
 * @dev A governance Timelock contract that delays the execution of successful proposals
 * for a predetermined period. This delay is enforced to provide time for review and
 * potentially corrective actions if necessary.
 *
 * The contract uses role-based access control:
 * - The proposer role allows accounts to propose new operations.
 * - The executor role allows accounts to execute approved operations after the delay.
 * - The admin role allows managing proposers, executors, and other governance settings.
 *
 * The delay is determined at deployment and can be changed by the admin.
 */
contract Timelock is TimelockController {
  /**
   * @dev Constructor that initializes the TimelockController with a specific delay, a list of proposers, and a list of executors.
   * @param minDelay The minimum time (in seconds) that must pass before a proposal can be executed.
   * @param proposers The addresses that are allowed to propose operations.
   * @param executors The addresses that are allowed to execute operations after the delay has passed.
   * @param admin The address with the TIMELOCK_ADMIN_ROLE, able to grant and revoke roles.
   */
  constructor(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors,
    address admin
  ) TimelockController(minDelay, proposers, executors, admin) {
    // Additional constructor logic can be added here if needed.
  }
}

