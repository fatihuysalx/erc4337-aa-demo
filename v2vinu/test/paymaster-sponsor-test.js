// test/paymaster-sponsor-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Account Abstraction Sponsorship", function () {
  let owner, user, relayer, entryPoint, paymaster, account, token;

  beforeEach(async function () {
    [owner, user, relayer] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
    account = await SimpleAccount.deploy(user.address, entryPoint.target);
    await account.waitForDeployment();

    const SimplePaymaster = await ethers.getContractFactory("SimplePaymaster");
    paymaster = await SimplePaymaster.deploy(entryPoint.target);
    await paymaster.waitForDeployment();

    const TestToken = await ethers.getContractFactory("TestToken");
    token = await TestToken.deploy();
    await token.waitForDeployment();

    await token.mint(account.target, ethers.parseUnits("1000", 18));

    await owner.sendTransaction({
      to: paymaster.target,
      value: ethers.parseEther("1.0"),
    });
  });

  it("Paymaster ETH aldı mı", async function () {
    const balance = await ethers.provider.getBalance(paymaster.target);
    expect(balance).to.be.greaterThan(ethers.parseEther("0.9"));
  });
});