import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { OnlyHoldNFT, OnlyHoldSubscription, OnlyHoldFactory, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OnlyHold Smart Contracts", function () {
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let creator: SignerWithAddress;
  let fan1: SignerWithAddress;
  let fan2: SignerWithAddress;

  let mockUSDC: MockUSDC;
  let factory: OnlyHoldFactory;
  let nftContract: OnlyHoldNFT;
  let subContract: OnlyHoldSubscription;

  const MINT_PRICE = ethers.parseEther("0.05");
  const MONTHLY_PRICE = 10_000_000n; // 10 USDC (6 decimals)

  beforeEach(async () => {
    [owner, treasury, creator, fan1, fan2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDCFactory.deploy() as MockUSDC;

    // Faucet USDC to fans
    await mockUSDC.faucet(fan1.address, 1000_000_000n); // 1000 USDC
    await mockUSDC.faucet(fan2.address, 1000_000_000n);

    // Deploy Factory
    const FactoryFactory = await ethers.getContractFactory("OnlyHoldFactory");
    factory = await FactoryFactory.deploy(
      treasury.address,
      await mockUSDC.getAddress(),
      6
    ) as OnlyHoldFactory;

    // Register creator via factory
    const tx = await factory.connect(creator).launchCreator(
      "test_creator",
      "ipfs://QmTest",
      {
        enable: true,
        name: "Test Creator NFT",
        symbol: "TEST",
        mintPrice: MINT_PRICE,
        maxSupply: 0,
        baseURI: "ipfs://QmBase/",
      },
      {
        enable: true,
        monthlyPrice: MONTHLY_PRICE,
        customStablecoin: ethers.ZeroAddress,
      }
    );
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
      (l: any) => l.fragment?.name === "CreatorLaunched"
    ) as any;

    nftContract = await ethers.getContractAt("OnlyHoldNFT", event.args.nftContract) as OnlyHoldNFT;
    subContract = await ethers.getContractAt("OnlyHoldSubscription", event.args.subscriptionContract) as OnlyHoldSubscription;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // OnlyHoldNFT Tests
  // ════════════════════════════════════════════════════════════════════════════

  describe("OnlyHoldNFT", () => {
    it("should mint an NFT with correct payment", async () => {
      await expect(
        nftContract.connect(fan1).mint(fan1.address, "", { value: MINT_PRICE })
      ).to.emit(nftContract, "NFTMinted");

      expect(await nftContract.balanceOf(fan1.address)).to.equal(1);
      expect(await nftContract.isMember(fan1.address)).to.be.true;
    });

    it("should reject mint with insufficient payment", async () => {
      await expect(
        nftContract.connect(fan1).mint(fan1.address, "", {
          value: ethers.parseEther("0.01"),
        })
      ).to.be.revertedWithCustomError(nftContract, "InsufficientPayment");
    });

    it("should split revenue 95% creator / 5% treasury", async () => {
      const creatorBalBefore = await ethers.provider.getBalance(creator.address);
      const treasuryBalBefore = await ethers.provider.getBalance(treasury.address);

      await nftContract.connect(fan1).mint(fan1.address, "", { value: MINT_PRICE });

      const creatorBalAfter = await ethers.provider.getBalance(creator.address);
      const treasuryBalAfter = await ethers.provider.getBalance(treasury.address);

      const expectedCreator = (MINT_PRICE * 9500n) / 10000n;
      const expectedTreasury = (MINT_PRICE * 500n) / 10000n;

      expect(creatorBalAfter - creatorBalBefore).to.equal(expectedCreator);
      expect(treasuryBalAfter - treasuryBalBefore).to.equal(expectedTreasury);
    });

    it("non-member should return false for isMember()", async () => {
      expect(await nftContract.isMember(fan2.address)).to.be.false;
    });

    it("should allow owner to pause minting", async () => {
      await nftContract.connect(creator).setPaused(true);
      await expect(
        nftContract.connect(fan1).mint(fan1.address, "", { value: MINT_PRICE })
      ).to.be.revertedWithCustomError(nftContract, "MintingIsPaused");
    });

    it("should allow owner to airdrop NFTs", async () => {
      await nftContract.connect(creator).airdrop([fan1.address, fan2.address]);
      expect(await nftContract.balanceOf(fan1.address)).to.equal(1);
      expect(await nftContract.balanceOf(fan2.address)).to.equal(1);
    });

    it("should allow NFT transfer (tradeable)", async () => {
      await nftContract.connect(fan1).mint(fan1.address, "", { value: MINT_PRICE });
      await nftContract.connect(fan1).transferFrom(fan1.address, fan2.address, 0);
      expect(await nftContract.isMember(fan2.address)).to.be.true;
      expect(await nftContract.isMember(fan1.address)).to.be.false;
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // OnlyHoldSubscription Tests
  // ════════════════════════════════════════════════════════════════════════════

  describe("OnlyHoldSubscription", () => {
    beforeEach(async () => {
      // Approve subscription contract to spend fan1's USDC
      await mockUSDC
        .connect(fan1)
        .approve(await subContract.getAddress(), ethers.MaxUint256);
    });

    it("should subscribe for 1 month", async () => {
      await subContract.connect(fan1).subscribe(MONTHLY_PRICE);
      expect(await subContract.isSubscribed(fan1.address)).to.be.true;
    });

    it("should subscribe for 3 months and extend expiry", async () => {
      await subContract.connect(fan1).subscribe(MONTHLY_PRICE * 3n);
      const { remainingSeconds } = await subContract.getSubscription(fan1.address);
      // Should be ~3 months (90 days) in seconds
      expect(remainingSeconds).to.be.closeTo(90n * 24n * 3600n, 60n);
    });

    it("should reject non-multiple of monthly price", async () => {
      await expect(
        subContract.connect(fan1).subscribe(MONTHLY_PRICE + 1n)
      ).to.be.revertedWithCustomError(subContract, "NotMultipleOfMonthlyPrice");
    });

    it("should split revenue 95% creator / 5% platform", async () => {
      await subContract.connect(fan1).subscribe(MONTHLY_PRICE);

      const expectedCreator = (MONTHLY_PRICE * 9500n) / 10000n;
      const expectedPlatform = (MONTHLY_PRICE * 500n) / 10000n;

      expect(await subContract.pendingCreatorEarnings()).to.equal(expectedCreator);
      expect(await subContract.pendingPlatformFee()).to.equal(expectedPlatform);
    });

    it("creator can withdraw earnings", async () => {
      await subContract.connect(fan1).subscribe(MONTHLY_PRICE);

      const balBefore = await mockUSDC.balanceOf(creator.address);
      await subContract.connect(creator).withdrawEarnings();
      const balAfter = await mockUSDC.balanceOf(creator.address);

      const expectedCreator = (MONTHLY_PRICE * 9500n) / 10000n;
      expect(balAfter - balBefore).to.equal(expectedCreator);
    });

    it("fan can cancel and get refund for remaining whole months", async () => {
      await subContract.connect(fan1).subscribe(MONTHLY_PRICE * 3n);

      const balBefore = await mockUSDC.balanceOf(fan1.address);
      await subContract.connect(fan1).withdrawBalance();
      const balAfter = await mockUSDC.balanceOf(fan1.address);

      // Should get back ~2 months (3 deposited - ~0 elapsed immediately)
      // Refund is 2 months = 20 USDC (rounded down to whole months)
      expect(balAfter - balBefore).to.be.greaterThanOrEqual(MONTHLY_PRICE * 2n);
    });

    it("non-subscriber should show isSubscribed = false", async () => {
      expect(await subContract.isSubscribed(fan2.address)).to.be.false;
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // OnlyHoldFactory Tests
  // ════════════════════════════════════════════════════════════════════════════

  describe("OnlyHoldFactory", () => {
    it("should resolve username to creator address", async () => {
      const { creator: resolvedCreator } = await factory.resolveUsername("test_creator");
      expect(resolvedCreator).to.equal(creator.address);
    });

    it("should prevent duplicate username registration", async () => {
      await expect(
        factory.connect(fan1).launchCreator(
          "test_creator", // already taken
          "ipfs://QmFan",
          { enable: true, name: "Fan NFT", symbol: "FAN", mintPrice: MINT_PRICE, maxSupply: 0, baseURI: "ipfs://QmFanBase/" },
          { enable: false, monthlyPrice: 0n, customStablecoin: ethers.ZeroAddress }
        )
      ).to.be.revertedWithCustomError(factory, "UsernameTaken");
    });

    it("should prevent registering twice from same address", async () => {
      await expect(
        factory.connect(creator).launchCreator(
          "another_name",
          "ipfs://QmTest2",
          { enable: true, name: "Test2 NFT", symbol: "TST2", mintPrice: MINT_PRICE, maxSupply: 0, baseURI: "" },
          { enable: false, monthlyPrice: 0n, customStablecoin: ethers.ZeroAddress }
        )
      ).to.be.revertedWithCustomError(factory, "AlreadyRegistered");
    });

    it("checkAccess returns true after NFT mint", async () => {
      await nftContract.connect(fan1).mint(fan1.address, "", { value: MINT_PRICE });
      const { hasAccess, via } = await factory.checkAccess(creator.address, fan1.address);
      expect(hasAccess).to.be.true;
      expect(via).to.equal("nft");
    });

    it("checkAccess returns true after subscription", async () => {
      await mockUSDC.connect(fan2).approve(await subContract.getAddress(), ethers.MaxUint256);
      await subContract.connect(fan2).subscribe(MONTHLY_PRICE);

      const { hasAccess, via } = await factory.checkAccess(creator.address, fan2.address);
      expect(hasAccess).to.be.true;
      expect(via).to.equal("subscription");
    });

    it("checkAccess returns false for non-subscriber", async () => {
      const { hasAccess, via } = await factory.checkAccess(creator.address, fan2.address);
      expect(hasAccess).to.be.false;
      expect(via).to.equal("none");
    });
  });
});
