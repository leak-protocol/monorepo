import { Address, BigInt } from "@graphprotocol/graph-ts";
import { assert, clearStore, describe, test, afterEach } from "matchstick-as";
import { handleCoinTransfer } from "../src/coin";
import {
  COIN,
  CREATOR,
  TRADER,
  createCoinTransferEvent,
  seedCoin,
} from "./helpers";

let ZERO = Address.zero();

describe("handleCoinTransfer", () => {
  afterEach(() => {
    clearStore();
  });

  test("mint tu address(0) tang totalSupply va tao mot holder", () => {
    seedCoin(false);
    handleCoinTransfer(
      createCoinTransferEvent(
        ZERO,
        CREATOR,
        BigInt.fromString("1000"),
        BigInt.zero(),
        BigInt.fromString("1000"),
      ),
    );

    assert.entityCount("Holder", 1);
    assert.fieldEquals("Coin", COIN.toHexString(), "totalSupply", "1000");
    assert.fieldEquals("Coin", COIN.toHexString(), "holderCount", "1");
    let holderId = COIN.concat(CREATOR).toHexString();
    assert.fieldEquals("Holder", holderId, "owner", CREATOR.toHexString());
    assert.fieldEquals("Holder", holderId, "balance", "1000");
    assert.fieldEquals("Holder", holderId, "coin", COIN.toHexString());
  });

  test("gan thang so du chu khong cong don", () => {
    seedCoin(false);
    handleCoinTransfer(
      createCoinTransferEvent(
        ZERO,
        CREATOR,
        BigInt.fromString("1000"),
        BigInt.zero(),
        BigInt.fromString("1000"),
      ),
    );
    handleCoinTransfer(
      createCoinTransferEvent(
        CREATOR,
        TRADER,
        BigInt.fromString("400"),
        BigInt.fromString("600"),
        BigInt.fromString("400"),
      ),
    );

    assert.fieldEquals(
      "Holder",
      COIN.concat(CREATOR).toHexString(),
      "balance",
      "600",
    );
    assert.fieldEquals(
      "Holder",
      COIN.concat(TRADER).toHexString(),
      "balance",
      "400",
    );
    assert.fieldEquals("Coin", COIN.toHexString(), "holderCount", "2");
    // totalSupply khong doi vi khong ben nao la address(0)
    assert.fieldEquals("Coin", COIN.toHexString(), "totalSupply", "1000");
  });

  test("holderCount giam khi so du ve 0", () => {
    seedCoin(false);
    handleCoinTransfer(
      createCoinTransferEvent(
        ZERO,
        CREATOR,
        BigInt.fromString("1000"),
        BigInt.zero(),
        BigInt.fromString("1000"),
      ),
    );
    handleCoinTransfer(
      createCoinTransferEvent(
        CREATOR,
        TRADER,
        BigInt.fromString("1000"),
        BigInt.zero(),
        BigInt.fromString("1000"),
      ),
    );

    assert.fieldEquals("Coin", COIN.toHexString(), "holderCount", "1");
    assert.fieldEquals(
      "Holder",
      COIN.concat(CREATOR).toHexString(),
      "balance",
      "0",
    );
  });

  test("burn ve address(0) giam totalSupply va khong tao holder cho dia chi 0", () => {
    seedCoin(false);
    handleCoinTransfer(
      createCoinTransferEvent(
        ZERO,
        CREATOR,
        BigInt.fromString("1000"),
        BigInt.zero(),
        BigInt.fromString("1000"),
      ),
    );
    handleCoinTransfer(
      createCoinTransferEvent(
        CREATOR,
        ZERO,
        BigInt.fromString("250"),
        BigInt.fromString("750"),
        BigInt.zero(),
      ),
    );

    assert.fieldEquals("Coin", COIN.toHexString(), "totalSupply", "750");
    assert.entityCount("Holder", 1);
    assert.notInStore("Holder", COIN.concat(ZERO).toHexString());
  });

  test("bo qua transfer cua coin chua co trong store", () => {
    handleCoinTransfer(
      createCoinTransferEvent(
        ZERO,
        CREATOR,
        BigInt.fromString("1000"),
        BigInt.zero(),
        BigInt.fromString("1000"),
      ),
    );
    assert.entityCount("Holder", 0);
  });
});
