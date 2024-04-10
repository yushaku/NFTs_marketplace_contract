import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { ContractName } from "./utils/config";
import {
  NftFactory,
  NftFactory__factory,
  YuNftMarketplace,
  YuNftMarketplace__factory as MPFactory,
} from "../typechain";

async function main(step = 1) {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Network chain id=", network.chainId);
  console.log("Deploying contracts with the account:", deployer.address);

  let nftFactory: NftFactory;
  let nftMarket: YuNftMarketplace;

  if (step <= 1) {
    nftFactory = await new NftFactory__factory(deployer).deploy();
    const address = await nftFactory.getAddress();
    writeDownAddress(ContractName.NftFactory, address, network.name);
  } else {
    const address = getAddress(ContractName.NftFactory, network.name);
    nftFactory = new NftFactory__factory().attach(address) as NftFactory;
  }

  if (step <= 2) {
    nftMarket = await new MPFactory(deployer).deploy(20, deployer.address);
    const address = await nftMarket.getAddress();
    writeDownAddress(ContractName.NftMarket, address, network.name);
  }

  await new Promise((resolve) => setTimeout(resolve, 10_000));

  if (step <= 1.5) {
    const address = getAddress(ContractName.NftFactory, network.name);
    await verifyContract(address);
  }

  if (step <= 2.5) {
    const address = getAddress(ContractName.NftMarket, network.name);
    await verifyContract(address, [20, deployer.address]);
  }
}

main(2)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
