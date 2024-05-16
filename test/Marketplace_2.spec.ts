import { expect } from "chai";
import { Provider, Signer, parseEther } from "ethers";
import { ethers } from "hardhat";
import { before } from "mocha";
import {
  NFTCollection,
  NFTCollection__factory,
  NftFactory,
  NftFactory__factory,
  YuNftMarketplace,
  YuNftMarketplace__factory,
} from "../typechain";

function toWei(value: number) {
  return parseEther(value.toString());
}

describe("Yushaku Marketplace", () => {
  const native = "0x0000000000000000000000000000000000000000";
  let nft: NFTCollection;
  let factory: NftFactory;
  let provider: Provider = ethers.provider;
  let marketplace: YuNftMarketplace;
  let owner: Signer;
  let creator: Signer;
  let buyer: Signer;
  let offerer: Signer;
  let bidder: Signer;

  let marketplaceAddress: string;
  let nftAddress: string;
  let nftFactoryAddress: string;
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

    creatorAddress = await creator.getAddress();
    buyerAddress = await buyer.getAddress();
    offererAddress = await offerer.getAddress();

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

  describe("--- LIST AND BUY WITH NATIVE TOKEN ---", () => {
    const tokenId = 0;
    const price = toWei(10);

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
          .listNft(nftAddress, tokenId, native, price),
      )
        .to.emit(marketplace, "ListedNFT")
        .withArgs([nftAddress, tokenId, native, price, creatorAddress]);

      const listedNft = await marketplace.getListedNFT(nftAddress, tokenId);
      expect(listedNft).to.not.null;
    });

    it("Creator should cancel listed item", async () => {
      expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
      await marketplace.connect(creator).cancelListedNFT(nftAddress, tokenId);
      expect(await nft.ownerOf(tokenId)).eq(creatorAddress);
    });

    it("Creator should list NFT on the marketplace again!", async () => {
      await nft.connect(creator).approve(marketplaceAddress, tokenId);

      expect(
        marketplace
          .connect(creator)
          .listNft(nftAddress, tokenId, native, toWei(10)),
      )
        .to.emit(marketplace, "ListedNFT")
        .withArgs([nftAddress, tokenId, native, toWei(10), creatorAddress]);
    });

    it("Buyer should buy listed NFT", async () => {
      const beforeBuyer = await provider.getBalance(buyerAddress);
      const beforeSellerBalance = await provider.getBalance(creatorAddress);

      expect(
        await marketplace
          .connect(buyer)
          ["buyNFT(address,uint256)"](nftAddress, tokenId, {
            value: toWei(10),
          }),
      )
        .to.emit(marketplace, "BoughtNFT")
        .withArgs([
          nftAddress,
          tokenId,
          native,
          toWei(10),
          creatorAddress,
          buyerAddress,
        ]);

      const afterBuyer = await provider.getBalance(buyerAddress);
      const marketplaceBalance = await provider.getBalance(marketplaceAddress);
      const afterSellerBalance = await provider.getBalance(creatorAddress);

      expect(afterSellerBalance).to.gte(beforeSellerBalance);
      expect(marketplaceBalance).to.eq(toWei(0.01));
      expect(afterBuyer).to.lte(beforeBuyer - toWei(10));
      expect(await nft.ownerOf(tokenId)).eq(buyerAddress);
    });
  });

  describe("LIST, OFFER, AND ACCEPT OFFER WITH YSK TOKEN", () => {
    const offerPrice = toWei(10);
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
          .listNft(nftAddress, tokenId, native, offerPrice),
      )
        .to.emit(marketplace, "ListedNFT")
        .withArgs([nftAddress, tokenId, native, offerPrice, creatorAddress]);
    });

    it("Buyer should offer NFT", async () => {
      expect(
        await marketplace
          .connect(buyer)
          .offerNFT(nftAddress, tokenId, native, offerPrice, {
            value: offerPrice,
          }),
      )
        .to.emit(marketplace, "OfferredNFT")
        .withArgs([nftAddress, tokenId, native, offerPrice, buyerAddress]);
    });

    it("Buyer should cancel offer", async () => {
      expect(
        await marketplace.connect(buyer).cancelOfferNFT(nftAddress, tokenId),
      )
        .to.emit(marketplace, "CanceledOfferredNFT")
        .withArgs([nftAddress, tokenId, native, offerPrice, creatorAddress]);

      expect(await nft.ownerOf(tokenId)).to.eq(marketplaceAddress);
    });

    it("Offerer should offer NFT", async () => {
      expect(
        await marketplace
          .connect(offerer)
          .offerNFT(nftAddress, tokenId, native, offerPrice, {
            value: offerPrice,
          }),
      )
        .to.emit(marketplace, "OfferredNFT")
        .withArgs([nftAddress, tokenId, native, offerPrice, offererAddress]);
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
          native,
          offerPrice,
          offererAddress,
          creatorAddress,
        ]);

      expect(await nft.ownerOf(tokenId)).eq(offererAddress);
    });
  });

  // describe("CREATE AUCTION, BID PLACE, AND RESULT AUCTION", async () => {
  //   const tokenId = 2;
  //   const price = 10000;
  //   const minBid = 500;
  //   const day = 24 * 60 * 60;
  //   const startTime = Date.now(); // a day
  //   const endTime = Date.now() + 60 * 60 * 24 * 7; // 7 days
  //
  //   it("Creator should mint NFT", async () => {
  //     const uri = "Yushaku.io";
  //     await nft.connect(creator).mintTo(creatorAddress, uri);
  //     expect(await nft.ownerOf(tokenId)).to.eq(creatorAddress);
  //   });
  //
  //   it("Creator should create auction", async () => {
  //     await nft.connect(creator).approve(marketplaceAddress, tokenId);
  //     expect(
  //       await marketplace
  //         .connect(creator)
  //         .createAuction(
  //           nftAddress,
  //           tokenId,
  //           native,
  //           toWei(price),
  //           toWei(minBid),
  //           BigInt(startTime),
  //           BigInt(endTime),
  //         ),
  //     )
  //       .to.emit(marketplace, "CreatedAuction")
  //       .withArgs([
  //         nftAddress,
  //         tokenId,
  //         native,
  //         toWei(price),
  //         toWei(minBid),
  //         BigInt(startTime),
  //         BigInt(endTime),
  //         creatorAddress,
  //       ]);
  //
  //     expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
  //   });
  //
  //   it("Creator should cancel auction", async () => {
  //     expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
  //     await marketplace.connect(creator).cancelAuction(nftAddress, tokenId);
  //     expect(await nft.ownerOf(tokenId)).eq(creatorAddress);
  //   });
  //
  //   it("Creator should create auction again", async () => {
  //     const startTime = Date.now() - 100000; // a day
  //
  //     await nft.connect(creator).approve(marketplaceAddress, tokenId);
  //     expect(
  //       await marketplace
  //         .connect(creator)
  //         .createAuction(
  //           nftAddress,
  //           tokenId,
  //           native,
  //           toWei(price),
  //           toWei(minBid),
  //           BigInt(1714081570),
  //           BigInt(endTime),
  //         ),
  //     )
  //       .to.emit(marketplace, "CreatedAuction")
  //       .withArgs([
  //         nftAddress,
  //         tokenId,
  //         native,
  //         toWei(price),
  //         toWei(minBid),
  //         BigInt(startTime),
  //         BigInt(endTime),
  //         creatorAddress,
  //       ]);
  //
  //     console.log(BigInt(startTime));
  //     expect(await nft.ownerOf(tokenId)).eq(marketplaceAddress);
  //   });
  //
  //   it("Buyer should bid place", async () => {
  //     await time.increase(360_000);
  //     await ethers.provider.send("evm_increaseTime", [360_000]);
  //     const bidPrice = 10500;
  //     await payableToken.connect(buyer).approve(marketplaceAddress, MaxUint256);
  //     expect(
  //       await marketplace
  //         .connect(buyer)
  //         .bidPlace(nftAddress, tokenId, toWei(bidPrice)),
  //     )
  //       .to.emit(marketplace, "PlacedBid")
  //       .withArgs([nftAddress, tokenId, native, toWei(bidPrice), buyerAddress]);
  //   });
  //
  //   it("Offerer should bid place", async () => {
  //     await time.increase(360_000);
  //     const bidPrice = 11000;
  //     await payableToken
  //       .connect(offerer)
  //       .approve(marketplaceAddress, MaxUint256);
  //
  //     expect(
  //       await marketplace
  //         .connect(buyer)
  //         .bidPlace(nftAddress, tokenId, toWei(bidPrice)),
  //     )
  //       .to.emit(marketplace, "PlacedBid")
  //       .withArgs([
  //         nftAddress,
  //         tokenId,
  //         native,
  //         toWei(bidPrice),
  //         offererAddress,
  //       ]);
  //   });
  //
  //   it("Marketplace owner should call result auction", async () => {
  //     expect(
  //       await marketplace.connect(owner).resultAuction(nftAddress, tokenId),
  //     )
  //       .to.emit(marketplace, "ResultedAuction")
  //       .withArgs([nftAddress, tokenId, creatorAddress]);
  //   });
  // });
});
