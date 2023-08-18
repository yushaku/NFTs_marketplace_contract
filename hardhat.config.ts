import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import dotenv from "dotenv";

dotenv.config();
const {
  WALLET_PRIVATE_KEY = "",
  ETHERSCAN_API_KEY = "",
  ALCHEMY_API_URL = "",
} = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    ropsten: {
      url: "",
      accounts: [WALLET_PRIVATE_KEY],
    },
    sepolia: {
      url: ALCHEMY_API_URL,
      chainId: 11155111,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
