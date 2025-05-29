// scripts/check-balance.js
require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const simpleAccountAddress = "0x07466ae5c5Fe4D73B41fC559d23099a38bc7E867";
const testTokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C";

async function main() {
    const TestToken = new ethers.Contract(
        testTokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        provider
    );
    const balance = await TestToken.balanceOf(simpleAccountAddress);
    console.log("SimpleAccount'un TTK bakiyesi:", ethers.formatUnits(balance, 18));
}
main();
