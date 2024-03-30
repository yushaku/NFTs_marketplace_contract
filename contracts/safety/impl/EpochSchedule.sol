// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "../../utils/SafeCast.sol";
import "./SMTypes.sol";
import "./Storage.sol";

/**
 * @title EpochSchedule
 * @dev Defines a function from block timestamp to epoch number.
 *
 *  The formula used is `n = floor((t - b) / a)` where:
 *    - `n` is the epoch number
 *    - `t` is the timestamp (in seconds)
 *    - `b` is a non-negative offset, indicating the start of epoch zero (in seconds)
 *    - `a` is the length of an epoch, a.k.a. the interval (in seconds)
 *
 *  Note that by restricting `b` to be non-negative, we limit ourselves to functions in which epoch
 *  zero starts at a non-negative timestamp.
 *
 *  The recommended epoch length and blackout window are 28 and 7 days respectively; however, these
 *  are modifiable by the admin, within the specified bounds.
 */
abstract contract EpochSchedule is Storage {
  using SafeCast for uint256;
  using SafeMath for uint256;

  // ============ Events ============

  event EpochParametersChanged(SMTypes.EpochParameters epochParameters);

  event BlackoutWindowChanged(uint256 blackoutWindow);

  // ============ Initializer ============

  function __EpochSchedule_init(
    uint256 interval,
    uint256 offset,
    uint256 blackoutWindow
  ) internal {
    require(
      block.timestamp < offset,
      "EpochSchedule: Epoch zero must start after initialization"
    );
    _setBlackoutWindow(blackoutWindow);
    _setEpochParameters(interval, offset);
  }

  // ============ Public Functions ============

  /**
   * @notice Get the epoch at the current block timestamp.
   *
   *  NOTE: Reverts if epoch zero has not started.
   *
   * @return The current epoch number.
   */
  function getCurrentEpoch() public view returns (uint256) {
    (
      uint256 interval,
      uint256 offsetTimestamp
    ) = _getIntervalAndOffsetTimestamp();
    return offsetTimestamp.div(interval);
  }

  /**
   * @notice Get the time remaining in the current epoch.
   *
   *  NOTE: Reverts if epoch zero has not started.
   *
   * @return The number of seconds until the next epoch.
   */
  function getTimeRemainingInCurrentEpoch() public view returns (uint256) {
    (
      uint256 interval,
      uint256 offsetTimestamp
    ) = _getIntervalAndOffsetTimestamp();
    uint256 timeElapsedInEpoch = offsetTimestamp.mod(interval);
    return interval.sub(timeElapsedInEpoch);
  }

  /**
   * @notice Given an epoch number, get the start of that epoch. Calculated as `t = (n * a) + b`.
   *
   * @return The timestamp in seconds representing the start of that epoch.
   */
  function getStartOfEpoch(uint256 epochNumber) public view returns (uint256) {
    SMTypes.EpochParameters memory epochParameters = _EPOCH_PARAMETERS_;
    uint256 interval = uint256(epochParameters.interval);
    uint256 offset = uint256(epochParameters.offset);
    return epochNumber.mul(interval).add(offset);
  }

  /**
   * @notice Check whether we are at or past the start of epoch zero.
   *
   * @return Boolean `true` if the current timestamp is at least the start of epoch zero,
   *  otherwise `false`.
   */
  function hasEpochZeroStarted() public view returns (bool) {
    SMTypes.EpochParameters memory epochParameters = _EPOCH_PARAMETERS_;
    uint256 offset = uint256(epochParameters.offset);
    return block.timestamp >= offset;
  }

  /**
   * @notice Check whether we are in a blackout window, where withdrawal requests are restricted.
   *  Note that before epoch zero has started, there are no blackout windows.
   *
   * @return Boolean `true` if we are in a blackout window, otherwise `false`.
   */
  function inBlackoutWindow() public view returns (bool) {
    return
      hasEpochZeroStarted() &&
      getTimeRemainingInCurrentEpoch() <= _BLACKOUT_WINDOW_;
  }

  // ============ Internal Functions ============

  function _setEpochParameters(uint256 interval, uint256 offset) internal {
    SMTypes.EpochParameters memory epochParameters = SMTypes.EpochParameters({
      interval: interval.toUint128(),
      offset: offset.toUint128()
    });
    _EPOCH_PARAMETERS_ = epochParameters;
    emit EpochParametersChanged(epochParameters);
  }

  function _setBlackoutWindow(uint256 blackoutWindow) internal {
    _BLACKOUT_WINDOW_ = blackoutWindow;
    emit BlackoutWindowChanged(blackoutWindow);
  }

  // ============ Private Functions ============

  /**
   * @dev Helper function to read params from storage and apply offset to the given timestamp.
   *  Recall that the formula for epoch number is `n = (t - b) / a`.
   *
   *  NOTE: Reverts if epoch zero has not started.
   *
   * @return The values `a` and `(t - b)`.
   */
  function _getIntervalAndOffsetTimestamp()
    private
    view
    returns (uint256, uint256)
  {
    SMTypes.EpochParameters memory epochParameters = _EPOCH_PARAMETERS_;
    uint256 interval = uint256(epochParameters.interval);
    uint256 offset = uint256(epochParameters.offset);

    require(
      block.timestamp >= offset,
      "EpochSchedule: Epoch zero has not started"
    );

    uint256 offsetTimestamp = block.timestamp.sub(offset);
    return (interval, offsetTimestamp);
  }
}
