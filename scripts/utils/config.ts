import { DateTime } from "luxon";

const ONE_DAY_SECONDS = 60 * 60 * 24;
const EPOCH_ZERO_START = Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const config = {
  YSK: {
    MINT_MAX_PERCENT: 2,
    MINTING_RESTRICTED_BEFORE: EPOCH_ZERO_START,
  },
  VOTING_DELAY_BLOCKS: 50,
};

export function addYear(timestamp: number, to = 1) {
  return DateTime.fromSeconds(timestamp).plus({ years: to }).toSeconds();
}
