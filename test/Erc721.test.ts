import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const PRICE = ethers.parseEther("0.01");
const MAX_SUPPLY = 100;
const MAX_PER_MINT = 5;

describe("Token contract", function () {
  async function deployNFT() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const BoxV2 = await ethers.getContractFactory("NFTCollectible", owner);
    const nft = await BoxV2.deploy("yushaku", MAX_SUPPLY, PRICE, MAX_PER_MINT);

    return { nft, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("should deploy success", async function () {
      const { nft } = await loadFixture(deployNFT);
      expect(await nft.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await nft.PRICE()).to.equal(PRICE);
      expect(await nft.MAX_PER_MINT()).to.equal(MAX_PER_MINT);
    });

    it("should success: mint an NFT and assign ownership", async function () {
      const { nft, owner } = await loadFixture(deployNFT);
      await nft.connect(owner).reserveNFTs(5);

      for (let i = 0; i < 5; i++) {
        expect(await nft.ownerOf(i)).to.equal(owner.address);
      }
    });
  });

  describe("mint nft", function () {
    it("should fail: not enough ether", async function () {
      const { nft, owner } = await loadFixture(deployNFT);
      await expect(nft.connect(owner).mintNFTs(1)).to.be.revertedWith(
        "Not enough ether to purchase NFTs."
      );
    });
  });
});
