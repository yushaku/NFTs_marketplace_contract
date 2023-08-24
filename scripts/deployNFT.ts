import { ethers } from "hardhat";
import { verifyContract, writeDownAddress } from "./utils/helper";
import { resolve } from "path";
import { getAddress } from "ethers";

const PRICE = ethers.parseEther("0.01");
const MAX_SUPPLY = 100;
const MAX_PER_MINT = 5;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const CatNFT = await ethers.getContractFactory("NFTCollectible");
  const nft = await CatNFT.deploy("yushaku", MAX_SUPPLY, PRICE, MAX_PER_MINT);

  const address = await nft.getAddress();
  writeDownAddress("NFTCollectible", address);

  await new Promise((resolve) => setTimeout(resolve, 25_000));
  // const address = getAddress("NFTCollectible");
  await verifyContract(address, ["yushaku", MAX_SUPPLY, PRICE, MAX_PER_MINT]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
