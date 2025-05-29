// test/execute-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleAccount execute fonksiyonu ile Token Transferi", function () {
  let owner, user, recipient;
  let simpleAccount, testToken;

  beforeEach(async function () {
    [owner, user, recipient] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
    simpleAccount = await SimpleAccount.deploy(owner.address, entryPoint.target);
    await simpleAccount.waitForDeployment();

    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy();
    await testToken.waitForDeployment();

    await testToken.mint(simpleAccount.target, ethers.parseUnits("1000", 18));
  });

  it("SimpleAccount execute ile token transfer edebilmeli", async function () {
    const transferCalldata = testToken.interface.encodeFunctionData(
      "transfer",
      [recipient.address, ethers.parseUnits("250", 18)]
    );

    await simpleAccount.connect(owner).execute(
      testToken.target,
      0,
      transferCalldata
    );

    expect(await testToken.balanceOf(recipient.address)).to.equal(
      ethers.parseUnits("250", 18)
    );
    expect(await testToken.balanceOf(simpleAccount.target)).to.equal(
      ethers.parseUnits("750", 18)
    );
  });
});