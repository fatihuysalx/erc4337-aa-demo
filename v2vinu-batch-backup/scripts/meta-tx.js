require("dotenv").config();
const { ethers } = require("ethers");

// ENV ve provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const ownerWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

// Adresler
const simpleAccountAddress = "0x07466ae5c5Fe4D73B41fC559d23099a38bc7E867";
const testTokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C";
const recipientAddress = "0xd8B14c452ACbFcEAB65fbF816d1b983536A561a6";

async function main() {
    console.log("==== Adresler ve Cüzdanlar ====");
    console.log("OWNER:", ownerWallet.address);
    console.log("RELAYER:", relayerWallet.address);
    console.log("SimpleAccount:", simpleAccountAddress);
    console.log("TestToken:", testTokenAddress);
    console.log("Recipient:", recipientAddress);

    // Bağlantı
    const SimpleAccount = new ethers.Contract(
        simpleAccountAddress,
        [
            "function executeMetaTx(address,uint256,bytes,uint256,bytes) external",
            "function nonce() view returns (uint256)"
        ],
        relayerWallet
    );

    const TestToken = new ethers.Contract(
        testTokenAddress,
        [
            "function transfer(address,uint256) public returns (bool)",
            "function balanceOf(address) view returns (uint256)"
        ],
        provider // readonly
    );

    // Önce bakiyeleri yaz
    const ownerBalanceBefore = await TestToken.balanceOf(simpleAccountAddress);
    const recipientBalanceBefore = await TestToken.balanceOf(recipientAddress);
    console.log("OWNER bakiyesi (önce):", ethers.formatUnits(ownerBalanceBefore, 18));
    console.log("ALICI bakiyesi (önce):", ethers.formatUnits(recipientBalanceBefore, 18));

    // Call data
    const amount = ethers.parseUnits("1", 18); // 1 TTK ile test et
    const transferCalldata = new ethers.Interface([
        "function transfer(address,uint256) public returns (bool)"
    ]).encodeFunctionData("transfer", [recipientAddress, amount]);
    console.log("transferCalldata:", transferCalldata);

    // Nonce al
    const txNonce = await SimpleAccount.nonce();
    console.log("SimpleAccount nonce:", txNonce.toString());

    // Hash oluştur
    const hash = ethers.keccak256(
        ethers.solidityPacked(
            ["address", "uint256", "bytes", "uint256", "address"],
            [testTokenAddress, 0, transferCalldata, txNonce, simpleAccountAddress]
        )
    );
    console.log("MetaTx hash:", hash);

    // Owner imzası
    const signature = await ownerWallet.signMessage(ethers.getBytes(hash));
    console.log("Owner imzası (hex):", signature);

    // Relayer executeMetaTx ile gönderir
    let tx;
    try {
        tx = await SimpleAccount.executeMetaTx(
            testTokenAddress,
            0,
            transferCalldata,
            txNonce,
            signature,
            { gasLimit: 200_000 }
        );
        console.log("Tx gönderildi! Tx hash:", tx.hash);
        await tx.wait();
        console.log("Tx onaylandı!");
    } catch (err) {
        console.error("HATA! executeMetaTx revert veya error:", err);
        return;
    }

    // Son bakiyeleri kontrol et
    const ownerBalanceAfter = await TestToken.balanceOf(simpleAccountAddress);
    const recipientBalanceAfter = await TestToken.balanceOf(recipientAddress);

    console.log("OWNER bakiyesi (sonra):", ethers.formatUnits(ownerBalanceAfter, 18));
    console.log("ALICI bakiyesi (sonra):", ethers.formatUnits(recipientBalanceAfter, 18));
    console.log("Meta-tx başarılıysa owner’dan alıcıya token geçti, gas relayer’dan çıktı!");
}

main().catch(console.error);
