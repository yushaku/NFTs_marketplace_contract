import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { MaxUint256, Signer } from "ethers";
import { ethers } from "hardhat";
import { before } from "mocha";
import {
  NFTCollection,
  NFTCollection__factory,
  NftFactory,
  NftFactory__factory,
  USDT,
  USDT__factory,
  YuNftMarketplace,
  YuNftMarketplace__factory,
} from "../typechain";
import { toWei } from "./helper";

describe("Yushaku Marketplace", () => {
  let nft: NFTCollection;
  let factory: NftFactory;
  let marketplace: YuNftMarketplace;
  let owner: Signer;
  let creator: Signer;
  let buyer: Signer;
  let offerer: Signer;
  let bidder: Signer;
  let payableToken: USDT;

  let marketplaceAddress: string;
  let nftAddress: string;
  let nftFactoryAddress: string;
  let uAddress: string;
  let buyerAddress: string;
  let creatorAddress: string;
  let offererAddress: string;

  before(async () => {
    [owner, creator, buyer, offerer, bidder] = await ethers.getSigners();
    factory = await new NftFactory__factory(owner).deploy();
    nftFactoryAddress = await factory.getAddress();
    expect(nftFactoryAddress).not.eq(null, "Deploy factory is failed.");

    const Marketplace = new YuNftMarketplace__factory(owner);
    const platformFee = 10n; // 10%
    const feeRecipient = await owner.getAddress();
    marketplace = await Marketplace.deploy(
      platformFee,
      feeRecipient,
      nftFactoryAddress,
    );
    marketplaceAddress = await marketplace.getAddress();

    payableToken = (await new USDT__factory(owner).deploy()) as USDT;
    uAddress = await payableToken.getAddress();
    payableToken
      .connect(owner)
      .mint(await owner.getAddress(), toWei(1_000_000));
    expect(uAddress).not.eq(null, "Deploy test payable token is failed.");

    await marketplace.connect(owner).addPayableToken(uAddress);
    expect(
      await marketplace.checkIsPayableToken(uAddress),
      "Add payable token is failed.",
    ).to.true;

    // Transfer payable token to tester
    creatorAddress = await creator.getAddress();
    buyerAddress = await buyer.getAddress();
    offererAddress = await offerer.getAddress();
    await payableToken.connect(owner).transfer(buyerAddress, toWei(1000000));
    expect(await payableToken.balanceOf(buyerAddress)).to.eq(toWei(1000000));

    await payableToken.connect(owner).transfer(offererAddress, toWei(1000000));
    expect(await payableToken.balanceOf(offererAddress)).to.eq(toWei(1000000));

    const tx = await factory
      .connect(creator)
      .create("Yushaku Collection", "Yushaku", 10);
    await tx.wait();
    const list = await factory.list(creator);

    const collectionAddress = list[0];
    nft = new NFTCollection__factory(owner).attach(
      collectionAddress,
    ) as NFTCollection;
    nftAddress = await nft.getAddress();
    expect(nftAddress).not.eq(null, "Create collection is failed.");
  });

  describe("--- LIST AND BUY WITH YSK TOKEN ---", () => {
    const tokenId = 0;

    it("Creator should mint NFT", async () => {
      const to = await creator.getAddress();
      const uri = "Yushaku.io";
      await nft.connect(creator).mintTo(to, uri);

      expect(await nft.ownerOf(tokenId)).to.eq(to);
    });

    it("Creator should list NFT on the marketplace", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);

      expect(
        marketplace
          .connect(creator)
          .listNft(nftAddress, tokenId, uAddress, toWei(100000)),
      )
        .to.emit(marketplace, "ListedNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(100000),
          await creator.getAddress(),
        ]);
    });

    it("Creator should cancel listed item", async () => {
      await marketplace.connect(creator).cancelListedNFT(nftAddress, tokenId);
      expect(await nft.ownerOf(tokenId)).eq(
        await creator.getAddress(),
        "Cancel listed item is failed.",
      );
    });

    it("Creator should list NFT on the marketplace again!", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);

      expect(
        marketplace
          .connect(creator)
          .listNft(nftAddress, tokenId, uAddress, toWei(100000)),
      )
        .to.emit(marketplace, "ListedNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(100000),
          creatorAddress,
        ]);
    });

    it("Buyer should buy listed NFT", async () => {
      await payableToken.connect(buyer).approve(marketplaceAddress, MaxUint256);
      expect(
        await marketplace
          .connect(buyer)
          ["buyNFT(address,uint256,address)"](nftAddress, tokenId, uAddress),
      )
        .to.emit(marketplace, "BoughtNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(100000),
          creatorAddress,
          buyerAddress,
        ]);

      expect(await nft.ownerOf(tokenId)).eq(buyerAddress);
    });
  });

  describe("LIST, OFFER, AND ACCEPT OFFER WITH YSK TOKEN", () => {
    const offerPrice = 1000;
    const tokenId = 1;

    it("Creator should mint NFT", async () => {
      const uri = "Yushaku.io";
      await nft.connect(creator).mintTo(creatorAddress, uri);
      expect(await nft.ownerOf(tokenId)).to.eq(creatorAddress);
    });

    it("Creator should list NFT on the marketplace", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);

      expect(
        marketplace
          .connect(creator)
          .listNft(nftAddress, tokenId, uAddress, toWei(100000)),
      )
        .to.emit(marketplace, "ListedNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(100000),
          creatorAddress,
        ]);
    });

    it("Buyer should offer NFT", async () => {
      await payableToken.connect(buyer).approve(marketplaceAddress, MaxUint256);

      expect(
        await marketplace
          .connect(buyer)
          .offerNFT(nftAddress, tokenId, uAddress, toWei(offerPrice)),
      )
        .to.emit(marketplace, "OfferredNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(offerPrice),
          buyerAddress,
        ]);
    });

    it("Buyer should cancel offer", async () => {
      expect(
        await marketplace.connect(buyer).cancelOfferNFT(nftAddress, tokenId),
      )
        .to.emit(marketplace, "CanceledOfferredNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(offerPrice),
          creatorAddress,
        ]);

      expect(await nft.ownerOf(tokenId)).to.eq(marketplaceAddress);
    });

    it("Offerer should offer NFT", async () => {
      await payableToken
        .connect(offerer)
        .approve(marketplaceAddress, MaxUint256);

      expect(
        await marketplace
          .connect(offerer)
          .offerNFT(nftAddress, tokenId, uAddress, toWei(offerPrice)),
      )
        .to.emit(marketplace, "OfferredNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(offerPrice),
          offererAddress,
        ]);
    });

    it("Creator should accept offer", async () => {
      expect(
        await marketplace
          .connect(creator)
          .acceptOfferNFT(nftAddress, tokenId, offererAddress),
      )
        .to.emit(marketplace, "AcceptedNFT")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(offerPrice),
          offererAddress,
          creatorAddress,
        ]);

      expect(await nft.ownerOf(tokenId)).eq(offererAddress);
    });
  });

  describe("CREATE AUCTION, BID PLACE, AND RESULT AUCTION", async () => {
    const tokenId = 2;
    const price = 10000;
    const minBid = 500;
    const day = 24 * 60 * 60;
    const startTime = Date.now(); // a day
    const endTime = Date.now() + 60 * 60 * 24 * 7; // 7 days

    it("Creator should mint NFT", async () => {
      const uri = "Yushaku.io";
      await nft.connect(creator).mintTo(creatorAddress, uri);
      expect(await nft.ownerOf(tokenId)).to.eq(creatorAddress);
    });

    it("Creator should create auction", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);
      expect(
        await marketplace
          .connect(creator)
          .createAuction(
            nftAddress,
            tokenId,
            uAddress,
            toWei(price),
            toWei(minBid),
            BigInt(startTime),
            BigInt(endTime),
          ),
      )
        .to.emit(marketplace, "CreatedAuction")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(price),
          toWei(minBid),
          BigInt(startTime),
          BigInt(endTime),
          creatorAddress,
        ]);

      expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
    });

    it("Creator should cancel auction", async () => {
      expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
      await marketplace.connect(creator).cancelAuction(nftAddress, tokenId);
      expect(await nft.ownerOf(tokenId)).eq(creatorAddress);
    });

    it("Creator should create auction again", async () => {
      const startTime = Date.now() - 100000; // a day

      await nft.connect(creator).approve(marketplaceAddress, tokenId);
      expect(
        await marketplace
          .connect(creator)
          .createAuction(
            nftAddress,
            tokenId,
            uAddress,
            toWei(price),
            toWei(minBid),
            BigInt(1714081570),
            BigInt(endTime),
          ),
      )
        .to.emit(marketplace, "CreatedAuction")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(price),
          toWei(minBid),
          BigInt(startTime),
          BigInt(endTime),
          creatorAddress,
        ]);

      expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
    });

    it("Buyer should bid place", async () => {
      await time.increase(360_000);
      await ethers.provider.send("evm_increaseTime", [360_000]);

      const bidPrice = 10500;
      await payableToken.connect(buyer).approve(marketplaceAddress, MaxUint256);
      expect(
        await marketplace
          .connect(buyer)
          .bidPlace(nftAddress, tokenId, toWei(bidPrice)),
      )
        .to.emit(marketplace, "PlacedBid")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(bidPrice),
          buyerAddress,
        ]);
    });

    it("Offerer should bid place", async () => {
      await time.increase(360_000);
      const bidPrice = 11000;
      await payableToken
        .connect(offerer)
        .approve(marketplaceAddress, MaxUint256);

      expect(
        await marketplace
          .connect(buyer)
          .bidPlace(nftAddress, tokenId, toWei(bidPrice)),
      )
        .to.emit(marketplace, "PlacedBid")
        .withArgs([
          nftAddress,
          tokenId,
          uAddress,
          toWei(bidPrice),
          offererAddress,
        ]);
    });

    it("Marketplace owner should call result auction", async () => {
      await time.increase(endTime);

      expect(
        await marketplace.connect(owner).resultAuction(nftAddress, tokenId),
      )
        .to.emit(marketplace, "ResultedAuction")
        .withArgs([nftAddress, tokenId, creatorAddress]);
    });
  });
});
