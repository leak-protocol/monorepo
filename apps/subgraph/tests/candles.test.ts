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

function swapAt(
  timestamp: i64,
  sqrtPriceX96: BigInt,
  currencyAmount: string,
): void {
  let event = createSwappedEvent(
    ROUTER,
    TRADER,
    false,
    buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK),
    POOL_KEY_HASH,
    buildSwapParamsTuple(
      true,
      BigInt.fromString("-" + currencyAmount),
      BigInt.zero(),
    ),
    BigInt.fromString("-" + currencyAmount),
    BigInt.fromString("500"),
    true,
    Bytes.empty(),
    sqrtPriceX96,
  );
  event.block.timestamp = BigInt.fromI64(timestamp);
  event.logIndex = BigInt.fromI64(timestamp);
  handleSwapped(event);
}

describe("Candle", () => {
  afterEach(() => {
    clearStore();
  });

  test("mot swap sinh dung ba nen, mot moi khung", () => {
    seedCoin(false);
    swapAt(1700000000, BigInt.fromI32(2).pow(96), "1000");

    assert.entityCount("Candle", 3);
    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-5m-1699999800",
      "periodStart",
      "1699999800",
    );
    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-1h-1699999200",
      "interval",
      "1h",
    );
    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-1d-1699920000",
      "interval",
      "1d",
    );
  });

  test("OHLC theo dung thu tu gia trong cung mot khung 5 phut", () => {
    seedCoin(false);
    let q96 = BigInt.fromI32(2).pow(96);
    // seedCoin(false) -> coinIsToken0 = false -> gia = 1 / ti le.
    // Ca bon moc phai nam trong CUNG khung [1699999800, 1700000100).
    swapAt(1700000000, q96, "1000"); // ti le 1   -> gia 1
    swapAt(1700000020, q96.times(BigInt.fromI32(2)), "1000"); // ti le 4    -> gia 0.25
    swapAt(1700000040, BigInt.fromI32(2).pow(95), "1000"); // ti le 0.25 -> gia 4
    swapAt(1700000060, q96, "1000"); // ti le 1   -> gia 1

    let id = COIN.toHexString() + "-5m-1699999800";
    assert.fieldEquals("Candle", id, "open", "1");
    assert.fieldEquals("Candle", id, "high", "4");
    assert.fieldEquals("Candle", id, "low", "0.25");
    assert.fieldEquals("Candle", id, "close", "1");
    assert.fieldEquals("Candle", id, "swapCount", "4");
    assert.fieldEquals("Candle", id, "volumeCurrency", "4000");
  });

  test("sang khung 5 phut moi thi mo nen moi", () => {
    seedCoin(false);
    let q96 = BigInt.fromI32(2).pow(96);
    swapAt(1700000000, q96, "1000");
    swapAt(1700000400, q96.times(BigInt.fromI32(2)), "1000");

    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-5m-1699999800",
      "close",
      "1",
    );
    // ti le 4 voi coinIsToken0 = false -> gia 0.25
    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-5m-1700000400",
      "open",
      "0.25",
    );
    // van cung mot nen gio
    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-1h-1699999200",
      "swapCount",
      "2",
    );
  });

  test("nen noi ve dung coin", () => {
    seedCoin(false);
    swapAt(1700000000, BigInt.fromI32(2).pow(96), "1000");
    assert.fieldEquals(
      "Candle",
      COIN.toHexString() + "-5m-1699999800",
      "coin",
      COIN.toHexString(),
    );
  });
});
