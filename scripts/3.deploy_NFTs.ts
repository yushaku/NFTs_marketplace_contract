import { ethers } from "hardhat";
import { verifyContract, writeDownAddress } from "./utils/helper";

const name = "Gundam collection";
const symbol = "GDC";
const MAX_SUPPLY = 21;
const baseURl =
  "https://github.com/yushaku/polite_cat_NFTs/blob/main/metadata/";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network chain id=", network.chainId);
  console.log("Deploying contracts with the account:", deployer.address);

  const NFTs = await ethers.getContractFactory("NFTCollectible");
  const nft = await NFTs.deploy(baseURl, MAX_SUPPLY, name, symbol);

  const address = await nft.getAddress();
  // const address = getAddress("nfts");
  writeDownAddress("nfts", address, network.name);

  await new Promise((resolve) => setTimeout(resolve, 10_000));
  await verifyContract(address, [baseURl, MAX_SUPPLY, name, symbol]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
