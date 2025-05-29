const { ethers } = require("hardhat");
async function checkBalance() {
  const tokenAddress = "0x6227F2Fe24B1458A92Db3C1CEff173569a1cc19C"; // TestToken kontrat adresi
  const aliciAddress = "0xd8B14c452ACbFcEAB65fbF816d1b983536A561a6"; // Alıcı adresi
  const Token = await ethers.getContractFactory("TestToken");
  const token = await Token.attach(tokenAddress);
  const balance = await token.balanceOf(aliciAddress);
  console.log("Alıcı TTK bakiyesi:", ethers.formatUnits(balance, 18));
}
checkBalance();
