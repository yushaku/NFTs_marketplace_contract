import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFTCollection,
  NFTCollection__factory,
  NftFactory__factory,
} from "../typechain";

describe("Token contract", function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const nftFactory = await new NftFactory__factory(owner).deploy();
    return { nftFactory, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should deploy new nft collecion", async function () {
      const { nftFactory, addr1 } = await loadFixture(deployTokenFixture);
      await nftFactory.connect(addr1).create("CAT", "CAT", 3);

      const userAddress = await addr1.getAddress();
      const list = await nftFactory.list(userAddress);
      expect(list.length).to.equal(1);

      const nft = new NFTCollection__factory(addr1).attach(
        list[0],
      ) as NFTCollection;

      expect(await nft.name()).to.equal("CAT");
      expect(await nft.symbol()).to.equal("CAT");

      await nft.mintTo(
        userAddress,
        "ipfs://bafybeigjo7vswkssnmoii6e5rif6srbc7xyqmdvxxlyo37zokst4dnmlka/1",
      );

      expect(await nft.balanceOf(userAddress)).to.equal(1n);
      expect(await nft.ownerOf(0)).to.equal(userAddress);

      let total = await nft.totalSupply();
      expect(total).to.equal(1n);
    });

    it("Should nft mint batch", async function () {
      const { nftFactory, addr1 } = await loadFixture(deployTokenFixture);
      await nftFactory.connect(addr1).create("DOG", "DOG", 3);
      const userAddress = await addr1.getAddress();
      const list = await nftFactory.list(userAddress);
      expect(list.length).to.equal(1);
      const nft = new NFTCollection__factory(addr1).attach(
        list[0],
      ) as NFTCollection;

      await nft.batchMintTo(
        userAddress,
        10,
        "ipfs://bafybeigjo7vswkssnmoii6e5rif6srbc7xyqmdvxxlyo37zokst4dnmlka/",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      );

      expect(await nft.balanceOf(userAddress)).to.equal(10);
      expect(await nft.ownerOf(0)).to.equal(userAddress);

      let total = await nft.totalSupply();
      expect(total).to.equal(10);
    });
  });
});
