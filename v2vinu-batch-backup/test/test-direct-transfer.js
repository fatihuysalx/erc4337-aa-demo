// scripts/test-direct-transfer.js
require("dotenv").config();
const { ethers } = require("ethers");

// ENV ve provider kur
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
// Burada SimpleAccount'un owner'ının private keyini kullanıyoruz
const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

const simpleAccountAddress = "0x07466ae5c5Fe4D73B41fC559d23099a38bc7E867";
const testTokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C";
const recipientAddress = "0xd8B14c452ACbFcEAB65fbF816d1b983536A561a6";

async function main() {
    // TestToken kontratı
    const TestToken = new ethers.Contract(testTokenAddress, [
        "function transfer(address,uint256) public returns (bool)",
        "function balanceOf(address) public view returns (uint256)"
    ], ownerWallet);

    // Önce bakiyeleri yaz
    const beforeSender = await TestToken.balanceOf(simpleAccountAddress);
    const beforeRecipient = await TestToken.balanceOf(recipientAddress);

    console.log("Sender (SimpleAccount) Before:", ethers.formatUnits(beforeSender, 18));
    console.log("Recipient Before:", ethers.formatUnits(beforeRecipient, 18));

    // Transfer
    const amount = ethers.parseUnits("1", 18);
    const tx = await TestToken.transfer(recipientAddress, amount);
    await tx.wait();

    // Sonra bakiyeleri yaz
    const afterSender = await TestToken.balanceOf(simpleAccountAddress);
    const afterRecipient = await TestToken.balanceOf(recipientAddress);

    console.log("Sender (SimpleAccount) After:", ethers.formatUnits(afterSender, 18));
    console.log("Recipient After:", ethers.formatUnits(afterRecipient, 18));
}

main().catch(console.error);
