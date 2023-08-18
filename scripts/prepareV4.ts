import { ethers } from "hardhat";
import { upgrades } from "hardhat";

const proxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
// const proxyAddress = '0x1CD0c84b7C7C1350d203677Bb22037A92Cc7e268'

async function main() {
  console.log("original Box(proxy) address: ", proxyAddress);
  const BoxV4 = await ethers.getContractFactory("BoxV4");
  console.log("Preparing upgrade to BoxV4...");
  const boxV4Address = await upgrades.prepareUpgrade(proxyAddress, BoxV4);
  console.log(boxV4Address, " BoxV4 implementation contract address");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
