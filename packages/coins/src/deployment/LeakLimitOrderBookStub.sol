// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {ILeakLimitOrderBook} from "../interfaces/ILeakLimitOrderBook.sol";

/// @title LeakLimitOrderBookStub
/// @notice No-op stand-in for the limit order book.
/// @dev The hook calls `fill()` on every swap that moves the tick, and its constructor
///      requires a non-zero address. Leak v1 ships without limit orders, so this stub
///      satisfies both without pulling in the whole order-book package. Replace with a
///      real implementation later by deploying a new hook pointed at it.
contract LeakLimitOrderBookStub is ILeakLimitOrderBook {
    /// @inheritdoc ILeakLimitOrderBook
    function fill(PoolKey calldata, bool, int24, int24, uint256, address) external override {
        // intentionally empty
    }
}
