require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    const entryPointAddress = process.env.ENTRYPOINT_ADDRESS;

    if (!ownerPrivateKey || !entryPointAddress) throw new Error("ENV eksik!");

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);

    // 1. SimpleAccount deploy
    const SimpleAccount = await ethers.getContractFactory("SimpleAccount", ownerWallet);
    const simpleAccount = await SimpleAccount.deploy(ownerWallet.address, entryPointAddress);
    await simpleAccount.waitForDeployment();
    const simpleAccountAddress = simpleAccount.target || simpleAccount.address;
    console.log("✅ SimpleAccount deployed to:", simpleAccountAddress);

    // 2. TestToken deploy
    //const TestToken = await ethers.getContractFactory("TestToken", ownerWallet);
    //const token = await TestToken.deploy();
    //await token.waitForDeployment();
    //const testTokenAddress = token.target || token.address;
    //console.log("✅ TestToken deployed to:", testTokenAddress);
    const testTokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C";
    const testToken = await ethers.getContractAt("TestToken", testTokenAddress);

    // 3. Mint token
    const amount = ethers.parseUnits("1000", 18);
    await token.mint(simpleAccountAddress, amount);
    console.log(`✅ Minted ${ethers.formatUnits(amount)} TTK to SimpleAccount`);

    // 4. Bakiye kontrol
    const balance = await token.balanceOf(simpleAccountAddress);
    console.log("💰 SimpleAccount Token Bakiyesi:", ethers.formatUnits(balance, 18));
}

main().catch(console.error);
