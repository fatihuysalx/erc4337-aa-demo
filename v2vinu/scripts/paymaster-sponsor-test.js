require("dotenv").config();
const { ethers } = require("ethers");
const { EntryPoint__factory } = require("@account-abstraction/contracts");
const { SimpleAccountAPI } = require("@account-abstraction/sdk");
const { HttpRpcClient, bundlerActions } = require("@account-abstraction/sdk");
const { getSimpleAccountFactory } = require("@account-abstraction/sdk/dist/src");

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

  const entryPointAddress = process.env.ENTRYPOINT_ADDRESS;
  const paymasterAddress = process.env.PAYMASTER_ADDRESS;
  const simpleAccountAddress = process.env.SIMPLEACCOUNT_ADDRESS;
  const recipient = process.env.RECIPIENT_ADDRESS;

  const entryPoint = EntryPoint__factory.connect(entryPointAddress, signer);

  const accountAPI = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner: signer,
    factoryAddress: ethers.ZeroAddress, // deploy edilmiş olduğu için factory yok
    accountAddress: simpleAccountAddress,
  });

  const callData = accountAPI.encodeExecute(recipient, ethers.parseEther("0.001"), "0x");

  const userOp = await accountAPI.createSignedUserOp({
    target: recipient,
    data: "0x",
    value: ethers.parseEther("0.001"),
    paymasterAndData: paymasterAddress + "00".repeat(65), // dummy signature
  });

  const client = new HttpRpcClient(
    process.env.SEPOLIA_RPC_URL,
    entryPointAddress,
    signer,
    { bundlerUrl: "https://rpc.sepolia.org" } // veya Alchemy'nin AA endpoint'i
  );

  const res = await client.sendUserOpToBundler(userOp);
  console.log("UserOperation hash:", res);

  const txHash = await entryPoint.handleOps.staticCall([userOp], signer.address);
  console.log("Transaction sent:", txHash);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});