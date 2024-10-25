import { ethers } from "hardhat";
import { ContractName, ZERO_ADDRESS } from "./utils/config";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { sleep } from "./utils/sleep";

async function main(step: number) {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  console.log(`Network ${network.name} - ${network.chainId}`);
  console.log("Deploying contracts with the account:", deployer.address);

  let yskAddress = "";
  let governorAddress = "";

  if (step <= 1) {
    console.log("step 1: deploy YSK");
    const token = await ethers.deployContract("YSK");
    yskAddress = await token.getAddress();
    writeDownAddress(ContractName.YuToken, yskAddress, network.name);
  } else {
    yskAddress = getAddress(ContractName.YuToken, network.name);
  }

  if (step <= 2) {
    console.log("step 2: deploy Governor");
    const governor = await ethers.deployContract("YuGovernor", [
      yskAddress,
      ZERO_ADDRESS,
    ]);
    governorAddress = await governor.getAddress();
    writeDownAddress(ContractName.YuGovernor, governorAddress, network.name);
  } else {
    governorAddress = getAddress(ContractName.YuGovernor, network.name);
  }

  // ---------------------------- verify statement  ------------------------------

  await sleep(30 * 1000);

  if (step <= 1) {
    console.log("step 3: verify Yushaku Token");
    await verifyContract(yskAddress);
  }

  if (step <= 2) {
    console.log("step 4: verify governor");
    await verifyContract(governorAddress, [yskAddress, ZERO_ADDRESS]);
  }
}

main(3)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
