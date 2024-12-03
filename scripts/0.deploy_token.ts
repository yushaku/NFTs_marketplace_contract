import { parseUnits } from "ethers";
import { ethers } from "hardhat";
import { FaucetToken, USDT, YSK__factory } from "../typechain";
import { ContractName, config } from "./utils/config";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { sleep } from "./utils/sleep";

const { YSK } = config;

async function main(step: number) {
  const network = await ethers.provider.getNetwork();
  const [deployer] = await ethers.getSigners();
  console.log(`Network ${network.name} - ${network.chainId}`);
  console.log("Deploying contracts with the account:", deployer.address);

  let tkAddress = "";
  let usdAddress = "";
  let faucetAddress = "";

  if (step <= 1) {
    console.log("step 1: deploy YSK");
    const token = await new YSK__factory().deploy();
    tkAddress = await token.getAddress();
    writeDownAddress(ContractName.YuToken, tkAddress, network.name);
  } else {
    tkAddress = getAddress(ContractName.YuToken, network.name);
  }

  if (step <= 2) {
    console.log("step 2: deploy USDT");
    const token = await ethers.deployContract("USDT");
    usdAddress = await token.getAddress();
    writeDownAddress(ContractName.USDT, usdAddress, network.name);
  } else {
    usdAddress = getAddress(ContractName.USDT, network.name);
  }

  if (step <= 3) {
    console.log("step 3: deploy faucet");
    const faucet = await ethers.deployContract("FaucetToken", [24 * 60 * 60]);
    faucetAddress = await faucet.getAddress();
    writeDownAddress(ContractName.Faucet, faucetAddress, network.name);
  } else {
    faucetAddress = getAddress(ContractName.Faucet, network.name);
  }

  if (step <= 4) {
    console.log("step 4: fund tokens to faucet");
    const [signer] = await ethers.getSigners();
    console.log(signer.address);

    const FaucetToken = await ethers.getContractFactory("FaucetToken");
    const faucet = FaucetToken.attach(faucetAddress) as FaucetToken;

    await faucet.addToken(usdAddress, parseUnits("10", 6));

    const USDT = await ethers.getContractFactory("USDT");
    const usdt = USDT.attach(faucetAddress) as USDT;
    await usdt.mint(faucetAddress, parseUnits("1000000000", 6));
  }

  return;

  // ---------------------------- verify statement  ------------------------------

  await sleep(30 * 1000);

  if (step <= 1) {
    console.log("step 3: verify Yushaku Token");
    await verifyContract(tkAddress, [
      deployer.address,
      YSK.MINTING_RESTRICTED_BEFORE,
      YSK.MINT_MAX_PERCENT,
    ]);
  }

  if (step <= 2) {
    console.log("step 3: verify USDT");
    await verifyContract(usdAddress, []);
  }

  if (step <= 3) {
    console.log("step 4: verify faucet");
    await verifyContract(faucetAddress, [24 * 60 * 60]);
  }
}

main(4)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error({ error });
    process.exit(1);
  });
