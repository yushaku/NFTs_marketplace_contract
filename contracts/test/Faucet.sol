// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetToken is Ownable {
  using SafeERC20 for IERC20Metadata;

  uint256 public waitTime;
  mapping(address => uint256) public lastRequestTime;
  mapping(address => bool) public allowedToken;
  mapping(address => uint256) public faucetAmounts;
  address[] public tokens;

  event FaucetRequest(address indexed user, uint256 amount);

  constructor(uint256 _waitTime) Ownable(msg.sender) {
    waitTime = _waitTime;
  }

  function setWaitTime(uint256 _waitTime) external onlyOwner {
    waitTime = _waitTime;
  }

  function setFaucetAmount(address token, uint256 amount) external onlyOwner {
    require(allowedToken[token], "invalid token");
    faucetAmounts[token] = amount;
  }

  function toggleToken(address newtoken) external onlyOwner {
    for (uint256 index = 0; index < tokens.length; index++) {
      require(tokens[index] != newtoken, "allready added");
    }

    bool status = allowedToken[newtoken];
    allowedToken[newtoken] = !status;
  }

  function addToken(address token, uint256 amount) external onlyOwner {
    allowedToken[token] = true;
    tokens.push(token);
    faucetAmounts[token] = amount;
  }

  function requestTokens() external {
    require(
      block.timestamp >= lastRequestTime[msg.sender] + waitTime,
      "Wait time has not passed"
    );
    lastRequestTime[msg.sender] = block.timestamp;

    for (uint256 index = 0; index < tokens.length; index++) {
      uint256 faucetAmount = faucetAmounts[tokens[index]];
      IERC20Metadata token = IERC20Metadata(tokens[index]);
      if (!allowedToken[tokens[index]]) continue;
      if (token.balanceOf(address(this)) < faucetAmount) continue;

      token.safeTransfer(msg.sender, faucetAmount);
      emit FaucetRequest(msg.sender, faucetAmount);
    }
  }

  function fundFaucet(address token, uint256 amount) external {
    require(amount > 0, "Amount must be greater than 0");
    require(allowedToken[token], "Token not found");

    IERC20Metadata(token).safeTransferFrom(msg.sender, address(this), amount);
  }
}
