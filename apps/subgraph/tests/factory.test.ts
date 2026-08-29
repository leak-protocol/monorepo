import { assert, clearStore, describe, test, afterEach } from "matchstick-as";
import { handleCoinCreatedV4 } from "../src/factory";
import {
  COIN,
  CREATOR,
  CURRENCY,
  FEE,
  POOL_KEY_HASH,
  REFERRER,
  TICK_SPACING,
  HOOK,
  buildPoolKeyTuple,
  createCoinCreatedV4Event,
} from "./helpers";

describe("handleCoinCreatedV4", () => {
  afterEach(() => {
    clearStore();
  });

  test("ghi day du 11 truong cua event vao entity Coin", () => {
    // poolKey dung voi coin o vi tri currency1 -> coinIsToken0 phai la false
    let poolKey = buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK);
    let event = createCoinCreatedV4Event(
      CREATOR,
      CREATOR,
      REFERRER,
      CURRENCY,
      "ipfs://leak",
      "Leak Test",
      "LEAK",
      COIN,
      poolKey,
      POOL_KEY_HASH,
      "1.0.0",
    );

    handleCoinCreatedV4(event);

    let id = COIN.toHexString();
    assert.entityCount("Coin", 1);
    assert.fieldEquals("Coin", id, "caller", CREATOR.toHexString());
    assert.fieldEquals("Coin", id, "payoutRecipient", CREATOR.toHexString());
    assert.fieldEquals("Coin", id, "platformReferrer", REFERRER.toHexString());
    assert.fieldEquals("Coin", id, "currency", CURRENCY.toHexString());
    assert.fieldEquals("Coin", id, "uri", "ipfs://leak");
    assert.fieldEquals("Coin", id, "name", "Leak Test");
    assert.fieldEquals("Coin", id, "symbol", "LEAK");
    assert.fieldEquals("Coin", id, "version", "1.0.0");
    assert.fieldEquals("Coin", id, "poolKeyHash", POOL_KEY_HASH.toHexString());
    assert.fieldEquals("Coin", id, "currency0", CURRENCY.toHexString());
    assert.fieldEquals("Coin", id, "currency1", COIN.toHexString());
    assert.fieldEquals("Coin", id, "fee", "10000");
    assert.fieldEquals("Coin", id, "tickSpacing", "200");
    assert.fieldEquals("Coin", id, "hooks", HOOK.toHexString());
    assert.fieldEquals("Coin", id, "coinIsToken0", "false");
    assert.fieldEquals("Coin", id, "decimals", "18");
    assert.fieldEquals("Coin", id, "totalSupply", "0");
    assert.fieldEquals("Coin", id, "holderCount", "0");
    assert.fieldEquals("Coin", id, "swapCount", "0");
    assert.fieldEquals("Coin", id, "volumeCurrency", "0");
  });

  test("coinIsToken0 dung true khi coin la currency0", () => {
    let poolKey = buildPoolKeyTuple(COIN, CURRENCY, FEE, TICK_SPACING, HOOK);
    let event = createCoinCreatedV4Event(
      CREATOR,
      CREATOR,
      REFERRER,
      CURRENCY,
      "ipfs://leak",
      "Leak Test",
      "LEAK",
      COIN,
      poolKey,
      POOL_KEY_HASH,
      "1.0.0",
    );

    handleCoinCreatedV4(event);

    assert.fieldEquals("Coin", COIN.toHexString(), "coinIsToken0", "true");
  });

  test("tao data source dong cho coin clone", () => {
    let poolKey = buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK);
    let event = createCoinCreatedV4Event(
      CREATOR,
      CREATOR,
      REFERRER,
      CURRENCY,
      "ipfs://leak",
      "Leak Test",
      "LEAK",
      COIN,
      poolKey,
      POOL_KEY_HASH,
      "1.0.0",
    );

    handleCoinCreatedV4(event);

    assert.dataSourceCount("LeakCoin", 1);
    assert.dataSourceExists("LeakCoin", COIN.toHexString());
  });
});
