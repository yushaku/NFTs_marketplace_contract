// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @author yushaku
/// @title ShopPayment
/// @title ShopPayment - Upgradeable Smart Contract for E-commerce Payments
/// @notice This contract allows users to create and pay for orders in a single step,
/// cancel orders before 3 days with a 1% fee, mark orders as delivered, and enables the owner to withdraw funds from delivered orders.

enum Status {
  PAID,
  DELIVERED,
  CANCELLED
}

struct Order {
  string orderId;
  address buyer;
  uint256 price;
  Status status;
  uint256 createdAt;
}

// prettier-ignore
contract ShopPayment is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  mapping(string => Order) internal orders;
  mapping(address => string[]) internal userOrders;

  uint256 public totalWithdrawable;

  // [OPTIONAL] Add a storage gap to allow future versions to add new variables without shifting storage
  uint256[50] private __gap;

  event OrderCreated(string orderId, address indexed buyer, uint256 price);
  event OrderPaid(string orderId, address indexed buyer, uint256 price);
  event OrderCancelled(string orderId, uint256 refundAmount, uint256 feeAmount);
  event OrderDelivered(string orderId);
  event Withdrawn(uint256 amount);

  /// @notice Initializer function (replaces constructor for upgradeable contracts)
  function initialize() public initializer {
    __Ownable_init(msg.sender); // Initialize Ownable
    __ReentrancyGuard_init(); // Initialize ReentrancyGuard
    __UUPSUpgradeable_init(); // Initialize UUPSUpgradeable
  }

  /// @notice Required by UUPSUpgradeable to authorize upgrades
  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  /// @notice create a new order
  /// @param _orderId uuid of order
  /// @param _price price of order
  function createAndPayOrder(
    string calldata _orderId,
    uint256 _price
  ) external payable virtual nonReentrant {
    require(bytes(_orderId).length > 0, "Order ID cannot be empty");
    require(_price > 0, "Price must be greater than zero");
    require(orders[_orderId].buyer == address(0), "Order ID already exists");
    require(msg.value == _price, "Incorrect payment amount");

    Order memory newOrder = Order({
      orderId: _orderId,
      buyer: msg.sender,
      price: _price,
      status: Status.PAID,
      createdAt: block.timestamp
    });

    orders[_orderId] = newOrder;
    userOrders[msg.sender].push(_orderId);

    emit OrderCreated(_orderId, msg.sender, _price);
  }

  /// @notice cancel the order
  /// @param _orderId id of cancel order
  function cancelOrder(string calldata _orderId) external nonReentrant {
    Order storage order = orders[_orderId];
    require(order.buyer != address(0), "Order does not exist");
    require(
      msg.sender == order.buyer,
      "Only the buyer or owner can cancel the order"
    );
    require(order.status == Status.PAID, "Only PAID orders can be cancelled");
    require(
      block.timestamp <= order.createdAt + 3 days,
      "Can only cancel before 3 days"
    );

    uint256 refundAmount = (order.price * 99) / 100;
    uint256 feeAmount = order.price - refundAmount;

    // refund to the user
    (bool success, ) = order.buyer.call{ value: refundAmount }("");
    require(success, "Refund failed");
    order.status = Status.CANCELLED;

    emit OrderCancelled(_orderId, refundAmount, feeAmount);
  }

  /// @notice Chuyển trạng thái đơn hàng sang Delivered
  /// @param _orderId Mã đơn hàng cần chuyển trạng thái
  function deliverOrder(string calldata _orderId) external onlyOwner {
    Order storage order = orders[_orderId];
    require(order.buyer != address(0), "Order does not exist");
    require(order.status == Status.PAID, "Only PAID orders can be delivered");

    order.status = Status.DELIVERED;
    totalWithdrawable += order.price;

    emit OrderDelivered(_orderId);
  }

  /// @notice Withdrawn all token
  function withdrawAll() external onlyOwner nonReentrant {
    require(totalWithdrawable > 0, "No funds available for withdrawal");

    uint256 amount = totalWithdrawable;
    totalWithdrawable = 0;

    (bool success, ) = owner().call{ value: amount }("");
    require(success, "Transfer failed.");

    emit Withdrawn(amount);
  }

  /// @notice get order info
  /// @param _orderId id of the order
  /// @return Order info
  function getOrder(
    string calldata _orderId
  ) external view returns (Order memory) {
    Order memory order = orders[_orderId];
    require(order.buyer != address(0), "Order does not exist");
    return order;
  }

  /// @notice get list of order of user
  /// @param _buyer address of user
  /// @return string[] list of order id
  function getUserOrders(
    address _buyer
  ) external view returns (string[] memory) {
    return userOrders[_buyer];
  }
}
