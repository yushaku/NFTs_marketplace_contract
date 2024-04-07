import bnb_testnet from "../deployed_address/bnb_testnet.json";
import mumbai from "../deployed_address/mumbai.json";

export const addresses = {
  97: bnb_testnet,
  80001: mumbai,
} as const;
