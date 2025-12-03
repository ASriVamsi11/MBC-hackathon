import { ethers, run, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Contract addresses
  const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Get resolver address from environment
  const resolverAddress = process.env.RESOLVER_ADDRESS;
  if (!resolverAddress) {
    throw new Error("RESOLVER_ADDRESS not set in .env file");
  }

  // Determine which USDC to use based on network
  const isMainnet = network.name === "baseMainnet";
  const usdcAddress = isMainnet ? USDC_BASE_MAINNET : USDC_BASE_SEPOLIA;

  console.log("=".repeat(50));
  console.log("Deploying ConditionalEscrow");
  console.log("=".repeat(50));
  console.log(`Network: ${network.name}`);
  console.log(`USDC: ${usdcAddress}`);
  console.log(`Resolver: ${resolverAddress}`);
  console.log("");

  // Deploy
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      "No signers available. Please ensure PRIVATE_KEY is set in your .env file and matches the network."
    );
  }
  const deployer = signers[0];
  console.log(`Deploying from: ${deployer.address}`);
  const ConditionalEscrow = await ethers.getContractFactory("ConditionalEscrow", deployer);
  const escrow = await ConditionalEscrow.deploy(usdcAddress, resolverAddress);

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("✅ ConditionalEscrow deployed to:", escrowAddress);
  console.log("");

  // Wait for a few block confirmations before verifying
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await escrow.deploymentTransaction()?.wait(5);

    // Verify on BaseScan
    console.log("Verifying contract on BaseScan...");
    try {
      await run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [usdcAddress, resolverAddress],
      });
      console.log("✅ Contract verified on BaseScan");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified");
      } else {
        console.log("❌ Verification failed:", error.message);
      }
    }
  }

  console.log("Deployment script completed.");

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});