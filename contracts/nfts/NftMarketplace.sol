// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./extentions/MarketPlatform.sol";
import { IFactory } from "./NftFactory.sol";
import { IRoyalty } from "@thirdweb-dev/contracts/extension/interface/IRoyalty.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @author Yushaku
 * NFT MARKETPLACE
 * List NFT,
 * Buy NFT,
 * Offer NFT
 * Accept offer,
 * Create auction,
 * Bid place,
 * Support Royalty
 ***/
contract YuNftMarketplace is IMarketPlatform, Ownable, ReentrancyGuard {
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

  modifier isListedNFT(address _nft, uint256 _tokenId) {
    ListNFT memory listedNFT = listNfts[_nft][_tokenId];
    require(listedNFT.seller != address(0) && !listedNFT.sold, "not listed");
    _;
  }

  modifier isNotListedNFT(address _nft, uint256 _tokenId) {
    ListNFT memory listedNFT = listNfts[_nft][_tokenId];
    require(listedNFT.seller == address(0) || listedNFT.sold, "already listed");
    _;
  }

  modifier isAuction(address _nft, uint256 _tokenId) {
    AuctionNFT memory auction = auctionNfts[_nft][_tokenId];
    require(
      auction.nft != address(0) && !auction.success,
      "auction already created"
    );
    _;
  }

  modifier isNotAuction(address _nft, uint256 _tokenId) {
    AuctionNFT memory auction = auctionNfts[_nft][_tokenId];
    require(
      auction.nft == address(0) || auction.success,
      "auction already created"
    );
    _;
  }

  modifier isOfferredNFT(
    address _nft,
    uint256 _tokenId,
    address _offerer
  ) {
    OfferNFT memory offer = offerNfts[_nft][_tokenId][_offerer];
    require(
      offer.offerPrice > 0 && offer.offerer != address(0),
      "not offerred nft"
    );
    _;
  }

  modifier isPayableToken(address _payToken) {
    require(
      _payToken == nativeToken || payableToken[_payToken],
      "invalid pay token"
    );
    _;
  }

  // @notice List NFT on Marketplace
  function listNft(
    address _nft,
    uint256 _tokenId,
    address _payToken,
    uint256 _price
  ) external isPayableToken(_payToken) {
    IERC721 nft = IERC721(_nft);
    require(nft.ownerOf(_tokenId) == msg.sender, "not nft owner");
    nft.transferFrom(msg.sender, address(this), _tokenId);

    listNfts[_nft][_tokenId] = ListNFT({
      nft: _nft,
      tokenId: _tokenId,
      seller: msg.sender,
      payToken: _payToken,
      price: _price,
      sold: false
    });

    emit ListedNFT(_nft, _tokenId, _payToken, _price, msg.sender);
  }

  // @notice Cancel listed NFT
  function cancelListedNFT(
    address _nft,
    uint256 _tokenId
  ) external isListedNFT(_nft, _tokenId) {
    ListNFT memory listedNFT = listNfts[_nft][_tokenId];
    require(listedNFT.seller == msg.sender, "not listed owner");
    IERC721(_nft).transferFrom(address(this), msg.sender, _tokenId);
    delete listNfts[_nft][_tokenId];
  }

  function buyNFT(
    address _nft,
    uint256 _tokenId,
    address _payToken
  ) external isListedNFT(_nft, _tokenId) {
    ListNFT storage listedNft = listNfts[_nft][_tokenId];
    require(!listedNft.sold, "NFT already sold");
    require(_payToken == listedNft.payToken, "Not same pay token");

    listedNft.sold = true;

    uint256 totalPrice = listedNft.price;
    (address royaltyRecipient, uint256 royaltyFee) = getRoyalty(_nft);

    if (royaltyFee > 0) {
      uint256 royaltyTotal = calculateRoyalty(royaltyFee, listedNft.price);

      // Transfer royalty fee to collection owner
      IERC20(_payToken).transferFrom(
        msg.sender,
        royaltyRecipient,
        royaltyTotal
      );
      totalPrice -= royaltyTotal;
    }

    // Calculate & Transfer platfrom fee
    uint256 platformFeeTotal = calculatePlatformFee(listedNft.price);
    IERC20(_payToken).transferFrom(msg.sender, feeRecipient, platformFeeTotal);

    // Transfer to nft owner
    IERC20(_payToken).transferFrom(
      msg.sender,
      listedNft.seller,
      totalPrice - platformFeeTotal
    );

    // Transfer NFT to buyer
    IERC721(listedNft.nft).safeTransferFrom(
      address(this),
      msg.sender,
      listedNft.tokenId
    );

    emit BoughtNFT(
      listedNft.nft,
      listedNft.tokenId,
      listedNft.payToken,
      listedNft.price,
      listedNft.seller,
      msg.sender
    );
  }

  function buyNFT(
    address _nft,
    uint256 _tokenId
  ) external payable isListedNFT(_nft, _tokenId) {
    ListNFT storage listedNft = listNfts[_nft][_tokenId];
    require(!listedNft.sold, "NFT already sold");
    require(msg.value >= listedNft.price, "Insufficient payment");
    listedNft.sold = true;

    uint256 totalPrice = listedNft.price;
    (address royaltyRecipient, uint256 royaltyFee) = getRoyalty(_nft);

    if (royaltyFee > 0) {
      uint256 royaltyTotal = calculateRoyalty(royaltyFee, listedNft.price);

      // Transfer royalty fee to collection owner
      (bool sentRoyaty, ) = royaltyRecipient.call{ value: royaltyTotal }("");
      require(sentRoyaty, "Failed to send Ether");
      totalPrice -= royaltyTotal;
    }

    // Calculate & Transfer platfrom fee
    uint256 platformFeeTotal = calculatePlatformFee(listedNft.price);

    // Transfer to nft owner
    (bool sentSeller, ) = listedNft.seller.call{
      value: totalPrice - platformFeeTotal
    }("");
    require(sentSeller, "Failed to send Ether");

    // Transfer NFT to buyer
    IERC721(listedNft.nft).safeTransferFrom(
      address(this),
      msg.sender,
      listedNft.tokenId
    );

    emit BoughtNFT(
      listedNft.nft,
      listedNft.tokenId,
      listedNft.payToken,
      listedNft.price,
      listedNft.seller,
      msg.sender
    );
  }

  // @notice Offer listed NFT
  function offerNFT(
    address _nft,
    uint256 _tokenId,
    address _payToken,
    uint256 _offerPrice
  ) external payable isListedNFT(_nft, _tokenId) {
    require(_offerPrice > 0, "price can not 0");

    ListNFT memory nft = listNfts[_nft][_tokenId];
    if (nft.payToken == nativeToken) {
      require(msg.value >= _offerPrice, "Insufficient payment");
    } else {
      IERC20(nft.payToken).transferFrom(msg.sender, address(this), _offerPrice);
    }

    offererAddress[_nft][_tokenId].push(msg.sender);
    offerNfts[_nft][_tokenId][msg.sender] = OfferNFT({
      nft: nft.nft,
      tokenId: nft.tokenId,
      offerer: msg.sender,
      payToken: _payToken,
      offerPrice: _offerPrice,
      accepted: false
    });

    emit OfferredNFT(
      nft.nft,
      nft.tokenId,
      nft.payToken,
      _offerPrice,
      msg.sender
    );
  }

  // @notice Offerer cancel offerring
  function cancelOfferNFT(
    address _nft,
    uint256 _tokenId
  ) external isOfferredNFT(_nft, _tokenId, msg.sender) {
    OfferNFT memory offer = offerNfts[_nft][_tokenId][msg.sender];
    require(offer.offerer == msg.sender, "not offerer");
    require(!offer.accepted, "offer already accepted");

    delete offerNfts[_nft][_tokenId][msg.sender];
    address[] memory offerer = offererAddress[_nft][_tokenId];
    for (uint256 i = 0; i < offerer.length; i++) {
      if (offerer[i] == msg.sender) {
        delete offererAddress[_nft][_tokenId][i];
      }
    }

    if (offer.payToken == nativeToken) {
      (bool sent, ) = offer.offerer.call{ value: offer.offerPrice }("");
      require(sent, "Failed to send Ether");
    } else {
      IERC20(offer.payToken).transfer(offer.offerer, offer.offerPrice);
    }

    emit CanceledOfferredNFT(
      offer.nft,
      offer.tokenId,
      offer.payToken,
      offer.offerPrice,
      msg.sender
    );
  }

  // @notice listed NFT owner accept offerring
  function acceptOfferNFT(
    address _nft,
    uint256 _tokenId,
    address _offerer
  )
    external
    isOfferredNFT(_nft, _tokenId, _offerer)
    isListedNFT(_nft, _tokenId)
  {
    require(listNfts[_nft][_tokenId].seller == msg.sender, "not listed owner");

    OfferNFT storage offer = offerNfts[_nft][_tokenId][_offerer];
    ListNFT storage list = listNfts[offer.nft][offer.tokenId];
    require(!list.sold, "already sold");
    require(!offer.accepted, "offer already accepted");

    list.sold = true;
    offer.accepted = true;

    uint256 offerPrice = offer.offerPrice;
    uint256 totalPrice = offerPrice;

    if (nftFactory.isMakeByFactory(_nft)) {
      (address royaltyRecipient, uint256 royaltyFee) = IRoyalty(_nft)
        .getDefaultRoyaltyInfo();

      if (royaltyFee > 0) {
        uint256 royaltyTotal = calculateRoyalty(royaltyFee, offerPrice);
        if (offer.payToken == nativeToken) {
          (bool sentSeller, ) = list.seller.call{ value: royaltyTotal }("");
          require(sentSeller, "Failed to send Ether");
        } else {
          IERC20(offer.payToken).transfer(royaltyRecipient, royaltyTotal);
        }

        totalPrice -= royaltyTotal;
      }
    }

    uint256 sellerReceive = totalPrice - calculatePlatformFee(offerPrice);
    if (offer.payToken == nativeToken) {
      (bool sentSeller, ) = list.seller.call{ value: sellerReceive }("");
      require(sentSeller, "Failed to send Ether");
    } else {
      IERC20(offer.payToken).transfer(list.seller, sellerReceive);
    }

    // for (address offerUser of offerNfts[_nft][_tokenId]) {
    //     OfferNFT storage offer = offerNfts[_nft][_tokenId][offerUser];
    //     (bool sent, ) = offerUser.call{ value: offer.price }("");
    //     require(sent, "Failed to send token");
    // }

    // Transfer NFT to offerer
    IERC721(list.nft).safeTransferFrom(
      address(this),
      offer.offerer,
      list.tokenId
    );

    emit AcceptedNFT(
      offer.nft,
      offer.tokenId,
      offer.payToken,
      offer.offerPrice,
      offer.offerer,
      list.seller
    );
  }

  // @notice Create autcion
  function createAuction(
    address _nft,
    uint256 _tokenId,
    address _payToken,
    uint256 _price,
    uint256 _minBid,
    uint256 _startTime,
    uint256 _endTime
  ) external isPayableToken(_payToken) isNotAuction(_nft, _tokenId) {
    IERC721 nft = IERC721(_nft);
    require(nft.ownerOf(_tokenId) == msg.sender, "not nft owner");
    require(_endTime > _startTime, "invalid end time");

    nft.transferFrom(msg.sender, address(this), _tokenId);

    auctionNfts[_nft][_tokenId] = AuctionNFT({
      nft: _nft,
      tokenId: _tokenId,
      creator: msg.sender,
      payToken: _payToken,
      initialPrice: _price,
      minBid: _minBid,
      startTime: _startTime,
      endTime: _endTime,
      lastBidder: address(0),
      heighestBid: _price,
      winner: address(0),
      success: false
    });

    emit CreatedAuction(
      _nft,
      _tokenId,
      _payToken,
      _price,
      _minBid,
      _startTime,
      _endTime,
      msg.sender
    );
  }

  // @notice Cancel auction
  function cancelAuction(
    address _nft,
    uint256 _tokenId
  ) external isAuction(_nft, _tokenId) {
    AuctionNFT memory auction = auctionNfts[_nft][_tokenId];
    require(auction.creator == msg.sender, "not auction creator");
    require(block.timestamp < auction.startTime, "auction already started");
    require(auction.lastBidder == address(0), "already have bidder");

    IERC721 nft = IERC721(_nft);
    nft.transferFrom(address(this), msg.sender, _tokenId);
    delete auctionNfts[_nft][_tokenId];
  }

  // @notice Bid place auction
  function bidPlace(
    address _nft,
    uint256 _tokenId,
    uint256 _bidPrice
  ) external isAuction(_nft, _tokenId) {
    require(
      block.timestamp >= auctionNfts[_nft][_tokenId].startTime,
      "auction not start"
    );
    require(
      block.timestamp <= auctionNfts[_nft][_tokenId].endTime,
      "auction ended"
    );
    require(
      _bidPrice >=
        auctionNfts[_nft][_tokenId].heighestBid +
          auctionNfts[_nft][_tokenId].minBid,
      "less than min bid price"
    );

    AuctionNFT storage auction = auctionNfts[_nft][_tokenId];
    IERC20 payToken = IERC20(auction.payToken);
    payToken.transferFrom(msg.sender, address(this), _bidPrice);

    if (auction.lastBidder != address(0)) {
      address lastBidder = auction.lastBidder;
      uint256 lastBidPrice = auction.heighestBid;

      // Transfer back to last bidder
      payToken.transfer(lastBidder, lastBidPrice);
    }

    // Set new heighest bid price
    auction.lastBidder = msg.sender;
    auction.heighestBid = _bidPrice;

    emit PlacedBid(_nft, _tokenId, auction.payToken, _bidPrice, msg.sender);
  }

  // @notice Result auction, can call by auction creator, heighest bidder, or marketplace owner only!
  function resultAuction(address _nft, uint256 _tokenId) external {
    require(!auctionNfts[_nft][_tokenId].success, "already resulted");
    require(
      msg.sender == owner() ||
        msg.sender == auctionNfts[_nft][_tokenId].creator ||
        msg.sender == auctionNfts[_nft][_tokenId].lastBidder,
      "not creator, winner, or owner"
    );
    require(
      block.timestamp > auctionNfts[_nft][_tokenId].endTime,
      "auction not ended"
    );

    AuctionNFT storage auction = auctionNfts[_nft][_tokenId];
    IERC20 payToken = IERC20(auction.payToken);
    IERC721 nft = IERC721(auction.nft);

    auction.success = true;
    auction.winner = auction.creator;

    (address royaltyRecipient, uint256 royaltyFee) = getRoyalty(_nft);

    uint256 heighestBid = auction.heighestBid;
    uint256 totalPrice = heighestBid;

    if (royaltyFee > 0) {
      uint256 royaltyTotal = calculateRoyalty(royaltyFee, heighestBid);

      // Transfer royalty fee to collection owner
      payToken.transfer(royaltyRecipient, royaltyTotal);
      totalPrice -= royaltyTotal;
    }

    // Calculate & Transfer platfrom fee
    uint256 platformFeeTotal = calculatePlatformFee(heighestBid);
    payToken.transfer(feeRecipient, platformFeeTotal);

    // Transfer to auction creator
    payToken.transfer(auction.creator, totalPrice - platformFeeTotal);

    // Transfer NFT to the winner
    nft.transferFrom(address(this), auction.lastBidder, auction.tokenId);

    emit ResultedAuction(
      _nft,
      _tokenId,
      auction.creator,
      auction.lastBidder,
      auction.heighestBid,
      msg.sender
    );
  }

  // ----------------- UTILS FUNCTIONS --------------
  function calculatePlatformFee(uint256 _price) public view returns (uint256) {
    return (_price * platformFee) / 10000;
  }

  function calculateRoyalty(
    uint256 _royalty,
    uint256 _price
  ) public pure returns (uint256) {
    return (_price * _royalty) / 10000;
  }

  function getListedNFT(
    address _nft,
    uint256 _tokenId
  ) external view returns (ListNFT memory) {
    return listNfts[_nft][_tokenId];
  }

  function getPayableTokens() external view returns (address[] memory) {
    return tokens;
  }

  function checkIsPayableToken(
    address _payableToken
  ) external view returns (bool) {
    return payableToken[_payableToken];
  }

  function addPayableToken(address _token) external onlyOwner {
    require(_token != address(0), "invalid token");
    require(!payableToken[_token], "already payable token");
    payableToken[_token] = true;
    tokens.push(_token);
  }

  function updatePlatformFee(uint256 _platformFee) external onlyOwner {
    require(_platformFee <= 10000, "can't more than 10 percent");
    platformFee = _platformFee;
  }

  function changeFeeRecipient(address _feeRecipient) external onlyOwner {
    require(_feeRecipient != address(0), "can't be 0 address");
    feeRecipient = _feeRecipient;
  }

  function getRoyalty(address _nft) internal view returns (address, uint256) {
    address royaltyRecipient = address(0);
    uint256 royaltyFee = 0;

    if (nftFactory.isMakeByFactory(_nft)) {
      (royaltyRecipient, royaltyFee) = IRoyalty(_nft).getDefaultRoyaltyInfo();
    }

    return (royaltyRecipient, royaltyFee);
  }

  function removeNftOffer(
    address _nft,
    uint256 _tokenId,
    address _offerer
  ) internal {
    address[] memory offerer = offererAddress[_nft][_tokenId];
    uint256 userIndex = 0;
    for (uint256 i = 0; i < offerer.length; i++) {
      if (offerer[i] == _offerer) {
        userIndex = i;
      }
    }

    delete offererAddress[_nft][_tokenId][userIndex];
  }
}
