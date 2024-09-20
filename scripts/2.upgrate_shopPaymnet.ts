import { ethers, upgrades } from "hardhat";
import { verifyContract } from "./utils/helper";
import { ContractName } from "./utils/config";
import { sleep } from "./utils/sleep";

async function main() {
  const [owner] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Upgrading ShopPayment to ShopPaymentV2...");

  // Get the contract factory for ShopPaymentV2
  const ShopPaymentV2 = await ethers.getContractFactory("ShopPaymentV2");

  // Perform the upgrade
  const shopPaymentV2 = await upgrades.upgradeProxy(
    ContractName.ShopPayment,
    ShopPaymentV2,
    {
      // Optional: Pass initialization arguments if needed
      // Call initializeV2 after upgrade
    },
  );

  console.log("ShopPayment upgraded to V2 at:", shopPaymentV2.address);

  // Initialize the new version (e.g., set initial discount rate to 1%)
  const tx = await shopPaymentV2.initializeV2(100); // 100 basis points = 1%
  await tx.wait();

  console.log(
    "Initialized ShopPaymentV2 with discountRate =",
    await shopPaymentV2.discountRate(),
  );

  // Optionally verify the new implementation on Etherscan
  await sleep(20_000); // Wait for Etherscan to index the new contract
  // await verifyContract(address);
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
