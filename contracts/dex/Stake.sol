// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/YSK.sol";

contract YuStaking is Ownable {
  uint256 constant secondsPerYear = 365 days;
  uint256[] public baseLockTerms = [0 days, 90 days, 180 days];
  uint256[] public baseAPYs = [5, 15, 30];

  address public token;
  uint256 public totalStakedAmount;

  Yushaku public yuToken = Yushaku(token);

  struct UserInfo {
    uint256 stakeAmount;
    uint256 stakeTime;
    uint256 lockEndTime;
    uint256 claimedAmount;
    uint8 lockType;
  }

  mapping(address => UserInfo[]) public userStakeInfo;

  event Stake(address user, uint256 lockType, uint256 stakeAmount);

  event Withdraw(address user, uint256 withdrawAmount, uint256 rewardAmount);

  event Claim(address user, uint256 claimAmount);

  event ReStake(address user, uint256 lockType, uint256 amount);

  constructor(address _token) {
    token = _token;
  }

  function stake(uint256 _amount, uint8 _lockType) external {
    require(_amount > 0, "lock: amount have to greater than 0");
    require(_lockType < 3, "lock: lock type should be less than 3");

    userStakeInfo[msg.sender].push(
      UserInfo({
        stakeAmount: _amount,
        stakeTime: block.timestamp,
        lockEndTime: block.timestamp + baseLockTerms[_lockType],
        claimedAmount: 0,
        lockType: _lockType
      })
    );

    totalStakedAmount += _amount;

    yuToken.transferFrom(msg.sender, address(this), _amount);
    emit Stake(msg.sender, _lockType, _amount);
  }

  function pendingReward(
    address _user,
    uint8 _index,
    uint256 _amount
  ) public view returns (uint256) {
    if (userStakeInfo[_user].length > _index) {
      uint256 rewardAmount = 0;
      UserInfo storage user = userStakeInfo[_user][_index];
      uint256 currentTime = block.timestamp;
      uint256 amount = _amount > 0 ? _amount : user.stakeAmount;

      if (currentTime > user.lockEndTime && user.lockType > 0) {
        rewardAmount = (amount * baseAPYs[user.lockType]) / 100;
        rewardAmount +=
          (amount * (currentTime - user.lockEndTime) * baseAPYs[0]) /
          (secondsPerYear * 100);
      } else {
        rewardAmount =
          (amount * (currentTime - user.stakeTime) * baseAPYs[user.lockType]) /
          (secondsPerYear * 100);
      }
      if (rewardAmount > user.claimedAmount)
        return rewardAmount - user.claimedAmount;
    }
    return 0;
  }

  function withdraw(uint256 _amount, uint8 _index) external {
    require(_amount > 0, "withdraw: amount is 0");
    require(
      userStakeInfo[msg.sender].length > _index,
      "withdraw: invalid index"
    );

    UserInfo storage user = userStakeInfo[msg.sender][_index];
    require(
      user.lockEndTime <= block.timestamp,
      "withdraw: lock term not ended yet"
    );

    require(
      user.stakeAmount >= _amount,
      "withdraw: withdraw amount should be less than stake amount"
    );

    uint256 pending = pendingReward(msg.sender, _index, _amount);

    user.stakeAmount -= _amount;
    totalStakedAmount -= _amount;
    yuToken.transfer(msg.sender, _amount);
    if (pending > 0) {
      yuToken.mint(msg.sender, pending);
      user.claimedAmount += pending;
    }

    emit Withdraw(msg.sender, _amount, pending);
  }

  function claim(uint8 _index) external {
    require(userStakeInfo[msg.sender].length > _index, "claim: invalid index");

    UserInfo storage user = userStakeInfo[msg.sender][_index];

    uint256 pending = pendingReward(msg.sender, _index, 0);

    if (pending > 0) {
      yuToken.mint(msg.sender, pending);
      user.claimedAmount += pending;
    }

    emit Claim(msg.sender, pending);
  }

  function restake(uint8 _index) external {
    require(
      userStakeInfo[msg.sender].length > _index,
      "restake: invalid index"
    );

    UserInfo storage user = userStakeInfo[msg.sender][_index];
    require(
      user.lockEndTime <= block.timestamp,
      "restake: lock term not ended yet"
    );
    require(user.stakeAmount > 0, "restake: staked amount is 0");

    uint256 pending = pendingReward(msg.sender, _index, 0);

    if (pending > 0) {
      yuToken.mint(msg.sender, pending);
    }

    user.stakeTime = block.timestamp;
    user.lockEndTime = block.timestamp + baseLockTerms[user.lockType];

    emit ReStake(msg.sender, user.lockType, user.stakeAmount);
  }

  function userStakeCount(address _user) external view returns (uint256) {
    return userStakeInfo[_user].length;
  }

  function userStakeData(
    address _user
  ) external view returns (UserInfo[] memory) {
    return userStakeInfo[_user];
  }

  function setToken(address _token) external onlyOwner {
    token = _token;
  }
}
