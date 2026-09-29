import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "0x" + "a".repeat(64);
const ETHERSCAN_API = process.env.ETHERSCAN_API_KEY ?? "";
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // ── Local ────────────────────────────────────────────────────────────────
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ── Testnets ─────────────────────────────────────────────────────────────
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
    "polygon-amoy": {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
    },
    "arbitrum-sepolia": {
      url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 421614,
    },
    "base-sepolia": {
      url: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
    },

    // ── Mainnets ─────────────────────────────────────────────────────────────
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 1,
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 137,
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 42161,
    },
    base: {
      url: `https://mainnet.base.org`,
      accounts: [PRIVATE_KEY],
      chainId: 8453,
    },
  },

  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API,
      sepolia: ETHERSCAN_API,
      polygon: process.env.POLYGONSCAN_API_KEY ?? "",
      arbitrumOne: process.env.ARBISCAN_API_KEY ?? "",
      base: process.env.BASESCAN_API_KEY ?? "",
    },
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
