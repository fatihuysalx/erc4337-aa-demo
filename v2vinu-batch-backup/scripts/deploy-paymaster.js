const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const entryPointAddress = process.env.ENTRYPOINT_ADDRESS;
    if (!entryPointAddress) throw new Error("ENTRYPOINT_ADDRESS env'de yok");

    console.log("🔨 ENTRYPOINT_ADDRESS:", entryPointAddress);

    const PaymasterFactory = await hre.ethers.getContractFactory("SimplePaymaster");
    const paymaster = await PaymasterFactory.deploy(entryPointAddress);

    await paymaster.waitForDeployment();

    console.log("✅ Paymaster deployed to:", paymaster.target || paymaster.address);
}

main().catch((err) => {
    console.error("❌ Deploy failed:", err);
    process.exit(1);
});
