import { ethers, upgrades } from "hardhat";
import { getAddress, verifyContract, writeDownAddress } from "./utils/helper";
import { ContractName } from "./utils/config";
import { sleep } from "./utils/sleep";

async function main(step: number) {
  const [owner] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  if (step <= 1) {
    console.log("Deploying ShopPayment...");
    const ShopPayment = await ethers.getContractFactory("ShopPayment");

    // Deploy the upgradeable contract using a UUPS proxy
    const shopPayment = await upgrades.deployProxy(
      ShopPayment,
      [owner.address],
      {
        initializer: "initialize",
        kind: "uups", // Specifies the UUPS proxy pattern
      },
    );

    const address = await shopPayment.getAddress();
    console.info({ address });

    writeDownAddress(ContractName.ShopPayment, address, network.name);

    await sleep(20_000);
  }

  if (step <= 2) {
    const address = getAddress(ContractName.ShopPayment, network.name);
    await verifyContract(address, []);

    const implementation = "0x4E3DdcCeEf165fC30F876cf81b4d7a80C2A1A7bD";
    await verifyContract(implementation, []);
  }
}

main(1)
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
