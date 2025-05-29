// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PackedUserOperation } from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "./interfaces/IAccount.sol";

contract SimpleAccount is IAccount {
    address public owner;
    uint256 public nonce;
    address public entryPoint; // EntryPoint adresi kayıtlı tutulacak

    constructor(address _owner, address _entryPoint) {
        owner = _owner;
        entryPoint = _entryPoint;
        nonce = 0;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "Only EntryPoint can call");
        _;
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 /*missingAccountFunds*/
    ) external override onlyEntryPoint returns (uint256 validationData) {
        require(userOp.nonce == nonce, "Invalid nonce");
        require(
            _verifySignature(userOpHash, userOp.signature),
            "Invalid signature"
        );
        nonce++;
        return 0;
    }

    // Meta transaction (sponsorlu işlem)
    function executeMetaTx(
        address dest,
        uint256 value,
        bytes calldata func,
        uint256 txNonce,
        bytes calldata signature
    ) external onlyEntryPoint {
        require(txNonce == nonce, "Invalid nonce");
        bytes32 hash = keccak256(
            abi.encodePacked(dest, value, func, txNonce, address(this))
        );
        require(_verifySignature(hash, signature), "Invalid signature");
        nonce++;
        (bool success, ) = dest.call{value: value}(func);
        require(success, "call failed");
    }

    // Normal transfer veya başka fonksiyonları owner başlatacaksa:
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        require(msg.sender == owner, "Only owner can execute");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "Execution failed");
    }

    // ERC20/721 Mint veya başka kontratlara çağrı için örnek
    function executeContract(
        address contractAddr,
        uint256 value,
        bytes calldata callData
    ) external {
        require(msg.sender == owner || msg.sender == entryPoint, "Unauthorized");
        (bool success, ) = contractAddr.call{value: value}(callData);
        require(success, "Contract call failed");
    }

    function _verifySignature(
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        address signer = ecrecover(messageHash, v, r, s);
        return signer == owner;
    }

    function _splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
