import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { assert, clearStore, describe, test, afterEach } from "matchstick-as";
import { handleSwapped } from "../src/hook";
import {
  COIN,
  CURRENCY,
  FEE,
  HOOK,
  POOL_KEY_HASH,
  ROUTER,
  TICK_SPACING,
  TRADER,
  buildPoolKeyTuple,
  buildSwapParamsTuple,
  createSwappedEvent,
  seedCoin,
} from "./helpers";

describe("handleSwapped", () => {
  afterEach(() => {
    clearStore();
  });

  test("ghi Swap va noi ve dung Coin khi coin la currency1", () => {
    seedCoin(false);
    let q96 = BigInt.fromI32(2).pow(96);
    let event = createSwappedEvent(
      ROUTER,
      TRADER,
      false,
      buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK),
      POOL_KEY_HASH,
      buildSwapParamsTuple(true, BigInt.fromString("-1000"), BigInt.zero()),
      BigInt.fromString("-1000"),
      BigInt.fromString("500"),
      true,
      Bytes.empty(),
      q96,
    );

    handleSwapped(event);

    let id = event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .toHexString();
    assert.entityCount("Swap", 1);
    assert.fieldEquals("Swap", id, "coin", COIN.toHexString());
    assert.fieldEquals("Swap", id, "sender", ROUTER.toHexString());
    assert.fieldEquals("Swap", id, "trader", TRADER.toHexString());
    assert.fieldEquals("Swap", id, "isTrustedSwapSender", "false");
    assert.fieldEquals("Swap", id, "isCoinBuy", "true");
    assert.fieldEquals("Swap", id, "zeroForOne", "true");
    assert.fieldEquals("Swap", id, "amountSpecified", "-1000");
    assert.fieldEquals("Swap", id, "amount0", "-1000");
    assert.fieldEquals("Swap", id, "amount1", "500");
    // coin la currency1 -> coinAmount lay tu amount1, currencyAmount tu amount0
    assert.fieldEquals("Swap", id, "coinAmount", "500");
    assert.fieldEquals("Swap", id, "currencyAmount", "1000");
    assert.fieldEquals("Swap", id, "priceInCurrency", "1");
    assert.fieldEquals("Swap", id, "logIndex", "1");
  });

  test("doi chieu khi coin la currency0", () => {
    seedCoin(true);
    let q96 = BigInt.fromI32(2).pow(96);
    let event = createSwappedEvent(
      ROUTER,
      TRADER,
      true,
      buildPoolKeyTuple(COIN, CURRENCY, FEE, TICK_SPACING, HOOK),
      POOL_KEY_HASH,
      buildSwapParamsTuple(false, BigInt.fromString("-700"), BigInt.zero()),
      BigInt.fromString("300"),
      BigInt.fromString("-700"),
      true,
      Bytes.empty(),
      q96,
    );

    handleSwapped(event);

    let id = event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .toHexString();
    assert.fieldEquals("Swap", id, "coinAmount", "300");
    assert.fieldEquals("Swap", id, "currencyAmount", "700");
    assert.fieldEquals("Swap", id, "isTrustedSwapSender", "true");
  });

  test("cong don swapCount, volumeCurrency va lastPrice vao Coin", () => {
    seedCoin(false);
    let q96 = BigInt.fromI32(2).pow(96);
    let event = createSwappedEvent(
      ROUTER,
      TRADER,
      false,
      buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK),
      POOL_KEY_HASH,
      buildSwapParamsTuple(true, BigInt.fromString("-1000"), BigInt.zero()),
      BigInt.fromString("-1000"),
      BigInt.fromString("500"),
      true,
      Bytes.empty(),
      q96,
    );

    handleSwapped(event);
    // Swap la @entity(immutable: true) nen lan hai phai co id khac.
    event.logIndex = BigInt.fromI32(2);
    handleSwapped(event);

    let coinId = COIN.toHexString();
    assert.fieldEquals("Coin", coinId, "swapCount", "2");
    assert.fieldEquals("Coin", coinId, "volumeCurrency", "2000");
    assert.fieldEquals("Coin", coinId, "lastPrice", "1");
    assert.fieldEquals("Coin", coinId, "lastSqrtPriceX96", q96.toString());
  });

  test("bo qua swap cua pool khong co Coin nao trong store", () => {
    let q96 = BigInt.fromI32(2).pow(96);
    let event = createSwappedEvent(
      ROUTER,
      TRADER,
      false,
      buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK),
      POOL_KEY_HASH,
      buildSwapParamsTuple(true, BigInt.fromString("-1000"), BigInt.zero()),
      BigInt.fromString("-1000"),
      BigInt.fromString("500"),
      true,
      Bytes.empty(),
      q96,
    );

    handleSwapped(event);

    assert.entityCount("Swap", 0);
  });
});
