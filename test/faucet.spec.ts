import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { AddressLike, parseEther, parseUnits } from "ethers";
import { ethers } from "hardhat";
import {
  FaucetToken,
  FaucetToken__factory,
  USDT,
  USDT__factory,
  YSK,
  YSK__factory,
} from "../typechain";

const timeTraver = (seconds: number | bigint) =>
  ethers.provider.send("evm_increaseTime", [seconds]);

describe("Faucet", function () {
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;

  let yuToken: YSK;
  let yuTokenAddress: AddressLike;
  let usdToken: USDT;
  let usdtAddress: AddressLike;

  let faucet: FaucetToken;
  let faucetAddress: AddressLike;

  beforeEach(async () => {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    yuToken = await new YSK__factory(owner).deploy();
    yuTokenAddress = await yuToken.getAddress();
    expect(yuTokenAddress).not.eq(null, "Deploy YSK is failed.");

    usdToken = await new USDT__factory(owner).deploy();
    usdtAddress = await usdToken.getAddress();
    expect(usdtAddress).not.eq(null, "Deploy USDT is failed.");

    faucet = await new FaucetToken__factory(owner).deploy(24 * 60 * 60);
    faucetAddress = await faucet.getAddress();
    expect(faucetAddress).not.eq(null, "Deploy faucet is failed.");
  });

  describe("--- PAYABLE TOKEN ---", () => {
    it("mint and fund", async () => {
      await faucet.connect(owner).addToken(yuTokenAddress, parseEther("10"));
      await faucet.connect(owner).addToken(usdtAddress, parseUnits("10", 6));

      await usdToken.connect(owner).mint(faucetAddress, parseEther("10000"));
      await yuToken.connect(owner).mint(faucetAddress, parseUnits("10000", 6));

      const isOk1 = await faucet.allowedToken(usdtAddress);
      const isOk2 = await faucet.allowedToken(yuTokenAddress);
      expect(isOk1).to.true;
      expect(isOk2).to.true;

      const tx = await faucet.connect(user1).requestTokens();
      await expect(tx).to.changeTokenBalance(
        usdToken,
        user1.address,
        parseUnits("10", 6),
      );
      expect(tx).to.changeTokenBalance(
        yuToken,
        user1.address,
        parseEther("10"),
      );

      await expect(faucet.connect(user1).requestTokens()).to.be.revertedWith(
        "Wait time has not passed",
      );

      await timeTraver(20 * 60 * 60);

      await expect(faucet.connect(user1).requestTokens()).to.be.revertedWith(
        "Wait time has not passed",
      );

      await timeTraver(5 * 60 * 60);

      const tx2 = await faucet.connect(user1).requestTokens();
      await expect(tx2).to.changeTokenBalance(
        usdToken,
        user1.address,
        parseUnits("10", 6),
      );
      expect(tx2).to.changeTokenBalance(
        yuToken,
        user1.address,
        parseEther("10"),
      );
    });
  });
});
