import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { ConditionalEscrow, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConditionalEscrow", function () {
  // Constants
  const AMOUNT = ethers.parseUnits("100", 6); // 100 USDC (6 decimals)
  const MARKET_ID = "0xabc123def456";
  const SEVEN_DAYS = 7 * 24 * 60 * 60; // 7 days in seconds

  // Fixture: Deploy contracts and set up initial state
  async function deployEscrowFixture() {
    // Get signers
    const [owner, resolver, depositor, beneficiary, otherUser] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy() as unknown as MockUSDC;

    // Deploy ConditionalEscrow
    const ConditionalEscrow = await ethers.getContractFactory("ConditionalEscrow");
    const escrow = await ConditionalEscrow.deploy(
      await usdc.getAddress(),
      resolver.address
    ) as unknown as ConditionalEscrow;

    // Mint USDC to depositor for testing
    await usdc.mint(depositor.address, AMOUNT * 100n); // 10,000 USDC

    return { escrow, usdc, owner, resolver, depositor, beneficiary, otherUser };
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      const { escrow, usdc } = await loadFixture(deployEscrowFixture);
      expect(await escrow.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct resolver", async function () {
      const { escrow, resolver } = await loadFixture(deployEscrowFixture);
      expect(await escrow.resolver()).to.equal(resolver.address);
    });

    it("Should set the correct owner", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should start with zero escrows", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.escrowCount()).to.equal(0);
    });

    it("Should revert if USDC address is zero", async function () {
      const [, resolver] = await ethers.getSigners();
      const ConditionalEscrow = await ethers.getContractFactory("ConditionalEscrow");
      
      await expect(
        ConditionalEscrow.deploy(ethers.ZeroAddress, resolver.address)
      ).to.be.revertedWithCustomError(ConditionalEscrow, "InvalidAddress");
    });

    it("Should revert if resolver address is zero", async function () {
      const { usdc } = await loadFixture(deployEscrowFixture);
      const ConditionalEscrow = await ethers.getContractFactory("ConditionalEscrow");
      
      await expect(
        ConditionalEscrow.deploy(await usdc.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(ConditionalEscrow, "InvalidAddress");
    });
  });

  // ============ Create Escrow Tests ============

  describe("createEscrow", function () {
    it("Should create an escrow successfully", async function () {
      const { escrow, usdc, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      // Approve USDC spending
      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);

      // Create escrow
      await expect(
        escrow.connect(depositor).createEscrow(
          beneficiary.address,
          AMOUNT,
          MARKET_ID,
          true // Expects YES to win
        )
      )
        .to.emit(escrow, "EscrowCreated")
        .withArgs(0, depositor.address, beneficiary.address, AMOUNT, MARKET_ID, true);

      // Verify escrow data
      const e = await escrow.getEscrow(0);
      expect(e.depositor).to.equal(depositor.address);
      expect(e.beneficiary).to.equal(beneficiary.address);
      expect(e.amount).to.equal(AMOUNT);
      expect(e.marketId).to.equal(MARKET_ID);
      expect(e.expectedOutcomeYes).to.be.true;
      expect(e.status).to.equal(0); // Active

      // Verify USDC was transferred
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
    });

    it("Should increment escrow count", async function () {
      const { escrow, usdc, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT * 3n);

      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "market1", true);
      expect(await escrow.escrowCount()).to.equal(1);

      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "market2", false);
      expect(await escrow.escrowCount()).to.equal(2);
    });

    it("Should revert if beneficiary is zero address", async function () {
      const { escrow, usdc, depositor } = await loadFixture(deployEscrowFixture);

      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);

      await expect(
        escrow.connect(depositor).createEscrow(ethers.ZeroAddress, AMOUNT, MARKET_ID, true)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert if beneficiary is self", async function () {
      const { escrow, usdc, depositor } = await loadFixture(deployEscrowFixture);

      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);

      await expect(
        escrow.connect(depositor).createEscrow(depositor.address, AMOUNT, MARKET_ID, true)
      ).to.be.revertedWithCustomError(escrow, "CannotEscrowToSelf");
    });

    it("Should revert if amount is zero", async function () {
      const { escrow, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(depositor).createEscrow(beneficiary.address, 0, MARKET_ID, true)
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("Should revert if market ID is empty", async function () {
      const { escrow, usdc, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);

      await expect(
        escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "", true)
      ).to.be.revertedWithCustomError(escrow, "InvalidMarketId");
    });

    it("Should revert if USDC not approved", async function () {
      const { escrow, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      // Don't approve - should fail
      await expect(
        escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, MARKET_ID, true)
      ).to.be.reverted;
    });
  });

  // ============ Resolve Escrow Tests ============

  describe("resolveEscrow", function () {
    async function createEscrowFixture() {
      const fixture = await loadFixture(deployEscrowFixture);
      const { escrow, usdc, depositor, beneficiary } = fixture;

      // Create an escrow expecting YES to win
      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, MARKET_ID, true);

      return fixture;
    }

    it("Should pay beneficiary when outcome matches expected (YES)", async function () {
      const { escrow, usdc, resolver, beneficiary } = await createEscrowFixture();

      const beneficiaryBalanceBefore = await usdc.balanceOf(beneficiary.address);

      // Resolve: YES won, expected YES → beneficiary wins
      await expect(escrow.connect(resolver).resolveEscrow(0, true))
        .to.emit(escrow, "EscrowResolved")
        .withArgs(0, beneficiary.address, AMOUNT, true);

      // Verify beneficiary received funds
      expect(await usdc.balanceOf(beneficiary.address)).to.equal(
        beneficiaryBalanceBefore + AMOUNT
      );

      // Verify status updated
      const e = await escrow.getEscrow(0);
      expect(e.status).to.equal(1); // Resolved
    });

    it("Should refund depositor when outcome doesn't match (NO won, expected YES)", async function () {
      const { escrow, usdc, resolver, depositor, beneficiary } = await createEscrowFixture();

      const depositorBalanceBefore = await usdc.balanceOf(depositor.address);

      // Resolve: NO won, expected YES → depositor gets refund
      await escrow.connect(resolver).resolveEscrow(0, false);

      // Verify depositor received funds back
      expect(await usdc.balanceOf(depositor.address)).to.equal(
        depositorBalanceBefore + AMOUNT
      );

      // Verify beneficiary got nothing
      expect(await usdc.balanceOf(beneficiary.address)).to.equal(0);
    });

    it("Should refund depositor when outcome matches expected NO", async function () {
      const { escrow, usdc, resolver, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      // Create escrow expecting NO to win
      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, MARKET_ID, false);

      const depositorBalanceBefore = await usdc.balanceOf(depositor.address);

      // Resolve: YES won, expected NO → depositor gets refund
      await escrow.connect(resolver).resolveEscrow(0, true);

      expect(await usdc.balanceOf(depositor.address)).to.equal(
        depositorBalanceBefore + AMOUNT
      );
    });

    it("Should pay beneficiary when expected NO and NO wins", async function () {
      const { escrow, usdc, resolver, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      // Create escrow expecting NO to win
      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, MARKET_ID, false);

      // Resolve: NO won, expected NO → beneficiary wins
      await escrow.connect(resolver).resolveEscrow(0, false);

      expect(await usdc.balanceOf(beneficiary.address)).to.equal(AMOUNT);
    });

    it("Should revert if caller is not resolver", async function () {
      const { escrow, depositor } = await createEscrowFixture();

      await expect(
        escrow.connect(depositor).resolveEscrow(0, true)
      ).to.be.revertedWithCustomError(escrow, "OnlyResolver");
    });

    it("Should revert if escrow doesn't exist", async function () {
      const { escrow, resolver } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(resolver).resolveEscrow(999, true)
      ).to.be.revertedWithCustomError(escrow, "EscrowDoesNotExist");
    });

    it("Should revert if escrow already resolved", async function () {
      const { escrow, resolver } = await createEscrowFixture();

      // Resolve once
      await escrow.connect(resolver).resolveEscrow(0, true);

      // Try to resolve again
      await expect(
        escrow.connect(resolver).resolveEscrow(0, false)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotActive");
    });
  });

  // ============ Batch Resolve Tests ============

  describe("resolveEscrowBatch", function () {
    it("Should resolve multiple escrows in one transaction", async function () {
      const { escrow, usdc, resolver, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      // Create 3 escrows
      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT * 3n);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "market1", true);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "market2", false);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "market3", true);

      // Resolve all three: YES, NO, YES outcomes
      await escrow.connect(resolver).resolveEscrowBatch([0, 1, 2], [true, false, true]);

      // Escrow 0: expected YES, got YES → beneficiary
      // Escrow 1: expected NO, got NO → beneficiary
      // Escrow 2: expected YES, got YES → beneficiary
      expect(await usdc.balanceOf(beneficiary.address)).to.equal(AMOUNT * 3n);
    });

    it("Should skip invalid escrows without reverting", async function () {
      const { escrow, usdc, resolver, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      // Create 1 escrow
      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, "market1", true);

      // Try to resolve escrows 0, 999 (999 doesn't exist)
      // Should succeed and just skip 999
      await expect(
        escrow.connect(resolver).resolveEscrowBatch([0, 999], [true, true])
      ).to.not.be.reverted;

      expect(await usdc.balanceOf(beneficiary.address)).to.equal(AMOUNT);
    });
  });

  // ============ Emergency Refund Tests ============

  describe("emergencyRefund", function () {
    async function createEscrowFixture() {
      const fixture = await loadFixture(deployEscrowFixture);
      const { escrow, usdc, depositor, beneficiary } = fixture;

      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, MARKET_ID, true);

      return fixture;
    }

    it("Should revert before timeout", async function () {
      const { escrow, depositor } = await createEscrowFixture();

      await expect(
        escrow.connect(depositor).emergencyRefund(0)
      ).to.be.revertedWithCustomError(escrow, "TimeoutNotReached");
    });

    it("Should succeed after timeout", async function () {
      const { escrow, usdc, depositor } = await createEscrowFixture();

      // Fast forward time past timeout
      await time.increase(SEVEN_DAYS + 1);

      const balanceBefore = await usdc.balanceOf(depositor.address);

      await expect(escrow.connect(depositor).emergencyRefund(0))
        .to.emit(escrow, "EscrowRefunded")
        .withArgs(0, depositor.address, AMOUNT, "timeout");

      expect(await usdc.balanceOf(depositor.address)).to.equal(balanceBefore + AMOUNT);

      // Verify status
      const e = await escrow.getEscrow(0);
      expect(e.status).to.equal(2); // Refunded
    });

    it("Should allow owner to refund after timeout", async function () {
      const { escrow, usdc, owner, depositor } = await createEscrowFixture();

      await time.increase(SEVEN_DAYS + 1);

      const balanceBefore = await usdc.balanceOf(depositor.address);

      // Owner calls refund (not depositor)
      await escrow.connect(owner).emergencyRefund(0);

      // Funds still go to depositor
      expect(await usdc.balanceOf(depositor.address)).to.equal(balanceBefore + AMOUNT);
    });

    it("Should revert if unauthorized caller after timeout", async function () {
      const { escrow, otherUser } = await createEscrowFixture();

      await time.increase(SEVEN_DAYS + 1);

      await expect(
        escrow.connect(otherUser).emergencyRefund(0)
      ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("Should revert if escrow already resolved", async function () {
      const { escrow, resolver, depositor } = await createEscrowFixture();

      // Resolve the escrow
      await escrow.connect(resolver).resolveEscrow(0, true);

      await time.increase(SEVEN_DAYS + 1);

      await expect(
        escrow.connect(depositor).emergencyRefund(0)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotActive");
    });
  });

  // ============ View Function Tests ============

  describe("View Functions", function () {
    it("canEmergencyRefund should return correct status", async function () {
      const { escrow, usdc, depositor, beneficiary } = await loadFixture(deployEscrowFixture);

      await usdc.connect(depositor).approve(await escrow.getAddress(), AMOUNT);
      await escrow.connect(depositor).createEscrow(beneficiary.address, AMOUNT, MARKET_ID, true);

      // Before timeout
      let [canRefund, reason] = await escrow.canEmergencyRefund(0);
      expect(canRefund).to.be.false;
      expect(reason).to.equal("Timeout period not reached");

      // After timeout
      await time.increase(SEVEN_DAYS + 1);
      [canRefund, reason] = await escrow.canEmergencyRefund(0);
      expect(canRefund).to.be.true;
      expect(reason).to.equal("Refund available");
    });

    it("canEmergencyRefund should handle non-existent escrow", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);

      const [canRefund, reason] = await escrow.canEmergencyRefund(999);
      expect(canRefund).to.be.false;
      expect(reason).to.equal("Escrow does not exist");
    });
  });

  // ============ Admin Function Tests ============

  describe("Admin Functions", function () {
    it("Should allow owner to update resolver", async function () {
      const { escrow, owner, otherUser } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(owner).setResolver(otherUser.address))
        .to.emit(escrow, "ResolverUpdated");

      expect(await escrow.resolver()).to.equal(otherUser.address);
    });

    it("Should revert if non-owner tries to update resolver", async function () {
      const { escrow, depositor, otherUser } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(depositor).setResolver(otherUser.address)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("Should revert if setting resolver to zero address", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(
        escrow.connect(owner).setResolver(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });
  });
});