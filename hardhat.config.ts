import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import dotenv from "dotenv";

dotenv.config();
const {
  WALLET_PRIVATE_KEY = "",
  ETHERSCAN_API_KEY = "",
  ALCHEMY_API_SEPOLIA = "",
  ALCHEMY_API_GOERLI = "",
  COIN_MARKETCAP_API_KEY = "",
  REPORT_GAS = false,
} = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  typechain: {
    outDir: "./typechain",
  },
  networks: {
    ropsten: {
      url: "",
      accounts: [WALLET_PRIVATE_KEY],
    },
    sepolia: {
      url: ALCHEMY_API_SEPOLIA,
      chainId: 11155111,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    goerli: {
      url: ALCHEMY_API_GOERLI,
      chainId: 5,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: Boolean(REPORT_GAS),
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COIN_MARKETCAP_API_KEY,
    currency: "USD",
    token: "ETH",
  },
};

export default config;
