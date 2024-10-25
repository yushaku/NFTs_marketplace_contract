import { expect } from "chai";
import { Signer, keccak256, parseEther, toUtf8Bytes } from "ethers";
import { ethers } from "hardhat";
import {
  YSK,
  YSK__factory,
  YuGovernor,
  YuGovernor__factory,
} from "../typechain";
import { PROPOCAL_STATUS, VOTE } from "./helper";
import { ZERO_ADDRESS } from "../scripts/utils/config";

const timeTraver = (seconds: number | bigint) =>
  ethers.provider.send("evm_increaseTime", [seconds]);

const increaseBlock = async (blocks: number) => {
  const total = blocks / 1000;

  for (let i = 0; i < total; i++) {
    await ethers.provider.send("hardhat_mine", [`0x${(1000).toString(16)}`]); // Mines 1000 blocks
  }
};

describe("Governor", function () {
  let yuToken: YSK;
  let governor: YuGovernor;
  let owner: Signer;
  let proposer: Signer;
  let executor: Signer;
  let voter0: Signer;
  let voter1: Signer;
  let voter2: Signer;
  let voter3: Signer;

  let governorAddress: string;
  let yuTokenAddress: string;
  let timeLockAddress: string;
  const voteDelay = 86400n;

  beforeEach(async () => {
    [owner, proposer, executor, voter0, voter1, voter2, voter3] =
      await ethers.getSigners();
    yuToken = await new YSK__factory(owner).deploy();
    yuTokenAddress = await yuToken.getAddress();
    expect(yuTokenAddress).not.eq(null, "Deploy YSK is failed.");

    const Governor = new YuGovernor__factory(owner);
    governor = await Governor.deploy(yuTokenAddress, ZERO_ADDRESS);
    governorAddress = await governor.getAddress();

    const TimeLock = await ethers.getContractFactory("Timelock", owner);
    const timeLock = await TimeLock.deploy(
      voteDelay,
      [proposer],
      [executor],
      owner,
    );
    timeLockAddress = await timeLock.getAddress();
    expect(timeLockAddress).not.eq(null, "Deploy time lock is failed.");
  });

  it("should deploy success", async () => {
    console.log({
      yuTokenAddress,
      timeLockAddress,
      governorAddress,
    });
  });

  it("should allow token minting and delegation", async () => {
    await yuToken
      .connect(owner)
      .mint(await proposer.getAddress(), parseEther("1000"));

    expect(await yuToken.balanceOf(await proposer.getAddress())).to.equal(
      parseEther("1000"),
    );

    await yuToken.connect(proposer).delegate(await proposer.getAddress());
    expect(await yuToken.delegates(await proposer.getAddress())).to.equal(
      await proposer.getAddress(),
    );
  });

  it("should create a proposal and check its state", async () => {
    const proposerAdd = await proposer.getAddress();
    await yuToken.connect(owner).mint(proposerAdd, parseEther("10000"));
    // await timeTraver(voteDelay);

    const targets = [yuTokenAddress];
    const values = [0];
    const calldata = [
      yuToken.interface.encodeFunctionData("mint", [
        await voter1.getAddress(),
        parseEther("500"),
      ]),
    ];
    const description = "Proposal #1: Mint 500 tokens to airdrop";

    const tx = await governor
      .connect(proposer)
      .propose(targets, values, calldata, description);

    const [clock, delay, votingPeriod] = await Promise.all([
      governor.clock(),
      governor.votingDelay(),
      governor.votingPeriod(),
    ]);

    const proposalId = await governor.hashProposal(
      targets,
      values,
      calldata,
      keccak256(toUtf8Bytes(description)),
    );

    await expect(tx)
      .to.be.emit(governor, "ProposalCreated")
      .withArgs(
        proposalId,
        proposerAdd,
        targets,
        values,
        [""],
        calldata,
        clock + delay, // voteStart,
        clock + delay + votingPeriod, // voteEnd,
        description,
      );

    const state = await governor.state(proposalId);
    expect(state).to.be.eq(PROPOCAL_STATUS.PENDING);
  });

  it("should allow voting on a proposal", async () => {
    const description = "Proposal #2: Mint 1000 tokens to airdrop secondtime";
    const targets = [yuTokenAddress];
    const values = [0];
    const calldata = [
      yuToken.interface.encodeFunctionData("mint", [
        await voter1.getAddress(),
        parseEther("1000"),
      ]),
    ];

    await governor
      .connect(proposer)
      .propose(targets, values, calldata, description);

    const proposalId = await governor.hashProposal(
      targets,
      values,
      calldata,
      keccak256(toUtf8Bytes(description)),
    );

    const [clock, delay, votingPeriod] = await Promise.all([
      governor.clock(),
      governor.votingDelay(),
      governor.votingPeriod(),
    ]);

    const [proposalDeadline] = await Promise.all([
      governor.proposalDeadline(proposalId),
    ]);

    const block1 = await ethers.provider.getBlockNumber();

    await increaseBlock(Number(voteDelay));

    const block2 = await ethers.provider.getBlockNumber();
    const state = await governor.state(proposalId);

    expect(clock + delay).to.lt(BigInt(block2));
    expect(proposalDeadline).to.gt(BigInt(block2));

    console.log({
      block1,
      block2,
    });

    expect(state).to.be.eq(PROPOCAL_STATUS.ACTIVE);
    await governor.connect(proposer).castVote(proposalId, VOTE.FOR);

    const proposalVotes = await governor.proposalVotes(proposalId);
    console.log(proposalVotes);

    expect(proposalVotes).to.equal(1000);
  });

  it.skip("should queue and execute a proposal after it passes", async () => {
    const targets = [yuTokenAddress];
    const values = [0];
    const calldata = [
      yuToken.interface.encodeFunctionData("mint", [
        await voter1.getAddress(),
        500,
      ]),
    ];
    const description = "Proposal #3: Mint 500 tokens to buyer";

    const tx = await governor
      .connect(proposer)
      .propose(targets, values, calldata, description);
    const receipt = await tx.wait();
    // const proposalId = receipt.events?.[0].args?.proposalId;
    //
    // await ethers.provider.send("evm_mine", []); // Advance one block for voting delay
    //
    // await governor.connect(proposer).castVote(proposalId, 1);
    // await ethers.provider.send("evm_mine", []); // Advance for voting duration
    //
    // expect(await governor.state(proposalId)).to.equal(4); // ProposalState.Succeeded
    //
    // await governor.connect(executor).queue(proposalId);
    // await ethers.provider.send("evm_increaseTime", [86400]); // Increase time to bypass timelock delay
    // await governor.connect(executor).execute(proposalId);
    //
    // expect(await yuToken.balanceOf(await buyer.getAddress())).to.equal(500);
  });
});
