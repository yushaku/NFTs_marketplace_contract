import fs from "fs";
import { ethers, run } from "hardhat";
import "@nomicfoundation/hardhat-ethers";

export const writeDownAddress = async (key: string, address: string) => {
  console.log(`${key}: ${address}`);

  const rawData = fs.readFileSync("./address.json");
  const object = JSON.parse(rawData.toString());
  object[key] = address;
  fs.writeFileSync("./address.json", JSON.stringify(object, null, 2));
};

export const getAddress = (key: string) => {
  const rawData = fs.readFileSync("./address.json");
  const object = JSON.parse(rawData.toString());
  return object[key];
};

export const verifyContract = async (contractAddress: string, args?: any[]) => {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("deploy successfully");
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};

function getEnvVariable(key: string, defaultValue?: string) {
  if (process.env[key]) {
    return process.env[key] as string;
  }

  return defaultValue ? defaultValue : "";
}

// Helper method for fetching a connection provider to the Ethereum network
function getProvider() {
  return ethers.getDefaultProvider(getEnvVariable("NETWORK", "rinkeby"), {
    alchemy: getEnvVariable("ALCHEMY_KEY"),
  });
}

function getAccount() {
  return new ethers.Wallet(
    getEnvVariable("ACCOUNT_PRIVATE_KEY"),
    getProvider()
  );
}

export function getContract(contractName: string, hre: any) {
  const account = getAccount();
  return getContractAt(
    hre,
    contractName,
    getEnvVariable("NFT_CONTRACT_ADDRESS"),
    account
  );
}
