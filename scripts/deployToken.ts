import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";

async function main() {
  // const [deployer] = await ethers.getSigners();
  // console.log("Deploying contracts with the account:", deployer.address);
  //
  // const token = await ethers.deployContract("PoliteCatToken");
  // const address = await token.getAddress();
  // writeDownAddress("tokenErc20", address);

  // await new Promise((resolve) => setTimeout(resolve, 25_000));
  const address = getAddress("PoliteCatToken");
  await verifyContract("0xbB959b9bdB2788981Cdc3DD3a8F314b9b3cA69Be", []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
