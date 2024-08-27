// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IFactory } from "../interfaces/IFactory.sol";

struct ListNFT {
  address nft;
  uint256 tokenId;
  address seller;
  address payToken;
  uint256 price;
  bool sold;
}

struct OfferNFT {
  address nft;
  uint256 tokenId;
  address offerer;
  address payToken;
  uint256 offerPrice;
  bool accepted;
}

struct AuctionNFT {
  address nft;
  uint256 tokenId;
  address creator;
  address payToken;
  uint256 initialPrice;
  uint256 minBid;
  uint256 startTime;
  uint256 endTime;
  address lastBidder;
  uint256 heighestBid;
  address winner;
  bool success;
}

abstract contract MKStorage {
  IFactory private immutable nftFactory;
  uint256 private platformFee;
  address private feeRecipient;

  address[] private tokens;
  address constant nativeToken = address(0);
  mapping(address => bool) private payableToken;

  // nft => tokenId => list struct
  mapping(address => mapping(uint256 => ListNFT)) private listNfts;

  // nft => tokenId => offerer address => offer struct
  // prettier-ignore
  mapping(address => mapping(uint256 => mapping(address => OfferNFT))) private offerNfts;
  mapping(address => mapping(uint256 => address[])) private offererAddress;

  // nft => tokenId => acuton struct
  mapping(address => mapping(uint256 => AuctionNFT)) private auctionNfts;

  // auciton index => bidding counts => bidder address => bid price
  // prettier-ignore
  mapping(uint256 => mapping(uint256 => mapping(address => uint256))) private bidPrices;

  constructor(
    uint256 _platformFee,
    address _feeRecipient,
    IFactory _nftFactory
  ) {
    require(_platformFee <= 10_000, "can't more than 10 percent");
    platformFee = _platformFee;
    feeRecipient = _feeRecipient;
    nftFactory = _nftFactory;
  }
}
