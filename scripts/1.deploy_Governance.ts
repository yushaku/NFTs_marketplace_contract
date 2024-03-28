import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { sleep } from "./utils/sleep";
import { YuGovernor, Yushaku__factory } from "../typechain";
import { ZERO_ADDRESS, config } from "./utils/config";

async function main(step: number) {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  console.log(`Network ${network.name} - ${network.chainId}`);
  console.log("Deploying contracts with the account:", deployer.address);

  let governorAddress = "";
  let yuGovernor: YuGovernor;

  if (step <= 1) {
    console.log("step 1: Deploy Governor");
    yuGovernor = await ethers.deployContract("YuGovernor", [
      ZERO_ADDRESS,
      config.VOTING_DELAY_BLOCKS,
      deployer.address,
    ]);
    governorAddress = await yuGovernor.getAddress();
    writeDownAddress(`YuGovernor`, governorAddress, network.name);
  } else {
    governorAddress = getAddress(`YuGovernor`, network.name);
    yuGovernor = new Yushaku__factory(deployer).attach(governorAddress) as any;
  }

  await sleep(30 * 1000);

  if (step <= 1) {
    verifyContract(governorAddress, [
      ZERO_ADDRESS,
      config.VOTING_DELAY_BLOCKS,
      deployer.address,
    ]);
  }
}

main(1)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
