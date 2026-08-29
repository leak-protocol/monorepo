// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {console2} from "forge-std/console2.sol";
import {BaseTest} from "./utils/BaseTest.sol";
import {LeakFactoryImpl} from "../src/LeakFactoryImpl.sol";
import {CoinConfigurationVersions} from "../src/libs/CoinConfigurationVersions.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @notice Cau hoi: "bo creator coin" bang cach deploy creatorCoinImpl = address(0)
///         co an toan khong, hay tao ra coin hong mot cach im lang?
/// forge-config: default.isolate = true
contract LeakDropCreatorCoinTest is BaseTest {
    function test_deployCreatorCoin_whenImplIsZero() public {
        // Deploy mot factory impl moi voi creatorCoinImpl = address(0)
        LeakFactoryImpl impl = new LeakFactoryImpl(
            address(coinV4Impl),
            address(0),            // <-- creatorCoinImpl bi bo
            address(trendCoinImpl),
            address(hook),
            address(leakHookRegistry)
        );

        vm.prank(users.factoryOwner);
        UUPSUpgradeable(address(factory)).upgradeToAndCall(address(impl), "");

        address[] memory owners = new address[](1);
        owners[0] = users.creator;
        bytes memory poolConfig = CoinConfigurationVersions.defaultDopplerMultiCurveUniV4(WETH_ADDRESS);

        vm.prank(users.creator);
        try
            LeakFactoryImpl(payable(address(factory))).deployCreatorCoin(
                users.creator, owners, "https://x", "Creator", "CRTR", poolConfig, address(0), bytes32(uint256(77))
            )
        returns (address coinAddr) {
            console2.log("KHONG REVERT -- da tao ra coin tai:", coinAddr);
            console2.log("  codesize cua coin:", coinAddr.code.length);
            console2.log("  => IM LANG TAO RA COIN HONG. Pass address(0) KHONG an toan.");
        } catch (bytes memory reason) {
            console2.log("REVERT nhu mong doi. Do dai reason:", reason.length);
            console2.log("  => Pass address(0) la an toan: khong tao duoc creator coin.");
        }
    }
}
