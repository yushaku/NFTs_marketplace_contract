import FormData from "form-data";
import fetch from "node-fetch";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

const uploadImage = async (path: string) => {
  try {
    const data = new FormData();
    data.append("file", fs.createReadStream(path));
    data.append("pinataMetadata", '{"name": "pinnie"}');

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: data,
    });
    const resData = (await res.json()) as any;
    console.log("File uploaded, CID:", resData.IpfsHash);
    return resData.IpfsHash;
  } catch (error) {
    console.log(error);
  }
};

const uploadMetadata = async (
  name: string,
  description: string,
  external_url: string,
  CID: string
) => {
  try {
    const data = JSON.stringify({
      pinataContent: {
        name: `${name}`,
        description: `${description}`,
        external_url: `${external_url}`,
        image: `ipfs://${CID}`,
      },
      pinataMetadata: {
        name: "Pinnie NFT Metadata",
      },
    });

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: data,
    });
    const resData = (await res.json()) as { IpfsHash: string };
    console.log("Metadata uploaded, CID:", resData.IpfsHash);
    return resData.IpfsHash;
  } catch (error) {
    console.log(error);
  }
};

const mintNft = async (CID: string, wallet: string) => {
  try {
    const data = JSON.stringify({
      recipient: `sepolia:${wallet}`,
      metadata: `https://gateway.pinata.cloud/ipfs/${CID}`,
    });
    const res = await fetch(
      "https://staging.crossmint.com/api/2022-06-09/collections/default/nfts",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-client-secret": `${process.env.CROSSMINT_CLIENT_SECRET}`,
          "x-project-id": `${process.env.CROSSMINT_PROJECT_ID}`,
        },
        body: data,
      }
    );
    const resData = (await res.json()) as any;
    const contractAddress = resData.onChain.contractAddress;
    console.log("NFT Minted, smart contract:", contractAddress);
    console.log(
      `View NFT at https://testnets.opensea.io/assets/mumbai/${contractAddress}`
    );
  } catch (error) {
    console.log(error);
  }
};

const main = async (
  filePath: string,
  name: string,
  description: string,
  external_url: string,
  wallet: string
) => {
  try {
    const imageCID = await uploadImage(filePath);
    const metadataCID = await uploadMetadata(
      name,
      description,
      external_url,
      imageCID
    );

    if (!metadataCID) return;
    await mintNft(metadataCID!, wallet);
  } catch (error) {
    console.log(error);
  }
};

main(
  "../images/",
  "Yushaku",
  "A Pinata NFT made with Crossmint and Pinata",
  "https://pinata.cloud",
  "0x4aBfCf64bB323CC8B65e2E69F2221B14943C6EE1"
);
