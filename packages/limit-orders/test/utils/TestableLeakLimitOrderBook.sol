// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {LeakLimitOrderBook} from "../../src/LeakLimitOrderBook.sol";
import {LimitOrderTypes} from "../../src/libs/LimitOrderTypes.sol";
import {LimitOrderStorage} from "../../src/libs/LimitOrderStorage.sol";
import {LimitOrderViews} from "../../src/libs/LimitOrderViews.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

contract TestableLeakLimitOrderBook is LeakLimitOrderBook {
    constructor(
        address poolManager_,
        address zoraCoinVersionLookup_,
        address leakHookRegistry_,
        address owner_,
        address weth_
    ) LeakLimitOrderBook(poolManager_, zoraCoinVersionLookup_, leakHookRegistry_, owner_, weth_) {}

    function exposedTickQueue(bytes32 poolKeyHash, address coin, int24 tick) external view returns (LimitOrderTypes.Queue memory) {
        return getTickQueue(poolKeyHash, coin, tick);
    }

    function exposedTickBitmap(bytes32 poolKeyHash, address coin, int16 wordPos) external view returns (uint256) {
        return LimitOrderStorage.layout().tickBitmaps[poolKeyHash][coin][wordPos];
    }

    function exposedMakerNonce(address maker) external view returns (uint256) {
        return getMakerNonce(maker);
    }

    function exposedPoolEpoch(bytes32 poolKeyHash) external view returns (uint256) {
        return getPoolEpoch(poolKeyHash);
    }

    function exposedResolveTickRange(
        PoolKey calldata key,
        bool isCurrency0,
        int24 startTick,
        int24 endTick
    ) external view returns (int24 resolvedStart, int24 resolvedEnd) {
        LimitOrderStorage.Layout storage state = LimitOrderStorage.layout();
        (, resolvedStart, resolvedEnd) = LimitOrderViews.validateTickRange(state, poolManager, key, isCurrency0, startTick, endTick);
    }

    function exposedOrder(bytes32 orderId) external view returns (LimitOrderTypes.LimitOrder memory) {
        return LimitOrderStorage.layout().limitOrders[orderId];
    }

    function forceOrderStatus(bytes32 orderId, LimitOrderTypes.OrderStatus newStatus) external {
        LimitOrderStorage.layout().limitOrders[orderId].status = newStatus;
    }
}
