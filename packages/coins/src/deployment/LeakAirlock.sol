// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IAirlock} from "../interfaces/IAirlock.sol";

/// @title LeakAirlock
/// @notice Stands in for Doppler's Airlock, which is not deployed on Avalanche C-Chain.
/// @dev BaseCoin calls `IAirlock(airlock).owner()` in exactly one place — `dopplerFeeRecipient()` —
///      to decide who receives the curve-author share of market rewards. Nothing else in the
///      protocol touches Airlock, so a single owned address satisfies the whole interface.
contract LeakAirlock is IAirlock {
    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error AddressZero();

    address private _owner;

    constructor(address owner_) {
        if (owner_ == address(0)) revert AddressZero();
        _owner = owner_;
        emit OwnerUpdated(address(0), owner_);
    }

    function owner() external view override returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != _owner) revert NotOwner();
        if (newOwner == address(0)) revert AddressZero();
        emit OwnerUpdated(_owner, newOwner);
        _owner = newOwner;
    }
}
