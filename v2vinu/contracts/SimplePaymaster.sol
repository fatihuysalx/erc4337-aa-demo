// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { BasePaymaster } from "@account-abstraction/contracts/core/BasePaymaster.sol";
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { PackedUserOperation } from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

contract SimplePaymaster is BasePaymaster {
    constructor(IEntryPoint _entryPoint)
        BasePaymaster(_entryPoint)
    {}

    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /* maxCost */
    )
        internal
        override
        returns (bytes memory context, uint256 validationData)
    {
        require(userOp.paymasterAndData.length >= 85, "paymasterAndData too short");
        bytes memory signature = userOp.paymasterAndData[20:85];
        bytes32 hash = keccak256(abi.encodePacked(userOpHash, address(this)));
        address signer = recoverSigner(hash, signature);

        require(signer == owner(), "Invalid sponsor signature");
        context = abi.encode(userOp.sender);
        validationData = 0;
    }

    function _postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) internal override {
        address user = abi.decode(context, (address));
        emit GasSponsored(user, actualGasCost, mode);
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {
        require(signature.length == 65, "invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        return ecrecover(ethSignedHash, v, r, s);
    }

    event GasSponsored(address indexed user, uint256 gasCost, PostOpMode mode);
receive() external payable {}
}
