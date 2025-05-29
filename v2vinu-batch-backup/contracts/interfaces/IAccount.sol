// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PackedUserOperation } from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
interface IAccount {
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}
