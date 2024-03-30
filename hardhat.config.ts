import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import dotenv from "dotenv";

dotenv.config();
const {
  WALLET_PRIVATE_KEY = "",
  ETHERSCAN_API_KEY = "",
  ARBITRUM_API_KEY = "",
  BNB_API_KEY = "",
  ALCHEMY_API_SEPOLIA = "",
  POLYGON_SCAN = "",
  ALCHEMY_API_MAINET = "",
  COIN_MARKETCAP_API_KEY = "",
  INFURA_KEY = "",
  REPORT_GAS = false,
} = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  typechain: {
    outDir: "./typechain",
  },
  networks: {
    sepolia: {
      url: ALCHEMY_API_SEPOLIA,
      chainId: 11155111,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      chainId: 5,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    mainnet: {
      url: ALCHEMY_API_MAINET,
      chainId: 1,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
      chainId: 42161,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    arbitrum_goerli: {
      url: `https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`,
      chainId: 421613,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    arbitrum_sepolia: {
      url: `https://arbitrum-sepolia.infura.io/v3/${INFURA_KEY}`,
      chainId: 421614,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    bnb: {
      url: "https://binance.llamarpc.com",
      chainId: 56,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    bnb_testnet: {
      url: "https://bsc-testnet.publicnode.com",
      chainId: 97,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`,
      chainId: 80001,
      accounts: [`0x${WALLET_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY!,
      sepolia: ETHERSCAN_API_KEY!,
      polygonMumbai: POLYGON_SCAN!,
      bsc_testnet: BNB_API_KEY!,
      arbitrum: ARBITRUM_API_KEY!,
    },
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
