import { ethers } from "hardhat";
import { upgrades } from "hardhat";

// const proxyAddress = '0x1CD0c84b7C7C1350d203677Bb22037A92Cc7e268'
const proxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
  console.log(proxyAddress, " original Box(proxy) address");
  const BoxV3 = await ethers.getContractFactory("BoxV3");

  console.log("upgrade to BoxV3...");
  const boxV3 = await upgrades.upgradeProxy(proxyAddress, BoxV3);

  const address = await boxV3.getAddress();
  console.log(address, " BoxV3 address(should be the same)");

  console.log(
    await upgrades.erc1967.getImplementationAddress(address),
    " getImplementationAddress"
  );
  console.log(
    await upgrades.erc1967.getAdminAddress(address),
    " getAdminAddress"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
