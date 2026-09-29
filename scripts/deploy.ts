import { ethers } from "hardhat";

/**
 * Deploy script for OnlyHold Smart Contracts
 *
 * Deploys in this order:
 *   1. MockUSDC (testnet only — skip on mainnet, use real USDC)
 *   2. OnlyHoldFactory
 *
 * Individual OnlyHoldNFT and OnlyHoldSubscription contracts are deployed
 * PER CREATOR via OnlyHoldFactory.launchCreator(), not here.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network localhost
 *   npx hardhat run scripts/deploy.ts --network sepolia
 *   npx hardhat run scripts/deploy.ts --network polygon
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════");
  console.log("  OnlyHold Contract Deployment");
  console.log("═══════════════════════════════════════");
  console.log("Network  :", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer :", deployer.address);
  console.log(
    "Balance  :",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );
  console.log("");

  // ── Step 1: Stablecoin ─────────────────────────────────────────────────────
  // On mainnet/production, use the real USDC address for the chain.
  const REAL_USDC: Record<string, string> = {
    homestead:  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum mainnet
    polygon:    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
    arbitrum:   "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
    base:       "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  };

  let usdcAddress: string;
  let mockUSDC;

  if (REAL_USDC[network.name]) {
    usdcAddress = REAL_USDC[network.name];
    console.log(`✓ Using real USDC at ${usdcAddress}`);
  } else {
    // Deploy mock USDC for local / testnets
    console.log("Deploying MockUSDC (testnet) ...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log(`✓ MockUSDC deployed at:     ${usdcAddress}`);
  }

  // ── Step 2: Factory ────────────────────────────────────────────────────────
  const TREASURY = process.env.TREASURY_ADDRESS ?? deployer.address; // fallback to deployer on testnet
  const USDC_DECIMALS = 6;

  console.log("\nDeploying OnlyHoldFactory ...");
  const Factory = await ethers.getContractFactory("OnlyHoldFactory");
  const factory = await Factory.deploy(TREASURY, usdcAddress, USDC_DECIMALS);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✓ OnlyHoldFactory deployed at: ${factoryAddress}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("  Deployment Summary");
  console.log("═══════════════════════════════════════");
  if (mockUSDC) {
    console.log(`MockUSDC:         ${usdcAddress}`);
  }
  console.log(`OnlyHoldFactory:  ${factoryAddress}`);
  console.log(`Treasury:         ${TREASURY}`);
  console.log("");
  console.log("Add these to your .env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${network.chainId}`);

  // ── Demo: Register a test creator ─────────────────────────────────────────
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("\n─── Demo: Registering test creator ────");
    const tx = await factory.launchCreator(
      "demo_creator",               // username
      "ipfs://QmTest",              // metadataURI
      true,                         // enableNFT
      "Demo Creator NFT",           // nftName
      "DEMO",                       // nftSymbol
      ethers.parseEther("0.05"),    // nftMintPrice (0.05 ETH)
      100,                          // nftMaxSupply
      "ipfs://QmDemoBase/",         // nftBaseURI
      true,                         // enableSub
      10_000_000n,                  // monthlyPrice (10 USDC, 6 decimals)
      ethers.ZeroAddress            // use default stablecoin
    );
    const receipt = await tx.wait();
    const event = receipt?.logs.find(
      (l: any) => l.fragment?.name === "CreatorLaunched"
    ) as any;

    if (event) {
      console.log(`✓ NFT Contract:  ${event.args.nftContract}`);
      console.log(`✓ Sub Contract:  ${event.args.subscriptionContract}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
