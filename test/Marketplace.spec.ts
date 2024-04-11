import { expect } from "chai";
import { Signer, parseEther } from "ethers";
import { ethers } from "hardhat";
import { before } from "mocha";
import {
  IERC20,
  NFTCollectible__factory,
  NFTCollection,
  NftFactory,
  NftFactory__factory,
  USDT,
  USDT__factory,
  YuNftMarketplace,
  YuNftMarketplace__factory,
} from "../typechain";

function toWei(value: number) {
  return parseEther(value.toString());
}

describe("Yushaku Marketplace", () => {
  let nft: NFTCollection;
  let factory: NftFactory;
  let marketplace: YuNftMarketplace;
  let owner: Signer;
  let creator: Signer;
  let buyer: Signer;
  let offerer: Signer;
  let bidder: Signer;
  let payableToken: IERC20;

  let marketplaceAddress: string;
  let nftAddress: string;
  let nftFactoryAddress: string;
  let uAddress: string;

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

    const payableToken = (await new USDT__factory(owner).deploy()) as USDT;
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
    const buyerAddress = await buyer.getAddress();
    const offererAddress = await offerer.getAddress();
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
    nft = new NFTCollectible__factory(owner).attach(
      collectionAddress,
    ) as NFTCollection;
    nftAddress = await nft.getAddress();
    expect(nftAddress).not.eq(null, "Create collection is failed.");
  });

  describe("List and Buy", () => {
    const tokenId = 0;

    it("Creator should mint NFT", async () => {
      const to = await creator.getAddress();
      const uri = "Yushaku.io";
      await nft.connect(creator).mintTo(to, uri);
      console.log(await nft.ownerOf(tokenId));

      expect(await nft.ownerOf(tokenId)).to.eq(to, "Mint NFT is failed.");
    });

    it("Creator should list NFT on the marketplace", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);

      const tx = await marketplace
        .connect(creator)
        .listNft(nftAddress, tokenId, uAddress, toWei(100000));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "ListedNFT",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      expect(eventNFT).eq(nftAddress, "NFT is wrong.");
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
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

      const tx = await marketplace
        .connect(creator)
        .listNft(nftAddress, tokenId, uAddress, toWei(100000));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "ListedNFT",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      expect(eventNFT).eq(nftAddress, "NFT is wrong.");
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Buyer should buy listed NFT", async () => {
      const tokenId = 0;
      const buyPrice = 100001;
      await payableToken
        .connect(buyer)
        .approve(marketplaceAddress, toWei(buyPrice));
      await marketplace
        .connect(buyer)
        .buyNFT(nftAddress, tokenId, uAddress, toWei(buyPrice));
      expect(await nft.ownerOf(tokenId)).eq(
        await buyer.getAddress(),
        "Buy NFT is failed.",
      );
    });
  });

  describe("List, Offer, and Accept Offer", () => {
    const tokenId = 1;
    it("Creator should mint NFT", async () => {
      const to = await creator.getAddress();
      const uri = "Yushaku.io";
      await nft.connect(creator).mintTo(to, uri);
      expect(await nft.ownerOf(tokenId)).to.eq(to, "Mint NFT is failed.");
    });

    it("Creator should list NFT on the marketplace", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);

      const tx = await marketplace
        .connect(creator)
        .listNft(nftAddress, tokenId, uAddress, toWei(100000));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "ListedNFT",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      expect(eventNFT).eq(nftAddress, "NFT is wrong.");
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Buyer should offer NFT", async () => {
      const offerPrice = 1000;
      await payableToken
        .connect(buyer)
        .approve(marketplaceAddress, toWei(offerPrice));
      const tx = await marketplace
        .connect(buyer)
        .offerNFT(nftAddress, tokenId, uAddress, toWei(offerPrice));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "OfferredNFT",
      ) as any;
      const eventOfferer = events[0].args.offerer;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      expect(eventOfferer).eq(
        await buyer.getAddress(),
        "Offerer address is wrong.",
      );
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Buyer should cancel offer", async () => {
      const tx = await marketplace
        .connect(buyer)
        .cancelOfferNFT(nftAddress, tokenId);
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "CanceledOfferredNFT",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      const eventOfferer = events[0].args.offerer;
      expect(eventOfferer).eq(
        await buyer.getAddress(),
        "Offerer address is wrong.",
      );
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Offerer should offer NFT", async () => {
      const offerPrice = 1000;
      await payableToken
        .connect(offerer)
        .approve(marketplaceAddress, toWei(offerPrice));
      const tx = await marketplace
        .connect(offerer)
        .offerNFT(nftAddress, tokenId, uAddress, toWei(offerPrice));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "OfferredNFT",
      ) as any;
      const eventOfferer = events[0].args.offerer;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      expect(eventOfferer).eq(
        await offerer.getAddress(),
        "Offerer address is wrong.",
      );
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Creator should accept offer", async () => {
      await marketplace
        .connect(creator)
        .acceptOfferNFT(nftAddress, tokenId, await offerer.getAddress());
      expect(await nft.ownerOf(tokenId)).eq(await offerer.getAddress());
    });
  });

  describe("Create Auction, bid place, and Result auction", async () => {
    const tokenId = 2;
    it("Creator should mint NFT", async () => {
      const to = await creator.getAddress();
      const uri = "Yushaku.io";
      await nft.connect(creator).mintTo(to, uri);
      expect(await nft.ownerOf(tokenId)).to.eq(to, "Mint NFT is failed.");
    });

    it("Creator should create auction", async () => {
      const price = 10000;
      const minBid = 500;
      const startTime = Date.now() + 60 * 60 * 24; // a day
      const endTime = Date.now() + 60 * 60 * 24 * 7; // 7 days
      await nft.connect(creator).approve(marketplaceAddress, tokenId);
      const tx = await marketplace
        .connect(creator)
        .createAuction(
          nftAddress,
          tokenId,
          uAddress,
          toWei(price),
          toWei(minBid),
          BigInt(startTime),
          BigInt(endTime),
        );
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "CreatedAuction",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      const eventCreator = events[0].args.creator;
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventCreator).eq(
        await creator.getAddress(),
        "Creator address is wrong.",
      );
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Creator should cancel auction", async () => {
      await marketplace.connect(creator).cancelAuction(nftAddress, tokenId);
      expect(await nft.ownerOf(tokenId)).eq(
        await creator.getAddress(),
        "Cancel is failed.",
      );
    });

    it("Creator should create auction again", async () => {
      const price = 10000;
      const minBid = 500;
      const startTime = 0; // now
      const endTime = Date.now() + 60 * 60 * 24 * 7; // 7 days
      await nft.connect(creator).approve(marketplaceAddress, tokenId);
      const tx = await marketplace
        .connect(creator)
        .createAuction(
          nftAddress,
          tokenId,
          uAddress,
          toWei(price),
          toWei(minBid),
          BigInt(startTime),
          BigInt(endTime),
        );
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "CreatedAuction",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      const eventCreator = events[0].args.creator;
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventCreator).eq(
        await creator.getAddress(),
        "Creator address is wrong.",
      );
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Buyer should bid place", async () => {
      const bidPrice = 10500;
      await payableToken
        .connect(buyer)
        .approve(marketplaceAddress, toWei(bidPrice));
      const tx = await marketplace
        .connect(buyer)
        .bidPlace(nftAddress, tokenId, toWei(bidPrice));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "PlacedBid",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      const eventBidder = events[0].args.bidder;
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventBidder).eq(
        await buyer.getAddress(),
        "Bidder address is wrong.",
      );
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Offerer should bid place", async () => {
      const bidPrice = 11000;
      await payableToken
        .connect(offerer)
        .approve(marketplaceAddress, toWei(bidPrice));
      const tx = await marketplace
        .connect(offerer)
        .bidPlace(nftAddress, tokenId, toWei(bidPrice));
      const receipt = await tx.wait();
      const events = receipt?.logs?.filter(
        (e: any) => e.event == "PlacedBid",
      ) as any;
      const eventNFT = events[0].args.nft;
      const eventTokenId = events[0].args.tokenId;
      const eventBidder = events[0].args.bidder;
      expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
      expect(eventBidder).eq(
        await offerer.getAddress(),
        "Bidder address is wrong.",
      );
      expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
    });

    it("Marketplace owner should call result auction", async () => {
      try {
        const tx = await marketplace
          .connect(owner)
          .resultAuction(nftAddress, tokenId);
        const receipt = await tx.wait();
        const events = receipt?.logs?.filter(
          (e: any) => e.event == "ResultedAuction",
        ) as any;
        const eventNFT = events[0].args.nft;
        const eventTokenId = events[0].args.tokenId;
        const eventWinner = events[0].args.winner;
        const eventCaller = events[0].args.caller;
        expect(eventNFT).eq(nftAddress, "NFT address is wrong.");
        expect(eventTokenId).eq(tokenId, "TokenId is wrong.");
        expect(eventWinner).eq(
          await offerer.getAddress(),
          "Winner address is wrong.",
        );
        expect(eventCaller).eq(
          await owner.getAddress(),
          "Caller address is wrong.",
        );
        expect(await nft.ownerOf(tokenId)).eq(
          eventWinner,
          "NFT owner is wrong.",
        );
      } catch (error) {}
    });
  });
});
