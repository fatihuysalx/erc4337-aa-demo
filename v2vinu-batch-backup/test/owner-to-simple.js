require("dotenv").config();
const { ethers } = require("ethers");

// 1. ENV'den provider ve owner wallet oluştur
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

// 2. Gerekli adresler
const testTokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C"; // TTK token contract adresin
const simpleAccountAddress = "0x1ff8Ee8022Bb1a351E5AD2803eaa0e2A139A338F"; // SimpleAccount adresin
const amount = ethers.parseUnits("10", 18); // 10 TTK gönderecek

async function main() {
    // 3. Token contractını owner ile bağla
    const TestToken = new ethers.Contract(testTokenAddress, [
        "function transfer(address,uint256) public returns (bool)",
        "function balanceOf(address) public view returns (uint256)"
    ], owner);

    // 4. Transfer işlemini başlat
    const tx = await TestToken.transfer(simpleAccountAddress, amount);
    await tx.wait();

    // 5. Transfer sonrası bakiyeleri yazdır
    const simpleBal = await TestToken.balanceOf(simpleAccountAddress);
    const ownerBal = await TestToken.balanceOf(owner.address);

    console.log("SimpleAccount (AA) bakiyesi:", ethers.formatUnits(simpleBal, 18), "TTK");
    console.log("Owner bakiyesi:", ethers.formatUnits(ownerBal, 18), "TTK");
}

main().catch(console.error);
