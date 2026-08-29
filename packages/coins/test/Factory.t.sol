// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {BaseTest} from "./utils/BaseTest.sol";
import {CoinConstants} from "../src/libs/CoinConstants.sol";
import {IHasContractName} from "@zoralabs/shared-contracts/interfaces/IContractMetadata.sol";
import {ILeakFactory} from "../src/interfaces/ILeakFactory.sol";
import {LeakFactoryImpl} from "../src/LeakFactoryImpl.sol";
import {LeakFactory} from "../src/proxy/LeakFactory.sol";
import {ContentCoin} from "../src/ContentCoin.sol";
import {CoinConfigurationVersions} from "../src/libs/CoinConfigurationVersions.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {MockLeakLimitOrderBook} from "./mocks/MockLeakLimitOrderBook.sol";

contract FactoryTest is BaseTest {
    function setUp() public override {
        super.setUpNonForked();
    }

    function test_factory_constructor_and_proxy_setup() public {
        // Impl constructor test
        LeakFactoryImpl impl = new LeakFactoryImpl(
            address(coinV4Impl),
            address(creatorCoinImpl),
            address(trendCoinImpl),
            address(hook),
            address(leakHookRegistry)
        );
        assertEq(LeakFactoryImpl(address(factory)).owner(), users.factoryOwner);
        assertEq(LeakFactoryImpl(address(factory)).coinV4Impl(), address(coinV4Impl));

        // proxy initialization test
        address initialOwner = makeAddr("initialOwner");
        LeakFactory newFactory = new LeakFactory(address(impl));

        // Add the new factory as an owner of the hook registry so it can register hooks during initialization
        address[] memory newOwners = new address[](1);
        newOwners[0] = address(newFactory);
        vm.prank(users.factoryOwner);
        leakHookRegistry.addOwners(newOwners);

        LeakFactoryImpl(address(newFactory)).initialize(address(initialOwner));
        assertEq(LeakFactoryImpl(address(newFactory)).owner(), initialOwner);
    }

    function test_ownable2Step() public {
        // old current impl
        assertEq(LeakFactoryImpl(address(factory)).owner(), users.factoryOwner);

        // 1st ensure owner slot is set at expected address

        bytes32 ownableSlot = hex"9016d09d72d40fdae2fd8ceac6b6234c7706214fd39c1cd1e609a0528c199300";
        bytes32 ownable2StepSlot = hex"237e158222e3e6968b72b9db0d8043aacf074ad9f650f0d1606b4d82ee432c00";

        address ownerAddress = address(uint160(uint256(vm.load(address(factory), ownableSlot))));
        assertEq(ownerAddress, users.factoryOwner);

        assertEq(LeakFactoryImpl(address(factory)).pendingOwner(), address(0));

        address newFactoryImpl = address(
            new LeakFactoryImpl(address(coinV4Impl), address(creatorCoinImpl), address(trendCoinImpl), address(hook), address(leakHookRegistry))
        );

        // Upgrade to current / new impl
        vm.prank(users.factoryOwner);
        LeakFactoryImpl(address(factory)).upgradeToAndCall(newFactoryImpl, "");

        // 2nd ensure owner is read from correct slot
        assertEq(LeakFactoryImpl(address(factory)).owner(), users.factoryOwner);

        address newOwner = makeAddr("newOwner");

        // 3rd ensure pending owner is set correctly
        vm.prank(users.factoryOwner);
        LeakFactoryImpl(address(factory)).transferOwnership(newOwner);
        assertEq(LeakFactoryImpl(address(factory)).pendingOwner(), newOwner);

        address ownerAddress2Step = address(uint160(uint256(vm.load(address(factory), ownable2StepSlot))));
        assertEq(ownerAddress2Step, newOwner);

        // 4th ensure owner is set correctly
        vm.prank(newOwner);
        LeakFactoryImpl(address(factory)).acceptOwnership();
        assertEq(LeakFactoryImpl(address(factory)).owner(), newOwner);
    }

    function test_upgrade() public {
        LeakFactoryImpl newImpl = new LeakFactoryImpl(
            address(coinV4Impl),
            address(creatorCoinImpl),
            address(trendCoinImpl),
            address(hook),
            address(leakHookRegistry)
        );

        vm.prank(users.factoryOwner);
        LeakFactoryImpl(address(factory)).upgradeToAndCall(address(newImpl), "");

        assertEq(factory.implementation(), address(newImpl), "implementation");
    }

    function test_implementation_address() public view {
        assertEq(factory.implementation(), address(factoryImpl));
    }

    function test_revert_invalid_upgrade_impl() public {
        address newImpl = address(this);

        vm.prank(users.factoryOwner);
        vm.expectRevert();
        LeakFactoryImpl(address(factory)).upgradeToAndCall(address(newImpl), "");
    }

    function test_revert_invalid_owner() public {
        LeakFactoryImpl newImpl = new LeakFactoryImpl(
            address(coinV4Impl),
            address(creatorCoinImpl),
            address(trendCoinImpl),
            address(hook),
            address(leakHookRegistry)
        );

        vm.prank(users.creator);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, users.creator));
        LeakFactoryImpl(address(factory)).upgradeToAndCall(address(newImpl), "");
    }

    function test_coinAddress_canBePredicted(
        bool msgSenderChanged,
        bool saltChanged,
        bool poolConfigChanged,
        bool platformReferrerChanged,
        bool nameChanged,
        bool symbolChanged
    ) public {
        address[] memory owners = new address[](1);
        owners[0] = users.creator;

        address payoutRecipient = users.creator;

        bytes32 salt = keccak256(abi.encode(bytes("randomSalt")));

        address msgSender = makeAddr("msgSender");

        string memory uri = "https://test.com";
        string memory name = "Testcoin";
        string memory symbol = "TEST";

        address platformReferrer = users.platformReferrer;

        bytes memory poolConfig = CoinConfigurationVersions.defaultDopplerMultiCurveUniV4(address(0));
        bytes memory poolConfigForGettingAddress = poolConfigChanged ? CoinConfigurationVersions.defaultDopplerMultiCurveUniV4(BACKING_TOKEN_ADDRESS) : poolConfig;

        address expectedCoinAddress = factory.coinAddress(msgSender, name, symbol, poolConfigForGettingAddress, platformReferrer, salt);

        if (msgSenderChanged) {
            msgSender = makeAddr("msgSender2");
        }

        if (saltChanged) {
            salt = keccak256(abi.encode(bytes("randomSalt2")));
        }

        if (platformReferrerChanged) {
            platformReferrer = makeAddr("platformReferrer2");
        }

        if (nameChanged) {
            name = "Testcoin2";
        }

        if (symbolChanged) {
            symbol = "TEST2";
        }

        // now deploy the coin
        vm.prank(msgSender);
        (address coinAddress, ) = factory.deploy(payoutRecipient, owners, uri, name, symbol, poolConfig, platformReferrer, address(0), bytes(""), salt);

        bool addressShouldMismatch = msgSenderChanged || saltChanged || poolConfigChanged || platformReferrerChanged || nameChanged || symbolChanged;

        if (addressShouldMismatch) {
            assertNotEq(coinAddress, expectedCoinAddress, "coinAddress should mismatch");
        } else {
            assertEq(coinAddress, expectedCoinAddress, "coinAddress should match");
        }
    }

    function test_upgrade_with_mismatched_contract_name() public {
        // Create a mock implementation with different contract name
        MockBadFactory badImpl = new MockBadFactory();

        vm.prank(users.factoryOwner);
        vm.expectRevert(abi.encodeWithSelector(ILeakFactory.UpgradeToMismatchedContractName.selector, "LeakCoinFactory", "BadFactory"));
        LeakFactoryImpl(address(factory)).upgradeToAndCall(address(badImpl), "");
    }

    function test_upgrade_auto_registers_hooks() public {
        address[] memory registeredHooks;

        registeredHooks = leakHookRegistry.getHookAddresses();
        assertEq(registeredHooks.length, 1);

        _deployHooks(address(new MockLeakLimitOrderBook())); // Deploys new content and creator coin hook addresses

        // Deploy new factory impl with new content and creator coin hook addresses
        LeakFactoryImpl newImpl = new LeakFactoryImpl(
            address(coinV4Impl),
            address(creatorCoinImpl),
            address(trendCoinImpl),
            address(hook),
            address(leakHookRegistry)
        );

        vm.prank(users.factoryOwner);
        LeakFactoryImpl(address(factory)).upgradeToAndCall(address(newImpl), "");

        registeredHooks = leakHookRegistry.getHookAddresses();
        assertEq(registeredHooks.length, 2);
        assertTrue(leakHookRegistry.isRegisteredHook(address(hook)));
    }
}

// Mock contracts for testing
contract MockBadFactory is IHasContractName {
    function contractName() external pure returns (string memory) {
        return "BadFactory";
    }
}
