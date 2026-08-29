// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {console2} from "forge-std/console2.sol";
import {BaseTest} from "./utils/BaseTest.sol";
import {ICoin} from "../src/interfaces/ICoin.sol";
import {ContentCoin} from "../src/ContentCoin.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {CoinConfigurationVersions} from "../src/libs/CoinConfigurationVersions.sol";

/// @notice Measures what each curve SHAPE actually does to price, on a real Avalanche fork.
///         Each preset buys 1 AVAX ten times in a row and reports coins received per buy.
///         The ratio first-buy : last-buy IS the steepness of the curve.
/// forge-config: default.isolate = true
contract LeakCurveShapesTest is BaseTest {
    using PoolIdLibrary for PoolKey;

    function _cfg(
        int24[] memory lo,
        int24[] memory hi,
        uint16[] memory np,
        uint256[] memory share
    ) internal pure returns (bytes memory) {
        return CoinConfigurationVersions.encodeDopplerMultiCurveUniV4(address(0), lo, hi, np, share);
    }

    function _deploy(bytes memory poolConfig, bytes32 salt) internal returns (ICoin) {
        address[] memory owners = new address[](1);
        owners[0] = users.creator;
        vm.prank(users.creator);
        (address c, ) = factory.deploy(
            users.creator, owners, "https://leak.ai/x", "Shape", "SHAPE",
            poolConfig, address(0), address(0), bytes(""), salt
        );
        return ICoin(c);
    }

    function _run(string memory label, bytes memory poolConfig, bytes32 salt) internal {
        ICoin coin = _deploy(poolConfig, salt);
        PoolKey memory pk = coin.getPoolKey();

        address buyer = makeAddr(label);
        vm.deal(buyer, 1000 ether);

        (, int24 tick0, , ) = StateLibrary.getSlot0(poolManager, pk.toId());

        console2.log("");
        console2.log("=========================================================");
        console2.log(label);
        console2.log("  tick khoi tao:", tick0);

        uint256 prev = IERC20(address(coin)).balanceOf(buyer);
        uint256 firstOut;
        uint256 lastOut;
        for (uint256 i; i < 6; ++i) {
            _swapSomeCurrencyForCoin(coin, address(0), 1 ether, buyer);
            uint256 bal = IERC20(address(coin)).balanceOf(buyer);
            uint256 out = bal - prev;
            prev = bal;
            if (i == 0) firstOut = out;
            lastOut = out;
            (, int24 t, , ) = StateLibrary.getSlot0(poolManager, pk.toId());
            console2.log("  mua AVAX thu", i + 1);
            console2.log("    coin nhan duoc (trieu):", out / 1e24);
            console2.log("    tick:", t);
        }
        console2.log("  --> lan 1 / lan cuoi =", firstOut / (lastOut == 0 ? 1 : lastOut), "x");
        console2.log("  --> % cung da ban:", (prev * 100) / 1e27);
    }

    function test_preset_LEAK_MEME() public {
        _run("LEAK_MEME  (1 curve, 11 vi the, 5%) - FDV 3.08 -> 768 AVAX",
             CoinConfigurationVersions.leakMemeCurve(address(0)), bytes32(uint256(11)));
    }

    function test_preset_LEAK_STABLE() public {
        _run("LEAK_STABLE (3 curve chong lop, 33 vi the, 37.5%) - FDV 99.9 -> 816 AVAX",
             CoinConfigurationVersions.leakStableCurve(address(0)), bytes32(uint256(12)));
    }
}
