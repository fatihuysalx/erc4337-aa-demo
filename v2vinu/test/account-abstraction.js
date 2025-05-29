// test/account-abstraction.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Account Abstraction Task", function () {
  let owner, user, entryPoint, paymaster, account;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();

    const SimpleAccount = await ethers.getContractFactory("SimpleAccount");
    account = await SimpleAccount.deploy(user.address, entryPoint.target);
    await account.waitForDeployment();

    const SimplePaymaster = await ethers.getContractFactory("SimplePaymaster");
    paymaster = await SimplePaymaster.deploy(entryPoint.target);
    await paymaster.waitForDeployment();
  });

  it("SimpleAccount owner kontrolü", async function () {
    expect(await account.owner()).to.equal(user.address);
  });

  it("SimpleAccount nonce başlangıçta 0 olmalı", async function () {
    expect(await account.nonce()).to.equal(0);
  });

  it("EntryPoint adresi atanmış mı", async function () {
    expect(await entryPoint.getAddress()).to.exist;
  });

  it("Paymaster doğru EntryPoint'i tutuyor mu", async function () {
    expect(await paymaster.entryPoint()).to.equal(entryPoint.target);
  });
});