import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signers } from "./onChain.test";

describe("Digital signature whitelist", function () {
  before(async function () {
    this.signers = {} as Signers;
    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user = signers[1];
    this.signers.all = signers.slice(2);
    this.contract = await ethers.deployContract(
      "DigitalSignatureWhitelistContract"
    );
  });

  beforeEach(async function () {
    this.signMessage = async (address: string): Promise<string> => {
      const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY!);
      const addressHash = ethers.solidityPackedKeccak256(
        ["address"],
        [address.toLowerCase()]
      );

      // Sign the hashed address
      const messageBytes = ethers.getBytes(addressHash);
      return signer.signMessage(messageBytes);
    };
  });

  it("Should revert SIGNATURE_VALIDATION_FAILED", async function () {
    const signature = await this.signMessage(this.signers.user.address);

    await expect(
      this.contract.connect(this.signers.all[0]).whitelistFunc(signature)
    ).to.be.revertedWith("SIGNATURE_VALIDATION_FAILED");
  });

  it("Should pass whitelist check", async function () {
    const signature = await this.signMessage(this.signers.user.address);

    await expect(
      this.contract.connect(this.signers.user).whitelistFunc(signature)
    ).to.be.not.reverted;
  });
});
