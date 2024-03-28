import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { sleep } from "./utils/sleep";
import { config } from "./utils/config";

const { YSK } = config;

async function main(step: number) {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  console.log(`Network ${network.name} - ${network.chainId}`);
  console.log("Deploying contracts with the account:", deployer.address);

  let tkAddress = "";
  let usdAddress = "";

  if (step <= 1) {
    console.log("step 1: deploy yushaku_erc20");
    const token = await ethers.deployContract("Yushaku", [
      deployer.address,
      YSK.MINTING_RESTRICTED_BEFORE,
      YSK.MINT_MAX_PERCENT,
    ]);
    tkAddress = await token.getAddress();
    writeDownAddress(`YuToken`, tkAddress, network.name);
  } else {
    tkAddress = getAddress(`YuToken`, network.name);
  }

  if (step <= 2) {
    console.log("step 2: deploy USDT");
    const token = await ethers.deployContract("USDT");
    usdAddress = await token.getAddress();
    writeDownAddress(`USDT`, usdAddress, network.name);
  } else {
    usdAddress = getAddress(`USDT`, network.name);
  }

  await sleep(30 * 1000);
  // ---------------------------- verify statement  ------------------------------

  if (step <= 1) {
    console.log("step 3: verify Yushaku Token");
    await verifyContract(tkAddress, [
      deployer.address,
      YSK.MINTING_RESTRICTED_BEFORE,
      YSK.MINT_MAX_PERCENT,
    ]);
  }

  if (step <= 2) {
    console.log("step 4: verify USDT");
    await verifyContract(usdAddress, []);
  }
}

main(1)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
