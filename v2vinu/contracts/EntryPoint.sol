// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { PackedUserOperation } from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "./interfaces/IAccount.sol";
import "./interfaces/IPaymaster.sol";


contract EntryPoint {
    event UserOperationEvent(address indexed sender, uint256 nonce, bool success);

    // Paymaster bakiyeleri tutulacak
    mapping(address => uint256) public paymasterDeposits;

    // Paymaster'a ETH yatırmak için fonksiyon
    function depositTo(address paymaster) external payable {
        require(msg.value > 0, "No value sent");
        paymasterDeposits[paymaster] += msg.value;
    }

    function handleOps(
        PackedUserOperation[] calldata ops
    ) external {
        for (uint i = 0; i < ops.length; i++) {
            PackedUserOperation calldata op = ops[i];

            address paymaster = address(0);
            bytes memory context;
            bool paymasterSuccess = true;

            // Paymaster kontrolü ve çağrısı (52 byte ilk veri - adres)
            if (op.paymasterAndData.length >= 20) {
                paymaster = address(bytes20(op.paymasterAndData[:20]));

                if (paymaster != address(0)) {
                    // validatePaymasterUserOp çağrısı
                    (bool ok, bytes memory result) = paymaster.call(
                        abi.encodeWithSelector(
                            IPaymaster(paymaster).validatePaymasterUserOp.selector,
                            op,
                            getUserOpHash(op),
                            0 // maxCost şimdilik dummy
                        )
                    );
                    paymasterSuccess = ok;
                    if (ok) {
                        // context ve validationData dönüyor, context'i al
                        (context, ) = abi.decode(result, (bytes, uint256));
                    }
                }
            }

            // Eğer paymaster başarısızsa revert et
            require(paymasterSuccess, "Paymaster validation failed");

            // SimpleAccount'u çağır
            (bool success, ) = op.sender.call(
                abi.encodeWithSelector(
                    IAccount.validateUserOp.selector,
                    op,
                    getUserOpHash(op),
                    0 // missingAccountFunds
                )
            );
            emit UserOperationEvent(op.sender, op.nonce, success);

            // Paymaster varsa postOp çağrısı
            if (paymaster != address(0)) {
                uint256 gasUsed = 21000; // Dummy değer, gerçek hesaplama yapılmalı
                // gas ve masraf hesaplamasını burada gerçek değerle değiştirmen gerekir
                IPaymaster(paymaster).postOp(
                    IPaymaster.PostOpMode.opSucceeded,
                    context,
                    gasUsed,
                    tx.gasprice // Gerçek gas fiyatı
                );
                // Basitçe: Paymaster'ın depositinden masrafı düş
                paymasterDeposits[paymaster] -= gasUsed * tx.gasprice;
            }
        }
    }

    function getUserOpHash(PackedUserOperation calldata op) public pure returns (bytes32) {
        // Sadece örnek hash (detayları artırabilirsin)
        return keccak256(abi.encode(op.sender, op.nonce, op.callData));
    }
}
