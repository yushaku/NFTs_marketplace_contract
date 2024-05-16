//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMarketPlatform {
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

  // events
  event ListedNFT(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 price,
    address indexed seller
  );

  event BoughtNFT(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 price,
    address seller,
    address indexed buyer
  );

  event OfferredNFT(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 offerPrice,
    address indexed offerer
  );

  event CanceledOfferredNFT(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 offerPrice,
    address indexed offerer
  );

  event AcceptedNFT(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 offerPrice,
    address offerer,
    address indexed nftOwner
  );

  event CreatedAuction(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 price,
    uint256 minBid,
    uint256 startTime,
    uint256 endTime,
    address indexed creator
  );

  event PlacedBid(
    address indexed nft,
    uint256 indexed tokenId,
    address payToken,
    uint256 bidPrice,
    address indexed bidder
  );

  event ResultedAuction(
    address indexed nft,
    uint256 indexed tokenId,
    address creator,
    address indexed winner,
    uint256 price,
    address caller
  );

  //prettier-ignore
  function listNft(address _nft, uint256 _tokenId, address _payToken, uint256 _price) external;

  function cancelListedNFT(address _nft, uint256 _tokenId) external;

  //prettier-ignore
  function buyNFT(address _nft, uint256 _tokenId, address _payToken) external;

  //prettier-ignore
  function buyNFT(address _nft, uint256 _tokenId) payable external;

  //prettier-ignore
  function offerNFT(address _nft, uint256 _tokenId, address _payToken, uint256 _offerPrice) payable external;

  function cancelOfferNFT(address _nft, uint256 _tokenId) external;

  //prettier-ignore
  function acceptOfferNFT(address _nft, uint256 _tokenId, address _offerer) external;

  function createAuction(
    address _nft,
    uint256 _tokenId,
    address _payToken,
    uint256 _price,
    uint256 _minBid,
    uint256 _startTime,
    uint256 _endTime
  ) external;

  function cancelAuction(address _nft, uint256 _tokenId) external;

  function bidPlace(address _nft, uint256 _tokenId, uint256 _bidPrice) external;

  function resultAuction(address _nft, uint256 _tokenId) external;
}
