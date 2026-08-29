// SPDX-License-Identifier: MIT
// This software is licensed under the Zora Delayed Open Source License.
// Under this license, you may use, copy, modify, and distribute this software for
// non-commercial purposes only. Commercial use and competitive products are prohibited
// until the "Open Date" (3 years from first public distribution or earlier at Zora's discretion),
// at which point this software automatically becomes available under the MIT License.
// Full license terms available at: https://docs.zora.co/coins/license
pragma solidity ^0.8.23;

import {CoinConstants} from "./CoinConstants.sol";

library CoinConfigurationVersions {
    uint8 constant LEGACY_POOL_VERSION = 1;
    uint8 constant DOPPLER_UNI_V3_POOL_VERSION = 2;
    uint8 constant DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION = 4;

    function getVersion(bytes memory poolConfig) internal pure returns (uint8 version) {
        return (version) = abi.decode(poolConfig, (uint8));
    }

    function isV3(uint8 version) internal pure returns (bool) {
        return version == DOPPLER_UNI_V3_POOL_VERSION || version == LEGACY_POOL_VERSION;
    }

    function isV4(uint8 version) internal pure returns (bool) {
        return version == DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION;
    }

    function decodeVersionAndCurrency(bytes memory poolConfig) internal pure returns (uint8 version, address currency) {
        (version, currency) = abi.decode(poolConfig, (uint8, address));
    }

    function decodeVanillaUniV4(bytes memory poolConfig) internal pure returns (uint8 version, address currency, int24 tickLower_) {
        (version, currency, tickLower_) = abi.decode(poolConfig, (uint8, address, int24));
    }

    function encodeDopplerMultiCurveUniV4(
        address currency,
        int24[] memory tickLower_,
        int24[] memory tickUpper_,
        uint16[] memory numDiscoveryPositions_,
        uint256[] memory maxDiscoverySupplyShare_
    ) internal pure returns (bytes memory) {
        return abi.encode(DOPPLER_MULTICURVE_UNI_V4_POOL_VERSION, currency, tickLower_, tickUpper_, numDiscoveryPositions_, maxDiscoverySupplyShare_);
    }

    function decodeDopplerMultiCurveUniV4(
        bytes memory poolConfig
    )
        internal
        pure
        returns (
            uint8 version,
            address currency,
            int24[] memory tickLower_,
            int24[] memory tickUpper_,
            uint16[] memory numDiscoveryPositions_,
            uint256[] memory maxDiscoverySupplyShare_
        )
    {
        (version, currency, tickLower_, tickUpper_, numDiscoveryPositions_, maxDiscoverySupplyShare_) = abi.decode(
            poolConfig,
            (uint8, address, int24[], int24[], uint16[], uint256[])
        );
    }

    /// @notice LEAK_MEME - dai kham pha rong, mat do thap. Thuong nguoi vao som.
    /// @dev 1 curve, 11 vi the, 5% cung trong discovery (95% o duoi).
    ///      FDV 3.08 -> 768 AVAX, bien do 244x. Cung hinh dang voi curve production
    ///      cua Zora (COIN_ETH_PAIR: $23 -> $5,782), dich sang don vi AVAX.
    function leakMemeCurve(address currency) internal pure returns (bytes memory) {
        int24[] memory tickLower = new int24[](1);
        int24[] memory tickUpper = new int24[](1);
        uint16[] memory numDiscoveryPositions = new uint16[](1);
        uint256[] memory maxDiscoverySupplyShare = new uint256[](1);

        tickLower[0] = -196_000;
        tickUpper[0] = -140_800;
        numDiscoveryPositions[0] = 11;
        maxDiscoverySupplyShare[0] = 0.05e18;

        return encodeDopplerMultiCurveUniV4(currency, tickLower, tickUpper, numDiscoveryPositions, maxDiscoverySupplyShare);
    }

    /// @notice LEAK_STABLE - dai hep, ba curve chong lop, mat do tang dan khi gia len.
    /// @dev 3 curve giao nhau, 33 vi the, 37.5% cung trong discovery.
    ///      FDV 99.9 -> 816 AVAX, bien do chi 8.2x. Chong pump: cang day gia len cang
    ///      kho vi co ba lop thanh khoan chong nhau o vung tren. Cung hinh dang voi
    ///      TREND_COIN_DEFAULT_POOL_CONFIG cua Zora, dich sang don vi AVAX.
    function leakStableCurve(address currency) internal pure returns (bytes memory) {
        int24[] memory tickLower = new int24[](3);
        int24[] memory tickUpper = new int24[](3);
        uint16[] memory numDiscoveryPositions = new uint16[](3);
        uint256[] memory maxDiscoverySupplyShare = new uint256[](3);

        tickLower[0] = -161_200;
        tickUpper[0] = -147_200;
        numDiscoveryPositions[0] = 11;
        maxDiscoverySupplyShare[0] = 0.05e18;

        tickLower[1] = -149_200;
        tickUpper[1] = -140_200;
        numDiscoveryPositions[1] = 11;
        maxDiscoverySupplyShare[1] = 0.125e18;

        tickLower[2] = -143_200;
        tickUpper[2] = -140_200;
        numDiscoveryPositions[2] = 11;
        maxDiscoverySupplyShare[2] = 0.20e18;

        return encodeDopplerMultiCurveUniV4(currency, tickLower, tickUpper, numDiscoveryPositions, maxDiscoverySupplyShare);
    }

    /// @notice Mac dinh cua Leak = LEAK_MEME.
    /// @dev Thay the ban placeholder cua Zora (mang comment "todo: configure defaults"),
    ///      trong do 1 AVAX dau tien mua 10% tong cung va day gia qua 130,000 tick.
    function defaultDopplerMultiCurveUniV4(address currency) internal pure returns (bytes memory) {
        return leakMemeCurve(currency);
    }

    function defaultConfig(address currency) internal pure returns (bytes memory) {
        return defaultDopplerMultiCurveUniV4(currency);
    }
}
