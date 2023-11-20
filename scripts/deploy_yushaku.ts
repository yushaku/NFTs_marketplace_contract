import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`${network.name}: yushaku_erc20`);
  console.log("Network chain id=", network.chainId);

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const token = await ethers.deployContract("Yushaku");

  console.log("get address");
  const address = await token.getAddress();
  writeDownAddress(`yushaku_erc20`, address, network.name);
}

export async function verify() {
  const network = await ethers.provider.getNetwork();
  console.log(`${network.name}: yushaku_erc20`);
  console.log(`Network chain id= ${network.chainId}`);

  await new Promise((resolve) => setTimeout(resolve, 5_000));
  const address = getAddress(`yushaku_erc20`, network.name);
  await verifyContract(address, []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
