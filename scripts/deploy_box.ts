import { ethers, upgrades } from "hardhat";

async function main() {
  const Box = await ethers.getContractFactory("Box");
  console.log("Deploying Box...");
  const box = await upgrades.deployProxy(Box, [42], { initializer: "store" });

  const boxAddress = await box.getAddress();
  console.log(boxAddress, " box(proxy) address");
  console.log(
    await upgrades.erc1967.getImplementationAddress(boxAddress),
    " getImplementationAddress"
  );
  console.log(
    await upgrades.erc1967.getAdminAddress(boxAddress),
    " getAdminAddress"
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
