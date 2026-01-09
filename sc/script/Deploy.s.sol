// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

contract DeployScript is Script {
    function run() external {
        // El deployer se determina automáticamente según el método usado:
        // - --private-key: usa esa clave
        // - --mnemonics: usa la primera cuenta del mnemonic
        // - --ledger/--trezor: usa hardware wallet

        vm.startBroadcast();

        console.log("Deploying DocumentRegistry...");
        console.log("Chain ID:", block.chainid);

        DocumentRegistry documentRegistry = new DocumentRegistry();

        console.log("DocumentRegistry deployed at:", address(documentRegistry));

        vm.stopBroadcast();
    }
}
