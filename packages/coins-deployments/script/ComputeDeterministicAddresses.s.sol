// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../src/deployment/CoinsDeployerBase.sol";

/// @title ComputeDeterministicAddresses
/// @notice Computes and saves deterministic addresses for factory and limit order contracts
/// @dev Step 1 of the two-step deployment process. Run this first to compute expected addresses,
///      then use DeployFactoryNonDeterministic.s.sol and/or DeployLimitOrders.s.sol to deploy and verify addresses match.
contract ComputeDeterministicAddresses is CoinsDeployerBase {
    function run() public {
        // Read existing deployment to get dependencies
        CoinsDeployment memory deployment = readDeployment();

        // If factory is not deployed and we're in DEV mode, compute its deterministic address
        if (deployment.leakFactory == address(0) && isDevEnvironment()) {
            console.log("\n=== Computing Factory Address (DEV mode) ===");
            address computedProxyShim = computeProxyShimAddress();
            console.log("Computed PROXY_SHIM:", computedProxyShim);

            address computedFactory = computeFactoryAddress(computedProxyShim);
            console.log("Computed LEAK_FACTORY:", computedFactory);

            deployment.leakFactory = computedFactory;
        } else if (deployment.leakFactory == address(0)) {
            revert("LEAK_FACTORY not deployed. In production, run Deploy.s.sol first.");
        } else {
            console.log("\n=== Factory Already Deployed ===");
            console.log("LEAK_FACTORY:", deployment.leakFactory);
        }

        // If hook registry is not deployed and we're in DEV mode, compute its deterministic address
        if (deployment.leakHookRegistry == address(0) && isDevEnvironment()) {
            console.log("\n=== Computing Hook Registry Address (DEV mode) ===");
            address computedHookRegistry = computeHookRegistryAddress();
            console.log("Computed LEAK_HOOK_REGISTRY:", computedHookRegistry);

            deployment.leakHookRegistry = computedHookRegistry;
        } else if (deployment.leakHookRegistry == address(0)) {
            revert("LEAK_HOOK_REGISTRY not deployed. In production, run Deploy.s.sol first.");
        } else {
            console.log("\n=== Hook Registry Already Deployed ===");
            console.log("LEAK_HOOK_REGISTRY:", deployment.leakHookRegistry);
        }

        // Compute deterministic addresses using hardcoded salts
        address proxyAdmin = getProxyAdmin();
        address poolManager = getUniswapV4PoolManager();
        address swapRouter = getUniswapSwapRouter();

        console.log("\n=== Computing Limit Order Addresses ===");

        // 1. Compute limit order book address (owner is proxyAdmin)
        address computedLimitOrderBook = computeLimitOrderBookAddress(
            poolManager,
            deployment.leakFactory,
            deployment.leakHookRegistry,
            proxyAdmin,
            getWeth()
        );
        console.log("Computed LEAK_LIMIT_ORDER_BOOK:", computedLimitOrderBook);

        // 2. Compute swap router address (owner is proxyAdmin)
        address computedSwapRouter = computeSwapRouterAddress(poolManager, computedLimitOrderBook, swapRouter, PERMIT2, proxyAdmin);
        console.log("Computed LEAK_ROUTER:", computedSwapRouter);

        // Save computed addresses to deployment
        deployment.leakLimitOrderBook = computedLimitOrderBook;
        deployment.zoraRouter = computedSwapRouter;

        saveDeployment(deployment);

        console.log("\n=== Computed Deterministic Addresses Saved ===");
        console.log("LEAK_FACTORY:", deployment.leakFactory);
        console.log("LEAK_HOOK_REGISTRY:", deployment.leakHookRegistry);
        console.log("LEAK_LIMIT_ORDER_BOOK:", deployment.leakLimitOrderBook);
        console.log("LEAK_ROUTER:", deployment.zoraRouter);
        console.log("\nNext steps:");
        console.log("1. If factory not deployed: Run DeployFactoryNonDeterministic.s.sol");
        console.log("2. If hook registry not deployed: Run DeployHookRegistry.s.sol");
        console.log("3. Run DeployTrustedMsgSenderLookup.s.sol");
        console.log("4. Run DeployLimitOrders.s.sol");
    }
}
