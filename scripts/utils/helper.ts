import fs from "fs";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { ContractName } from "./config";

export const writeDownAddress = async (
  key: ContractName,
  address: string,
  network: string = "mainnet",
) => {
  const addressFile = `./deployed_address/${network}.json`;
  console.log(`${key}: ${address}`);
  let rawData: Buffer;

  try {
    rawData = fs.readFileSync(addressFile);
    const object = JSON.parse(rawData.toString() || "{}");
    object[key] = address;
    fs.writeFileSync(addressFile, JSON.stringify(object, null, 2));
  } catch (error) {
    fs.writeFileSync(addressFile, `{"${key}": "${address}"}`);
  }
};

export const getAddress = (key: ContractName, network: string = "mainnet") => {
  const rawData = fs.readFileSync(`./deployed_address/${network}.json`);
  const object = JSON.parse(rawData.toString());
  return object[key];
};

export const verifyContract = async (address: string, args?: any[]) => {
  console.log("VERIFYING CONTRACT");
  console.log({
    address,
    args,
  });

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: args,
    });
    console.log("verified successfully");
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
};
