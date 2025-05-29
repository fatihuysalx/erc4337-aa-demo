require("dotenv").config();
const { ethers } = require("ethers");

// ABI dosyasını yükler
const abiPath = require.resolve("../artifacts/contracts/SimpleAccount.sol/SimpleAccount.json");
console.log("Kullanılan ABI dosyası:", abiPath);
const SimpleAccountJson = require(abiPath);
const SimpleAccountAbi = SimpleAccountJson.abi;

console.log("executeBatch fonksiyonu var mı:", SimpleAccountAbi.some(fn => fn.name === "executeBatch"));
console.log("Tüm fonksiyon isimleri:", SimpleAccountAbi.map(fn => fn.name));

// Provider ve Wallet oluşturur
console.log("2. Provider ve Wallet oluşturur...");
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
console.log("Provider:", provider ? "OK" : "NULL", "Owner:", owner ? owner.address : "NULL");

// Adresler
const simpleAccountAddress = "0x5BAd22bF5C1d89b0026279C446697aE3fcdC7EF7";
const testTokenAddress = "0xE00d7B4D96Db316bcB2D9ad606E3626CFaD5A51B";
const recipient1 = "0xd8B14c452ACbFcEAB65fbF816d1b983536A561a6";
const recipient2 = "0x015FC372F9207d041FbA3a00101f99420CaaD77A";
const amount = ethers.parseUnits("1", 18);

async function main() {
    // TestToken contract'ını oluşturur
    console.log("4. TestToken contract oluşturur...");
    const TestToken = new ethers.Contract(testTokenAddress, [
        "function balanceOf(address) view returns (uint256)"
    ], provider);
    console.log("TestToken contract oluşturdu:", TestToken ? "OK" : "NULL");

    // Bakiye kontrolü yapar
    const simpleAccountBalance = await TestToken.balanceOf(simpleAccountAddress);
    console.log(`SimpleAccount TTK bakiyesi: ${ethers.formatUnits(simpleAccountBalance, 18)}`);

    if (simpleAccountBalance < amount * 2n) {
        throw new Error("SimpleAccount'ta yeterli TTK yok! Batch için önce TTK gönder.");
    }

    // Transfer fonksiyonu için calldata hazırlar
    console.log("5. Batch calldata hazırlar...");
    const iface = new ethers.Interface([
        "function transfer(address,uint256) public returns (bool)"
    ]);
    const dests = [testTokenAddress, testTokenAddress];
    const values = [0, 0];
    const funcs = [
        iface.encodeFunctionData("transfer", [recipient1, amount]),
        iface.encodeFunctionData("transfer", [recipient2, amount])
    ];
    console.log("dests:", dests);
    console.log("funcs:", funcs);

    // SimpleAccount contract'ını oluşturur
    console.log("6. SimpleAccount contract oluşturur...");
    const SimpleAccount = new ethers.Contract(simpleAccountAddress, SimpleAccountAbi, owner);
    console.log("SimpleAccount oluşturdu:", SimpleAccount ? "OK" : "NULL");

    // Ethers v6: estimateGas doğru kullanımı
    console.log("7. Gas tahmini yapar...");
    const gasEstimate = await SimpleAccount.executeBatch.estimateGas(dests, values, funcs);
    console.log("Tahmini gas:", gasEstimate.toString());

    // İşlemi gönderir
    console.log("8. İşlemi gönderir...");
    const tx = await SimpleAccount.executeBatch(dests, values, funcs, {
        gasLimit: gasEstimate + 50000n
    });
    console.log("Tx gönderildi! Tx hash:", tx.hash);
    await tx.wait();
    console.log("Tx onaylandı!");

    // Alıcı bakiyelerini okur
    const balance1 = await TestToken.balanceOf(recipient1);
    const balance2 = await TestToken.balanceOf(recipient2);
    console.log(`Alıcı1 TTK bakiyesi: ${ethers.formatUnits(balance1, 18)}`);
    console.log(`Alıcı2 TTK bakiyesi: ${ethers.formatUnits(balance2, 18)}`);
}

main().catch(console.error);
