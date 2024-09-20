import { DateTime } from "luxon";

export const ONE_HOUR = 60 * 60;
export const ONE_DAY_SECONDS = 24 * ONE_HOUR;
export const ONE_DAY_BLOCKS = 6570; // Assume 13s per block
export const EPOCH_ZERO_START = Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export enum ContractName {
  ShopPayment = "ShopPayment",
  YuToken = "YuToken",
  USDT = "USDT",
  YuGovernor = "YuGovernor",
  ShortExecutor = "ShortExecutor",
  LongExecutor = "LongExecutor",
  NftFactory = "NftFactory",
  NftMarket = "NftMarket",
}

export const config = {
  YSK: {
    MINT_MAX_PERCENT: 2,
    MINTING_RESTRICTED_BEFORE: EPOCH_ZERO_START,
  },
  VOTING_DELAY_BLOCKS: 50,
  LONG_TIMELOCK: {
    DELAY: 7 * ONE_HOUR,
    GRACE_PERIOD: ONE_DAY_SECONDS * 7,
    MINIMUM_DELAY: 7 * ONE_HOUR,
    MAXIMUM_DELAY: 21 * ONE_HOUR,
    PROPOSITION_THRESHOLD: 200, // block
    VOTING_DURATION_BLOCKS: ONE_DAY_BLOCKS * 10,
    VOTE_DIFFERENTIAL: 1000,
    MINIMUM_QUORUM: 1000,
  },
  SHORT_TIMELOCK: {
    DELAY: 2 * ONE_HOUR,
    GRACE_PERIOD: ONE_DAY_SECONDS * 7,
    MINIMUM_DELAY: 2 * ONE_HOUR,
    MAXIMUM_DELAY: 7 * ONE_HOUR,
    PROPOSITION_THRESHOLD: 50,
    VOTING_DURATION_BLOCKS: ONE_DAY_BLOCKS * 4,
    VOTE_DIFFERENTIAL: 50,
    MINIMUM_QUORUM: 200,
  },
};

export function addYear(timestamp: number, to = 1) {
  return DateTime.fromSeconds(timestamp).plus({ years: to }).toSeconds();
}
