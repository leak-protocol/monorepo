// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ILeakLimitOrderBook} from "../../src/interfaces/ILeakLimitOrderBook.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

/// @title MockLeakLimitOrderBook
/// @notice Mock implementation of ILeakLimitOrderBook for testing purposes
contract MockLeakLimitOrderBook is ILeakLimitOrderBook {
    /// @notice Fills limit orders within a tick window (mock implementation does nothing)
    function fill(PoolKey calldata, bool, int24, int24, uint256, address) external override {
        // Mock implementation - does nothing
    }
}
