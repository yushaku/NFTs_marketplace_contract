import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

describe("Box (proxy) V3 with name", function () {
  let box: Contract;
  let boxV2: Contract;
  let boxV3: Contract;

  beforeEach(async function () {
    const Box = await ethers.getContractFactory("Box");
    const BoxV2 = await ethers.getContractFactory("BoxV2");
    const BoxV3 = await ethers.getContractFactory("BoxV3");

    //initialize with 42
    box = await upgrades.deployProxy(Box, [42], { initializer: "store" });
    const boxAddress = await box.getAddress();
    boxV2 = await upgrades.upgradeProxy(boxAddress, BoxV2);
    boxV3 = await upgrades.upgradeProxy(boxAddress, BoxV3);
  });

  it("should retrieve value previously stored and increment correctly", async function () {
    expect(await boxV2.retrieve()).to.equal(42);
    await boxV3.increment();
    expect(await boxV2.retrieve()).to.equal(43);

    await boxV2.store(100);
    expect(await boxV2.retrieve()).to.equal(100);
  });

  it("should set name correctly in V3", async function () {
    expect(await boxV3.name()).to.equal("");

    const boxname = "my Box V3";
    await boxV3.setName(boxname);
    expect(await boxV3.name()).to.equal(boxname);
  });
});
