import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { BoxV2 } from "../typechain";

describe("Box V2", function () {
  let boxV2: BoxV2;
  let owner: SignerWithAddress;
  let addresses: SignerWithAddress[];

  beforeEach(async function () {
    [owner, ...addresses] = await ethers.getSigners();
    const BoxV2 = await ethers.getContractFactory("BoxV2", owner);
    boxV2 = await BoxV2.deploy();
  });

  it("should retrieve value previously stored", async function () {
    await boxV2.store(42);
    expect(await boxV2.retrieve()).to.equal(42);

    await boxV2.store(100);
    expect(await boxV2.retrieve()).to.equal(100);
  });

  it("should increment value correctly", async function () {
    await boxV2.store(42);
    await boxV2.increment();
    expect(await boxV2.retrieve()).to.equal(43);
  });
});
