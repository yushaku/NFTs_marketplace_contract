// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { TimelockExecutor } from "./TimelockExecutor.sol";
import { ProposalValidator } from "./ProposalValidator.sol";

/**
 * @title Executor
 * @notice A time-locked executor for governance proposals.
 *
 *  Responsible for the following:
 *  - Check proposition power to validate the creation or cancellation of proposals.
 *  - Check voting power to validate the success of proposals.
 *  - Queue, execute, and cancel the transactions of successful proposals.
 */
contract Executor is TimelockExecutor, ProposalValidator {
  constructor(
    address admin,
    uint256 delay,
    uint256 gracePeriod,
    uint256 minimumDelay,
    uint256 maximumDelay,
    uint256 threshold,
    uint256 voteDuration,
    uint256 voteDifferential,
    uint256 minimumQuorum
  )
    TimelockExecutor(admin, delay, gracePeriod, minimumDelay, maximumDelay)
    ProposalValidator(threshold, voteDuration, voteDifferential, minimumQuorum)
  {}
}
