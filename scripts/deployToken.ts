import { ethers } from "hardhat";
import { writeDownAddress } from "./utils/helper";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const token = await ethers.deployContract("PoliteCatToken");
  const address = await token.getAddress();
  writeDownAddress("tokenErc20", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
