import { ethers } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { sleep } from "./utils/sleep";
import {
  Executor,
  YuGovernor,
  Executor__factory,
  YuGovernor__factory,
} from "../typechain";
import { ContractName, ZERO_ADDRESS, config } from "./utils/config";

const { SHORT_TIMELOCK, LONG_TIMELOCK } = config;

async function main(step: number) {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  console.log(`Network ${network.name} - ${network.chainId}`);
  console.log("Deploying contracts with the account:", deployer.address);

  let governorAddress = "";
  let yuGovernor: YuGovernor;
  let shortTimeLockexecutor: Executor;
  let longTimeLockexecutor: Executor;

  if (step <= 1) {
    console.log("step 1: Deploy Governor");
    yuGovernor = await new YuGovernor__factory(deployer).deploy(
      ZERO_ADDRESS,
      config.VOTING_DELAY_BLOCKS,
      deployer.address,
    );
    governorAddress = await yuGovernor.getAddress();
    writeDownAddress(ContractName.YuGovernor, governorAddress, network.name);
  } else {
    governorAddress = getAddress(ContractName.YuGovernor, network.name);
    yuGovernor = new YuGovernor__factory(deployer).attach(
      governorAddress,
    ) as any;
  }

  if (step <= 2) {
    console.log("step 2: Deploy Short TimeLock Executor");
    shortTimeLockexecutor = await new Executor__factory(deployer).deploy(
      governorAddress,
      SHORT_TIMELOCK.DELAY,
      SHORT_TIMELOCK.GRACE_PERIOD,
      SHORT_TIMELOCK.MINIMUM_DELAY,
      SHORT_TIMELOCK.MAXIMUM_DELAY,
      SHORT_TIMELOCK.PROPOSITION_THRESHOLD,
      SHORT_TIMELOCK.VOTING_DURATION_BLOCKS,
      SHORT_TIMELOCK.VOTE_DIFFERENTIAL,
      SHORT_TIMELOCK.MINIMUM_QUORUM,
    );
    const address = await shortTimeLockexecutor.getAddress();
    writeDownAddress(ContractName.ShortExecutor, address, network.name);
  } else {
    const addr = getAddress(ContractName.ShortExecutor, network.name);
    shortTimeLockexecutor = new Executor__factory(deployer).attach(addr) as any;
  }

  if (step <= 3) {
    console.log("step 3: Deploy Long TimeLock Executor");
    longTimeLockexecutor = await new Executor__factory(deployer).deploy(
      governorAddress,
      LONG_TIMELOCK.DELAY,
      LONG_TIMELOCK.GRACE_PERIOD,
      LONG_TIMELOCK.MINIMUM_DELAY,
      LONG_TIMELOCK.MAXIMUM_DELAY,
      LONG_TIMELOCK.PROPOSITION_THRESHOLD,
      LONG_TIMELOCK.VOTING_DURATION_BLOCKS,
      LONG_TIMELOCK.VOTE_DIFFERENTIAL,
      LONG_TIMELOCK.MINIMUM_QUORUM,
    );
    const address = await longTimeLockexecutor.getAddress();
    writeDownAddress(ContractName.LongExecutor, address, network.name);
  } else {
    const addr = getAddress(ContractName.LongExecutor, network.name);
    longTimeLockexecutor = new Executor__factory(deployer).attach(addr) as any;
  }

  // ---------------------------- verify statement  ------------------------------

  await sleep(30 * 1000);

  if (step <= 4) {
    verifyContract(governorAddress, [
      ZERO_ADDRESS,
      config.VOTING_DELAY_BLOCKS,
      deployer.address,
    ]);
  }

  if (step <= 5) {
    verifyContract(await shortTimeLockexecutor.getAddress(), [
      governorAddress,
      SHORT_TIMELOCK.DELAY,
      SHORT_TIMELOCK.GRACE_PERIOD,
      SHORT_TIMELOCK.MINIMUM_DELAY,
      SHORT_TIMELOCK.MAXIMUM_DELAY,
      SHORT_TIMELOCK.PROPOSITION_THRESHOLD,
      SHORT_TIMELOCK.VOTING_DURATION_BLOCKS,
      SHORT_TIMELOCK.VOTE_DIFFERENTIAL,
      SHORT_TIMELOCK.MINIMUM_QUORUM,
    ]);
  }

  if (step <= 6) {
    verifyContract(await longTimeLockexecutor.getAddress(), [
      governorAddress,
      LONG_TIMELOCK.DELAY,
      LONG_TIMELOCK.GRACE_PERIOD,
      LONG_TIMELOCK.MINIMUM_DELAY,
      LONG_TIMELOCK.MAXIMUM_DELAY,
      LONG_TIMELOCK.PROPOSITION_THRESHOLD,
      LONG_TIMELOCK.VOTING_DURATION_BLOCKS,
      LONG_TIMELOCK.VOTE_DIFFERENTIAL,
      LONG_TIMELOCK.MINIMUM_QUORUM,
    ]);
  }
}

main(0)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
