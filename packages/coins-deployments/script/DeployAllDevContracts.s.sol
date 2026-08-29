// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../src/deployment/CoinsDeployerBase.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title DeployAllContracts
/// @notice Atomically deploys all contracts in the correct order to avoid circular dependencies
/// @dev This script deploys everything in a single transaction batch:
///      1. Factory proxy (without implementation)
///      2. Hook registry
///      3. Limit order book
///      4. Swap router
///      5. Trusted message sender lookup
///      6. Upgrade gate
///      7. Factory implementations (including hook, which now has LOB address)
///      8. Upgrade factory proxy to implementation
contract DeployAllDevContracts is CoinsDeployerBase {
    function run() public {
        CoinsDeployment memory deployment = readDeployment();

        vm.startBroadcast();

        // Step 1: Deploy proxy shim and factory proxy (without implementation)
        console.log("\n=== Step 1: Deploying Factory Proxy ===");
        deployment = deployFactoryProxyOnly(deployment);
        console.log("PROXY_SHIM:", computeProxyShimAddress());
        console.log("LEAK_FACTORY proxy:", deployment.leakFactory);

        // Step 2: Deploy hook registry (non-deterministic for dev deployments)
        console.log("\n=== Step 2: Deploying Hook Registry ===");
        address[] memory initialOwners = new address[](2);
        initialOwners[0] = getProxyAdmin();
        initialOwners[1] = deployment.leakFactory;
        LeakHookRegistry hookRegistry = new LeakHookRegistry();
        hookRegistry.initialize(initialOwners);
        deployment.leakHookRegistry = address(hookRegistry);
        console.log("LEAK_HOOK_REGISTRY:", deployment.leakHookRegistry);

        // Step 3: Deploy limit order book (owner is proxyAdmin)
        console.log("\n=== Step 3: Deploying Limit Order Book ===");
        deployment.leakLimitOrderBook = deployLimitOrderBook(
            getUniswapV4PoolManager(),
            deployment.leakFactory,
            deployment.leakHookRegistry,
            getProxyAdmin(),
            getWeth()
        );
        console.log("LEAK_LIMIT_ORDER_BOOK:", deployment.leakLimitOrderBook);

        // Step 4: Deploy swap router (owner is proxyAdmin)
        console.log("\n=== Step 4: Deploying Swap Router ===");
        deployment.zoraRouter = deploySwapRouter(getUniswapV4PoolManager(), deployment.leakLimitOrderBook, getUniswapSwapRouter(), PERMIT2, getProxyAdmin());
        console.log("LEAK_ROUTER:", deployment.zoraRouter);

        // Step 5: Deploy trusted message sender lookup
        console.log("\n=== Step 5: Deploying Trusted Message Sender Lookup ===");
        deployment.trustedMsgSenderLookup = address(
            new TrustedMsgSenderProviderLookup(getDefaultTrustedMessageSenders(deployment.zoraRouter), getProxyAdmin())
        );
        console.log("TRUSTED_MSG_SENDER_LOOKUP:", deployment.trustedMsgSenderLookup);

        // Step 6: Deploy upgrade gate
        console.log("\n=== Step 6: Deploying Upgrade Gate ===");
        deployment.hookUpgradeGate = address(new HookUpgradeGate(getProxyAdmin()));
        console.log("HOOK_UPGRADE_GATE:", deployment.hookUpgradeGate);

        // Step 7: Deploy coin implementations
        console.log("\n=== Step 7: Deploying Coin Implementations ===");
        deployment.coinV4Impl = address(deployCoinV4Impl());
        deployment.creatorCoinImpl = address(deployCreatorCoinImpl());
        deployment.trendCoinImpl = address(deployTrendCoinImpl());
        console.log("COIN_V4_IMPL:", deployment.coinV4Impl);
        console.log("CREATOR_COIN_IMPL:", deployment.creatorCoinImpl);
        console.log("TREND_COIN_IMPL:", deployment.trendCoinImpl);

        // Step 8: Deploy hook (needs all dependencies including LOB)
        console.log("\n=== Step 8: Deploying Content Coin Hook ===");
        (IHooks leakCoinHook, bytes32 usedSalt) = deployLeakCoinHook(deployment);
        deployment.leakCoinHook = address(leakCoinHook);
        deployment.leakCoinHookSalt = usedSalt;
        console.log("LEAK_COIN_HOOK:", deployment.leakCoinHook);

        // Step 9: Deploy factory implementation
        console.log("\n=== Step 9: Deploying Factory Implementation ===");
        deployment.leakFactoryImpl = deployFactoryImpl(deployment);
        deployment.coinVersion = IVersionedContract(deployment.coinV4Impl).contractVersion();
        console.log("LEAK_FACTORY_IMPL:", deployment.leakFactoryImpl);
        console.log("COIN_VERSION:", deployment.coinVersion);

        // Step 10: Upgrade factory proxy to implementation
        console.log("\n=== Step 10: Upgrading Factory Proxy ===");
        UUPSUpgradeable(deployment.leakFactory).upgradeToAndCall(deployment.leakFactoryImpl, "");
        LeakFactoryImpl(deployment.leakFactory).initialize(getProxyAdmin());
        console.log("Factory upgraded and initialized");

        vm.stopBroadcast();

        // Save deployment addresses
        saveDeployment(deployment);

        console.log("\n=== Deployment Complete ===");
        console.log("All contracts deployed successfully!");
        console.log("Deployment saved to:", addressesFile());
    }

    /// @notice Deploys only the factory proxy without the implementation
    /// @dev This allows the factory address to be known before deploying the hook
    function deployFactoryProxyOnly(CoinsDeployment memory deployment) internal returns (CoinsDeployment memory) {
        require(getProxyAdmin() != address(0), "Owner cannot be zero address");

        // Deploy ProxyShim (using CREATE, not CREATE2)
        ProxyShim proxyShim = new ProxyShim();

        // Deploy LeakFactory proxy (using CREATE, not CREATE2)
        LeakFactory factoryProxy = new LeakFactory(address(proxyShim));

        deployment.leakFactory = address(factoryProxy);

        return deployment;
    }
}
