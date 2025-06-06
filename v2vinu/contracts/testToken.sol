// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("TestToken", "TTK") {
    _mint(msg.sender, 10000 * 10 ** decimals()); // 1.000.000 değil!
}

    function mint(address to, uint256 amount) external {
    _mint(to, amount);
}

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
