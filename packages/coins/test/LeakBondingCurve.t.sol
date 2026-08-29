// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {BaseTest} from "./utils/BaseTest.sol";
import {ICoin} from "../src/interfaces/ICoin.sol";
import {ILeakCoinHook} from "../src/interfaces/ILeakCoinHook.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {LpPosition} from "../src/types/LpPosition.sol";
import {PoolStateReader} from "../src/libs/PoolStateReader.sol";
import {CoinConstants} from "../src/libs/CoinConstants.sol";
import {ContentCoin} from "../src/ContentCoin.sol";

/// @title LeakBondingCurveTest
/// @notice The leak.ai MVP contract, stated as a test: one ERC20, one Uniswap v4 pool paired
///         against native AVAX, single-sided liquidity laid down at creation, tradeable in the
///         same block, no graduation step and no second venue. Every claim leak.ai makes about
///         the bonding curve is asserted here against a real Avalanche C-Chain fork.
/// @dev Native AVAX is Currency 0 (address(0)) in Uniswap v4, so no wrapping is involved.
/// forge-config: default.isolate = true
contract LeakBondingCurveTest is BaseTest {
    using PoolIdLibrary for PoolKey;

    ICoin internal leakCoin;
    PoolKey internal poolKey;

    /// @dev PoolManager is a v4 singleton shared with every other pool on the fork, so its raw
    ///      balance is meaningless. Only the delta this coin's creation causes is ours.
    uint256 internal poolManagerAvaxBeforeCreation;

    function setUp() public override {
        super.setUp();
        poolManagerAvaxBeforeCreation = address(poolManager).balance;
        // address(0) == native AVAX as the backing currency.
        leakCoin = _deployV4Coin(address(0));
        poolKey = leakCoin.getPoolKey();
    }

    // ---------------------------------------------------------------------
    // 1. Listing: one pool, paired against native AVAX, live immediately
    // ---------------------------------------------------------------------

    function test_listing_createsOneNativePairedPool() public view {
        assertEq(Currency.unwrap(poolKey.currency0), address(0), "currency0 must be native AVAX");
        assertEq(Currency.unwrap(poolKey.currency1), address(leakCoin), "currency1 must be the coin");
        assertEq(address(poolKey.hooks), address(hook), "pool must be bound to the leak hook");
        assertTrue(PoolStateReader.getSqrtPriceX96(poolKey, poolManager) > 0, "pool must be initialized at creation");
    }

    /// @notice The whole market supply is in the curve, and none of it is left idle on the hook.
    function test_listing_movesEntireMarketSupplyIntoTheCurve() public view {
        assertEq(IERC20(address(leakCoin)).totalSupply(), CoinConstants.MAX_TOTAL_SUPPLY, "1B supply");
        assertEq(
            IERC20(address(leakCoin)).balanceOf(users.creator),
            CoinConstants.CONTENT_COIN_INITIAL_CREATOR_SUPPLY,
            "creator keeps the 10M launch allocation"
        );
        // Liquidity math rounds down per position, so a few wei of coin stay behind on the hook.
        uint256 inPool = IERC20(address(leakCoin)).balanceOf(address(poolManager));
        uint256 dust = CoinConstants.CONTENT_COIN_MARKET_SUPPLY - inPool;
        assertLt(dust, 1e6, "essentially all of the 990M market supply is in the curve");
        assertEq(IERC20(address(leakCoin)).balanceOf(address(hook)), dust, "the only coin off-curve is rounding dust");
    }

    /// @notice Single-sided: at creation the pool holds coin and zero AVAX. Nobody seeds capital.
    function test_listing_liquidityIsSingleSided() public view {
        assertEq(
            address(poolManager).balance,
            poolManagerAvaxBeforeCreation,
            "creating a coin must not deposit any AVAX: the curve is seeded with coin only"
        );
    }

    /// @notice The multi-curve config is many positions inside ONE pool, not many pools.
    function test_listing_multipleCurvesLiveInASinglePool() public view {
        ILeakCoinHook.PoolCoin memory pc = ILeakCoinHook(address(hook)).getPoolCoin(poolKey);
        assertEq(pc.coin, address(leakCoin), "hook maps this pool to this coin");
        assertGt(pc.positions.length, 1, "discovery curve is several positions");
        for (uint256 i; i < pc.positions.length; ++i) {
            assertGt(pc.positions[i].liquidity, 0, "every position carries liquidity");
        }
    }

    // ---------------------------------------------------------------------
    // 2. Trading: works in the same block as creation, price moves with flow
    // ---------------------------------------------------------------------

    function test_trade_buyWorksInTheCreationBlock() public {
        address buyer = makeAddr("buyer");
        vm.deal(buyer, 10 ether);

        uint256 before = IERC20(address(leakCoin)).balanceOf(buyer);
        _swapSomeCurrencyForCoin(leakCoin, address(0), 1 ether, buyer);

        assertGt(IERC20(address(leakCoin)).balanceOf(buyer), before, "buyer receives coin");
        assertGt(address(poolManager).balance, 0, "AVAX now backs the curve");
    }

    /// @notice The bonding curve property: each buy leaves the next buyer a worse price.
    function test_trade_priceRisesMonotonicallyWithBuys() public {
        uint160 p0 = PoolStateReader.getSqrtPriceX96(poolKey, poolManager);

        address a = makeAddr("buyerA");
        vm.deal(a, 100 ether);
        _swapSomeCurrencyForCoin(leakCoin, address(0), 5 ether, a);
        uint160 p1 = PoolStateReader.getSqrtPriceX96(poolKey, poolManager);

        address b = makeAddr("buyerB");
        vm.deal(b, 100 ether);
        _swapSomeCurrencyForCoin(leakCoin, address(0), 5 ether, b);
        uint160 p2 = PoolStateReader.getSqrtPriceX96(poolKey, poolManager);

        // sqrtPriceX96 quotes currency1 per currency0. The coin is currency1 (native AVAX sorts
        // first at address(0)), so buying coin makes it scarcer and drives sqrtPrice DOWN.
        assertLt(p1, p0, "first buy repriced the curve");
        assertLt(p2, p1, "second buy repriced it further in the same direction");

        // and the second buyer paid more per coin than the first
        uint256 gotA = IERC20(address(leakCoin)).balanceOf(a);
        uint256 gotB = IERC20(address(leakCoin)).balanceOf(b);
        assertLt(gotB, gotA, "equal AVAX in buys fewer coins later on the curve");
    }

    function test_trade_sellReturnsBackingCurrency() public {
        address trader = makeAddr("trader");
        vm.deal(trader, 100 ether);
        _swapSomeCurrencyForCoin(leakCoin, address(0), 5 ether, trader);

        uint128 coinBalance = uint128(IERC20(address(leakCoin)).balanceOf(trader));
        uint256 avaxBefore = trader.balance;

        _swapSomeCoinForCurrency(leakCoin, address(0), coinBalance / 2, trader);

        assertGt(trader.balance, avaxBefore, "seller gets AVAX back");
        assertEq(IERC20(address(leakCoin)).balanceOf(trader), coinBalance - coinBalance / 2, "half the coin sold");
    }

    // ---------------------------------------------------------------------
    // 3. Economics: the creator earns from trading, with no action on their part
    // ---------------------------------------------------------------------

    function test_trade_paysTheCreatorOutOfSwapFees() public {
        address buyer = makeAddr("feeBuyer");
        vm.deal(buyer, 100 ether);

        uint256 creatorAvaxBefore = users.creator.balance;
        uint256 creatorRewardsBefore = protocolRewards.balanceOf(users.creator);

        _swapSomeCurrencyForCoin(leakCoin, address(0), 10 ether, buyer);

        uint256 gained = (users.creator.balance - creatorAvaxBefore) +
            (protocolRewards.balanceOf(users.creator) - creatorRewardsBefore);
        assertGt(gained, 0, "creator is paid from the swap fee on every trade");
    }

    /// @notice No graduation, no migration, no second venue: the pool key never changes.
    function test_noGraduationStep() public {
        PoolKey memory atCreation = leakCoin.getPoolKey();

        address buyer = makeAddr("whale");
        vm.deal(buyer, 500 ether);
        _swapSomeCurrencyForCoin(leakCoin, address(0), 200 ether, buyer);

        PoolKey memory afterHeavyVolume = leakCoin.getPoolKey();
        assertEq(
            PoolId.unwrap(atCreation.toId()),
            PoolId.unwrap(afterHeavyVolume.toId()),
            "the pool a coin launches into is the pool it trades in forever"
        );
    }
}
