import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

describe("Box (proxy)", function () {
  let box: Contract;

  beforeEach(async function () {
    const Box = await ethers.getContractFactory("Box");
    box = await upgrades.deployProxy(Box, [42], { initializer: "store" });
  });

  it("should retrieve value previously stored", async function () {
    // console.log(box.address, " box(proxy)");
    // console.log(
    //   await upgrades.erc1967.getImplementationAddress(await box.getAddress()),
    //   " getImplementationAddress"
    // );
    // console.log(
    //   await upgrades.erc1967.getAdminAddress(await box.getAddress()),
    //   " getAdminAddress"
    // );

    expect(await box.retrieve()).to.equal(42);

    await box.store(100);
    expect(await box.retrieve()).to.equal(100);
  });
});
