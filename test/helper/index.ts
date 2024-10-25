export * from "./contant";

import { parseEther } from "ethers";

export function toWei(value: number) {
  return parseEther(value.toString());
}
