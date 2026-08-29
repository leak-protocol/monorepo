// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @dev Avalanche C-Chain, chain id 43114. Every address below was verified with
///      eth_getCode against https://api.avax.network/ext/bc/C/rpc before being written here.
contract ContractAddresses {
    /// @dev Fork tests pin this block so runs are reproducible.
    uint256 internal constant AVALANCHE_FORK_BLOCK = 93821000;

    /// @dev Wrapped native gas token. Replaces WETH on Base.
    address internal constant WETH_ADDRESS = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    /// @dev Backing currency for creator coins. Replaces the BACKING token on Base.
    address internal constant BACKING_TOKEN_ADDRESS = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

    /// @dev Uniswap v3, used only by the legacy coin path.
    address internal constant V3_FACTORY = 0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD;
    address internal constant NONFUNGIBLE_POSITION_MANAGER = 0x655C406EBFa14EE2006250925e54ec43AD184f8B;
    address internal constant SWAP_ROUTER = 0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE;

    /// @dev Doppler Airlock is not deployed on Avalanche. Fork tests etch a mock at this
    ///      address; production deploys LeakAirlock. Only owner() is ever called on it.
    address internal constant DOPPLER_AIRLOCK = 0x660eAaEdEBc968f8f3694354FA8EC0b4c5Ba8D12;

    address internal constant USDC_ADDRESS = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;

    /// @dev Uniswap v4.
    address internal constant V4_POOL_MANAGER = 0x06380C0e0912312B5150364B9DC4542BA0DbBc85;
    address internal constant V4_POSITION_MANAGER = 0xB74b1F14d2754AcfcbBe1a221023a5cf50Ab8ACD;
    address internal constant V4_PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address internal constant V4_QUOTER = 0xbE40675BB704506a3c2Ccfb762DCFd1e979845C2;
    /// @dev UniversalRouter matching the vendored v4-periphery action encoding. Avalanche also
    ///      hosts a newer router at 0x8B844f885672f333Bc0042cB669255f93a4C1E6b whose
    ///      ExactInputSingleParams layout this repo does not encode for: routing through it makes
    ///      PoolManager.unlockCallback revert on decode. Do not mix the two.
    address internal constant UNIVERSAL_ROUTER = 0x94b75331AE8d42C1b61065089B7d48FE14aA73b7;
}
