// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CoinsDeployerBase} from "../src/deployment/CoinsDeployerBase.sol";
import {LeakFactoryImpl} from "@zoralabs/coins/src/LeakFactoryImpl.sol";

contract UpgradeFactoryImpl is CoinsDeployerBase {
    function run() public {
        CoinsDeployment memory deployment = readDeployment();

        require(deployment.coinV4Impl != address(0), "COIN_V4_IMPL not set");
        require(deployment.creatorCoinImpl != address(0), "CREATOR_COIN_IMPL not set");
        require(deployment.trendCoinImpl != address(0), "TREND_COIN_IMPL not set");
        require(deployment.leakCoinHook != address(0), "LEAK_COIN_HOOK not set");
        require(deployment.leakHookRegistry != address(0), "LEAK_HOOK_REGISTRY not set");

        vm.startBroadcast();

        LeakFactoryImpl leakFactoryImpl = deployLeakFactoryImpl(
            deployment.coinV4Impl,
            deployment.creatorCoinImpl,
            deployment.trendCoinImpl,
            deployment.leakCoinHook,
            deployment.leakHookRegistry
        );

        deployment.leakFactoryImpl = address(leakFactoryImpl);

        vm.stopBroadcast();

        // save the deployment json
        saveDeployment(deployment);
        printUpgradeFactoryCommand(deployment);
    }
}
