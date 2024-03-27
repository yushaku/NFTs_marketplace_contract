import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { sleep } from "./utils/sleep";

async function main(step: number) {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  console.log(`Network ${network.name} - ${network.chainId}`);
  console.log("Deploying contracts with the account:", deployer.address);

  let tkAddress = "";
  let usdAddress = "";

  if (step <= 1) {
    console.log("step 1: deploy yushaku_erc20");
    const token = await ethers.deployContract("Yushaku");
    tkAddress = await token.getAddress();
    writeDownAddress(`yushaku_erc20`, tkAddress, network.name);
  } else {
    tkAddress = getAddress(`yushaku_erc20`, network.name);
  }

  await sleep(30 * 1000);
  await verify(step);
}

export async function verify(step = 1) {
  const network = await ethers.provider.getNetwork();
  const tkAddress = getAddress(`yushaku_erc20`, network.name);
  const usdAddress = getAddress(`usdt`, network.name);
  const stAddress = getAddress(`stake_module`, network.name);

  if (step <= 1) {
    await verifyContract(tkAddress, []);
  }

  if (step <= 2) {
    await verifyContract(usdAddress, []);
  }

  if (step <= 3) {
    await verifyContract(stAddress, [tkAddress]);
  }
}

main(2)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
