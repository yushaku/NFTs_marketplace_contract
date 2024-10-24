// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ShopPayment.sol";

contract ShopPaymentV2 is ShopPayment {
  struct ExtendedOrder {
    Order baseOrder; // Use the original Order struct from ShopPayment
    address token; // New field in the extended struct
  }

  address public constant NATIVE_TOKEN = address(0);
  mapping(string => ExtendedOrder) private orderList;
  mapping(address => bool) private payableToken;

  event OrderPaied(
    string orderId,
    address indexed buyer,
    uint256 price,
    address token
  );

  function initializeV2(address ercToken) public reinitializer(2) {
    payableToken[ercToken] = true;
  }

  modifier isPayableToken(address _payToken) {
    require(
      _payToken == NATIVE_TOKEN || payableToken[_payToken],
      "invalid pay token"
    );
    _;
  }

  // MARK: ADMIN FUNCTIONS
  function createAndPayOrder(
    string calldata _orderId,
    uint256 _price,
    address _token
  ) external payable nonReentrant isPayableToken(_token) {
    require(bytes(_orderId).length > 0, "Order ID cannot be empty");
    require(_price > 0, "Price must be greater than zero");

    // Create the base order using the original Order struct
    Order memory baseOrder = Order({
      orderId: _orderId,
      buyer: msg.sender,
      price: _price,
      status: Status.PAID,
      createdAt: block.timestamp
    });

    // Use the extended struct with additional fields
    ExtendedOrder memory newOrder = ExtendedOrder({
      baseOrder: baseOrder,
      token: _token
    });

    orderList[_orderId] = newOrder;

    emit OrderPaied(_orderId, msg.sender, _price, _token);
  }

  // MARK: ADMIN FUNCTIONS
  function addPayableToken(address _token) external onlyOwner {
    require(_token != address(0), "invalid token");
    require(!payableToken[_token], "already payable token");
    payableToken[_token] = true;
  }

  function disableToken(address _token) external onlyOwner {
    require(_token != address(0), "invalid token");
    require(payableToken[_token] == true, "token not found");
    payableToken[_token] = false;
  }
}
