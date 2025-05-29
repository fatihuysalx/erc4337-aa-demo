require("dotenv").config();
const { ethers } = require("ethers");
const { Bundler, SimpleAccountAPI } = require("@account-abstraction/sdk");

const {
  SEPOLIA_RPC_URL,
  OWNER_PRIVATE_KEY,
  PAYMASTER_ADDRESS,
  ENTRYPOINT_ADDRESS,
  SIMPLEACCOUNT_ADDRESS,
  TESTTOKEN_ADDRESS,
  RECIPIENT_ADDRESS
} = process.env;

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const owner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

  const TestToken = new ethers.Contract(
    TESTTOKEN_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address,uint256) public returns (bool)"
    ],
    provider
  );

  // Bakiyeleri göster
  const ownerBal = await TestToken.balanceOf(SIMPLEACCOUNT_ADDRESS);
  const recipientBal = await TestToken.balanceOf(RECIPIENT_ADDRESS);
  console.log(`OWNER bakiyesi: ${ethers.formatUnits(ownerBal, 18)}`);
  console.log(`ALICI bakiyesi: ${ethers.formatUnits(recipientBal, 18)}`);

  class MyPaymasterAPI {
    async getPaymasterAndData() {
      return PAYMASTER_ADDRESS;
    }
  }

  // Bundler setup
  const bundlerRpc = getDefaultBundlerRpcClient(
    ENTRYPOINT_ADDRESS,
    provider
  );

  const accountAPI = new SimpleAccountAPI({
    provider,
    entryPointAddress: ENTRYPOINT_ADDRESS,
    owner,
    paymasterAPI: new MyPaymasterAPI(),
    factoryAddress: ethers.ZeroAddress,
    accountAddress: SIMPLEACCOUNT_ADDRESS,
    bundler: bundlerRpc
  });

  const amount = ethers.parseUnits("1", 18);
  const iface = new ethers.Interface([
    "function transfer(address,uint256) public returns (bool)"
  ]);
  const callData = iface.encodeFunctionData("transfer", [RECIPIENT_ADDRESS, amount]);

  const userOp = await accountAPI.createSignedUserOp({
    target: TESTTOKEN_ADDRESS,
    data: callData,
    value: 0
  });

  // UserOp'u gönder
  console.log("UserOp gönderiliyor...");
  const userOpHash = await accountAPI.sendUserOp(userOp);
  console.log("UserOp hash:", userOpHash);

  // Onay bekle
  const entryPoint = EntryPoint__factory.connect(ENTRYPOINT_ADDRESS, provider);
  const txHash = await accountAPI.getUserOpReceipt(userOpHash, { entryPoint });
  console.log("Tx hash:", txHash);

  // Bakiyeleri tekrar göster
  const ownerBalAfter = await TestToken.balanceOf(SIMPLEACCOUNT_ADDRESS);
  const recipientBalAfter = await TestToken.balanceOf(RECIPIENT_ADDRESS);
  console.log(`OWNER bakiyesi (sonra): ${ethers.formatUnits(ownerBalAfter, 18)}`);
  console.log(`ALICI bakiyesi (sonra): ${ethers.formatUnits(recipientBalAfter, 18)}`);
  console.log(`BAŞARILI! Gas fee'yi Paymaster (Sponsor) ödedi!`);
}

main().catch(console.error);
