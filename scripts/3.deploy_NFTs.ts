import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { ContractName } from "./utils/config";
import { NftFactory, NftFactory__factory } from "../typechain";

async function main(step = 1) {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Network chain id=", network.chainId);
  console.log("Deploying contracts with the account:", deployer.address);

  let nftFactory: NftFactory;

  if (step <= 1) {
    nftFactory = await new NftFactory__factory(deployer).deploy();

    const address = await nftFactory.getAddress();
    writeDownAddress(ContractName.NftFactory, address, network.name);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    await verifyContract(address);
  } else {
    const address = getAddress(ContractName.NftFactory, network.name);
    nftFactory = new NftFactory__factory().attach(address) as NftFactory;
  }

  if (step <= 2) {
    const address = getAddress(ContractName.NftFactory, network.name);
    await verifyContract(address);
  }
}

main(2)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
