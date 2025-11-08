import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedDiceGame } from "../types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EncryptedDiceGame", function () {
  let diceGame: EncryptedDiceGame;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const EncryptedDiceGame = await ethers.getContractFactory("EncryptedDiceGame");
    diceGame = await EncryptedDiceGame.deploy();
    await diceGame.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await diceGame.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct constants", async function () {
      expect(await diceGame.PAYOUT_MULTIPLIER()).to.equal(195);
      expect(await diceGame.BASIS_POINTS()).to.equal(100);
      expect(await diceGame.MIN_STAKE()).to.equal(ethers.parseEther("1"));
      expect(await diceGame.MAX_STAKE()).to.equal(ethers.parseEther("1000"));
    });

    it("Should start with zero game counter", async function () {
      expect(await diceGame.gameCounter()).to.equal(0);
    });
  });

  describe("Token Management", function () {
    it("Should allow minting tokens", async function () {
      const mintAmount = ethers.parseEther("100");
      await diceGame.connect(player1).mintTokens(mintAmount);

      // Check event was emitted
      const balance = await diceGame.getBalance(player1.address);
      expect(balance).to.not.equal(ethers.ZeroHash);
    });

    it("Should allow ETH to ROLL swap", async function () {
      const ethAmount = ethers.parseEther("1");
      await expect(diceGame.connect(player1).swapETHForROLL({ value: ethAmount }))
        .to.emit(diceGame, "TokensSwapped")
        .withArgs(player1.address, ethAmount, ethAmount * 1000n, true);
    });

    it("Should reject mint of too many tokens", async function () {
      const tooMuchAmount = ethers.parseEther("20000");
      await expect(diceGame.connect(player1).mintTokens(tooMuchAmount)).to.be.revertedWith("Max mint is 10000 ROLL");
    });
  });

  describe("Game Logic", function () {
    beforeEach(async function () {
      // Mint some tokens for testing
      const mintAmount = ethers.parseEther("1000");
      await diceGame.connect(player1).mintTokens(mintAmount);
    });

    it("Should reject invalid dice count", async function () {
      const invalidDiceCount = 4;
      const emptyProof = "0x";

      await expect(
        diceGame.connect(player1).startGame(
          invalidDiceCount,
          ethers.ZeroHash as any, // Mock encrypted prediction
          emptyProof,
          ethers.ZeroHash as any, // Mock encrypted stake
          emptyProof,
        ),
      ).to.be.revertedWith("Dice count must be 1-3");
    });

    it("Should create game with valid parameters", async function () {
      const diceCount = 2;
      const emptyProof = "0x";

      // Note: In real implementation, these would be properly encrypted
      await expect(
        diceGame.connect(player1).startGame(
          diceCount,
          ethers.ZeroHash as any, // Mock encrypted prediction
          emptyProof,
          ethers.ZeroHash as any, // Mock encrypted stake
          emptyProof,
        ),
      ).to.emit(diceGame, "GameStarted");

      expect(await diceGame.gameCounter()).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to withdraw ETH", async function () {
      // Send some ETH to contract
      await player1.sendTransaction({
        to: await diceGame.getAddress(),
        value: ethers.parseEther("1"),
      });

      await expect(diceGame.connect(player1).withdrawETH()).to.be.revertedWith("Only owner can call this function");

      // Owner should be able to withdraw
      await expect(diceGame.connect(owner).withdrawETH()).to.not.be.reverted;
    });
  });
});
