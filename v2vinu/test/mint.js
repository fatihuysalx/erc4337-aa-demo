// scripts/mint.js
require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

const simpleAccountAddress = "0x07466ae5c5Fe4D73B41fC559d23099a38bc7E867";
const testTokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C";

async function main() {
    const TestToken = new ethers.Contract(
        testTokenAddress,
        ["function mint(address,uint256) public"],
        owner
    );
    const amount = ethers.parseUnits("10000", 18); // DÜŞÜK TUT, garantili geçer!
    const tx = await TestToken.mint(simpleAccountAddress, amount);
    await tx.wait();
    console.log(`Minted ${amount} TTK to SimpleAccount.`);
}
main();
