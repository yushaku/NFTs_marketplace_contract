import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Box } from "../typechain";

describe("Box", function () {
  let box: Box;
  let owner: SignerWithAddress;
  let addresses: SignerWithAddress[];

  beforeEach(async function () {
    [owner, ...addresses] = await ethers.getSigners();

    const Box = await ethers.getContractFactory("Box", owner);
    box = await Box.deploy();
  });

  it("should retrieve value previously stored", async function () {
    await box.store(42);
    expect(await box.retrieve()).to.equal(42);

    await box.store(100);
    expect(await box.retrieve()).to.equal(100);
  });
});
