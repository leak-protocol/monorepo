// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";

import {ILeakHookRegistry} from "../src/interfaces/ILeakHookRegistry.sol";
import {LeakHookRegistry} from "../src/hook-registry/LeakHookRegistry.sol";

contract MockHook {
    string private _version;

    constructor(string memory version_) {
        _version = version_;
    }

    function contractVersion() public view returns (string memory) {
        return _version;
    }
}

contract MockHookNoVersion {
    // No contractVersion function
}

contract LeakHookRegistryTest is Test {
    address internal owner;

    LeakHookRegistry internal leakHookRegistry;
    MockHook internal mockHook;

    function setUp() public {
        owner = makeAddr("owner");

        address[] memory initialOwners = new address[](1);
        initialOwners[0] = owner;

        leakHookRegistry = new LeakHookRegistry();
        leakHookRegistry.initialize(initialOwners);

        mockHook = new MockHook("0.0.0");
    }

    function test_register_hooks() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        assertEq(leakHookRegistry.isRegisteredHook(hooks[0]), true);

        address[] memory addrs = leakHookRegistry.getHookAddresses();
        assertEq(addrs.length, 1);
        assertEq(addrs[0], hooks[0]);

        assertEq(leakHookRegistry.getHookTag(hooks[0]), tags[0]);

        ILeakHookRegistry.LeakHook[] memory leakHooks = leakHookRegistry.getHooks();
        assertEq(leakHooks.length, 1);
        assertEq(leakHooks[0].hook, hooks[0]);
        assertEq(leakHooks[0].tag, "LeakHook");
        assertEq(leakHooks[0].version, "0.0.0");
    }

    function test_revert_register_hooks_only_owner() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.expectRevert(abi.encodeWithSignature("OnlyOwner()"));
        vm.prank(makeAddr("notOwner"));
        leakHookRegistry.registerHooks(hooks, tags);
    }

    function test_revert_register_hooks_array_length_mismatch() public {
        address[] memory hooks = new address[](2);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        hooks[1] = makeAddr("anotherHook");
        tags[0] = "Tag0";

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("ArrayLengthMismatch()"));
        leakHookRegistry.registerHooks(hooks, tags);
    }

    function test_register_duplicate_is_idempotent() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.startPrank(owner);
        leakHookRegistry.registerHooks(hooks, tags);
        leakHookRegistry.registerHooks(hooks, tags);
        vm.stopPrank();

        assertEq(leakHookRegistry.getHookAddresses().length, 1);
        assertEq(leakHookRegistry.isRegisteredHook(hooks[0]), true);
    }

    function test_remove_hooks() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        vm.prank(owner);
        leakHookRegistry.removeHooks(hooks);

        assertEq(leakHookRegistry.isRegisteredHook(hooks[0]), false);
        assertEq(leakHookRegistry.getHookAddresses().length, 0);
        assertEq(leakHookRegistry.getHookTag(hooks[0]), "");
    }

    function test_revert_remove_hooks_only_owner() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        vm.expectRevert(abi.encodeWithSignature("OnlyOwner()"));
        vm.prank(makeAddr("notOwner"));
        leakHookRegistry.removeHooks(hooks);
    }

    function test_remove_unregistered_noop() public {
        address[] memory hooks = new address[](1);
        hooks[0] = makeAddr("unregistered");

        uint256 beforeLen = leakHookRegistry.getHookAddresses().length;

        vm.prank(owner);
        leakHookRegistry.removeHooks(hooks);

        assertEq(leakHookRegistry.getHookAddresses().length, beforeLen);
        assertEq(leakHookRegistry.isRegisteredHook(hooks[0]), false);
    }

    function test_emit_register_hooks_event() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.expectEmit(true, true, true, false, address(leakHookRegistry));
        emit ILeakHookRegistry.LeakHookRegistered(hooks[0], tags[0], "0.0.0");

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);
    }

    function test_emit_remove_hooks_event() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        hooks[0] = address(mockHook);
        tags[0] = "LeakHook";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        vm.expectEmit(true, true, true, false, address(leakHookRegistry));
        emit ILeakHookRegistry.LeakHookRemoved(hooks[0], tags[0], "0.0.0");

        vm.prank(owner);
        leakHookRegistry.removeHooks(hooks);
    }

    function test_hook_version() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        MockHook hookWithVersion = new MockHook("1.1.1");
        hooks[0] = address(hookWithVersion);
        tags[0] = "CONTENT";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        assertEq(leakHookRegistry.getHookVersion(hooks[0]), "1.1.1");
    }

    function test_hook_version_not_found() public {
        address[] memory hooks = new address[](1);
        string[] memory tags = new string[](1);

        MockHookNoVersion hookNoVersion = new MockHookNoVersion();
        hooks[0] = address(hookNoVersion);
        tags[0] = "CONTENT";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        assertEq(leakHookRegistry.getHookVersion(hooks[0]), "");
    }

    function test_is_registered_hook_false_when_never_registered() public view {
        assertEq(leakHookRegistry.isRegisteredHook(address(this)), false);
    }

    function test_get_hook_addresses_multiple_and_remove_middle() public {
        address a = address(mockHook);
        address b = address(new MockHook("0.0.0"));
        address c = address(new MockHook("0.0.0"));

        address[] memory hooks = new address[](3);
        string[] memory tags = new string[](3);
        hooks[0] = a;
        tags[0] = "A";
        hooks[1] = b;
        tags[1] = "B";
        hooks[2] = c;
        tags[2] = "C";

        vm.prank(owner);
        leakHookRegistry.registerHooks(hooks, tags);

        address[] memory removeB = new address[](1);
        removeB[0] = b;

        vm.prank(owner);
        leakHookRegistry.removeHooks(removeB);

        address[] memory addrs = leakHookRegistry.getHookAddresses();
        assertEq(addrs.length, 2);

        bool hasA;
        bool hasC;
        for (uint256 i = 0; i < addrs.length; i++) {
            if (addrs[i] == a) hasA = true;
            if (addrs[i] == c) hasC = true;
            assertTrue(addrs[i] != b);
        }
        assertTrue(hasA);
        assertTrue(hasC);

        assertEq(leakHookRegistry.getHookTag(a), "A");
        assertEq(leakHookRegistry.getHookTag(b), "");
        assertEq(leakHookRegistry.getHookTag(c), "C");

        ILeakHookRegistry.LeakHook[] memory full = leakHookRegistry.getHooks();
        assertEq(full.length, 2);

        bool okA;
        bool okC;
        for (uint256 i = 0; i < full.length; i++) {
            if (full[i].hook == a) {
                assertEq(full[i].tag, "A");
                assertEq(full[i].version, "0.0.0");
                okA = true;
            } else if (full[i].hook == c) {
                assertEq(full[i].tag, "C");
                assertEq(full[i].version, "0.0.0");
                okC = true;
            }
        }
        assertTrue(okA && okC);
    }
}
