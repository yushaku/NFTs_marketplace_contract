import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";

async function main() {
  // const [deployer] = await ethers.getSigners();
  // console.log("Deploying contracts with the account:", deployer.address);

  // const token = await ethers.deployContract("Yushaku");

  // console.log("get address");
  // const address = await token.getAddress();
  // // writeDownAddress("sepolia_yushaku_erc20", address);
  // writeDownAddress("goerli_yushaku_erc20", address);

  // await new Promise((resolve) => setTimeout(resolve, 25_000));
  // const address = getAddress("goerli_yushaku_erc20");
  const address = getAddress("sepolia_yushaku_erc20");
  await verifyContract(address, []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
