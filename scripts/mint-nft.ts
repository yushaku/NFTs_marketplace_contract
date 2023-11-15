require("dotenv").config();
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const API_URL =
  process.env.ALCHEMY_API_URL ??
  "https://eth-sepolia.g.alchemy.com/v2/pysNGjGQXYyYdb9cll4KZ6gOn5ebalaN";
const PUBLIC_KEY =
  process.env.WALLET_PUBLIC_KEY ?? "0x4aBfCf64bB323CC8B65e2E69F2221B14943C6EE1";
const PRIVATE_KEY =
  process.env.WALLET_PRIVATE_KEY ??
  "13d8c2dc8286cf55199a5ea81371813b1c09ae0426f4fb922611b5ab264d44f2";

console.table({
  API_URL,
  PUBLIC_KEY,
  PRIVATE_KEY,
});

const contract = require("../artifacts/contracts/PoliteCatCollection.sol/NFTCollectible.json");
const contractAddress = "0xb863F00Dd2e6f066F8Ec84014c6df61EEC41Ef1A";

const web3 = createAlchemyWeb3(API_URL);
const nftContract = new web3.eth.Contract(contract.abi, contractAddress);

async function mintNFT(tokenURI) {
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, "latest"); //get latest nonce

  const tx = {
    from: PUBLIC_KEY,
    to: contractAddress,
    nonce: nonce,
    gas: 500000,
    data: nftContract.methods.mintNFT(PUBLIC_KEY, tokenURI).encodeABI(),
  };

  const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  signPromise
    .then((signedTx) => {
      web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        function (err, hash) {
          if (!err) {
            console.log(
              "The hash of your transaction is: ",
              hash,
              "\nCheck Alchemy's Mempool to view the status of your transaction!"
            );
          } else {
            console.log("Something went wrong:", err);
          }
        }
      );
    })
    .catch((err) => {
      console.log(" Promise failed:", err);
    });
}

mintNFT("ipfs://QmY95TTNZV3Hg9fJ3hAobZZZPXKYHWZiAYzV5YHxhTaaaP/1");
