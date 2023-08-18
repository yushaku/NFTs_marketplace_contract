import { ethers } from "hardhat";
import { upgrades } from "hardhat";

const proxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  console.log(proxyAddress, "original Box(proxy) address");
  const BoxV2 = await ethers.getContractFactory("BoxV2");

  console.log("upgrade to BoxV2...");
  const boxV2 = await upgrades.upgradeProxy(proxyAddress, BoxV2);

  const addressv2 = await boxV2.getAddress();
  console.log(addressv2, " addressv2(should be the same)");

  console.log(
    await upgrades.erc1967.getImplementationAddress(addressv2),
    " getImplementationAddress"
  );
  console.log(
    await upgrades.erc1967.getAdminAddress(addressv2),
    " getAdminAddress"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
