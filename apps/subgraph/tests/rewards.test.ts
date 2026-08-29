import { BigInt } from "@graphprotocol/graph-ts";
import { assert, clearStore, describe, test, afterEach } from "matchstick-as";
import { handleCoinMarketRewardsV4 } from "../src/hook";
import {
  COIN,
  CREATOR,
  CURRENCY,
  DOPPLER,
  PROTOCOL,
  REFERRER,
  TRADER,
  buildMarketRewardsTuple,
  createCoinMarketRewardsV4Event,
  seedCoin,
} from "./helpers";

describe("handleCoinMarketRewardsV4", () => {
  afterEach(() => {
    clearStore();
  });

  test("sinh mot hang cho moi vai tro co so tien khac 0", () => {
    seedCoin(false);
    let event = createCoinMarketRewardsV4Event(
      COIN,
      CURRENCY,
      CREATOR,
      REFERRER,
      TRADER,
      PROTOCOL,
      DOPPLER,
      buildMarketRewardsTuple(
        BigInt.fromString("500"),
        BigInt.zero(),
        BigInt.fromString("100"),
        BigInt.zero(),
        BigInt.zero(),
        BigInt.zero(),
        BigInt.fromString("50"),
        BigInt.zero(),
        BigInt.fromString("25"),
        BigInt.zero(),
      ),
    );

    handleCoinMarketRewardsV4(event);

    // tradeReferrer = 0 nen bi bo qua -> 4 hang
    assert.entityCount("RewardPayout", 4);

    let base = event.transaction.hash.concatI32(event.logIndex.toI32());
    let creatorId = base.concatI32(0).toHexString();
    assert.fieldEquals("RewardPayout", creatorId, "role", "creator");
    assert.fieldEquals(
      "RewardPayout",
      creatorId,
      "recipient",
      CREATOR.toHexString(),
    );
    assert.fieldEquals("RewardPayout", creatorId, "amountCurrency", "500");
    assert.fieldEquals("RewardPayout", creatorId, "amountCoin", "0");
    assert.fieldEquals(
      "RewardPayout",
      creatorId,
      "currency",
      CURRENCY.toHexString(),
    );
    assert.fieldEquals("RewardPayout", creatorId, "coin", COIN.toHexString());

    assert.fieldEquals(
      "RewardPayout",
      base.concatI32(1).toHexString(),
      "role",
      "platformReferrer",
    );
    assert.fieldEquals(
      "RewardPayout",
      base.concatI32(3).toHexString(),
      "role",
      "protocol",
    );
    assert.fieldEquals(
      "RewardPayout",
      base.concatI32(4).toHexString(),
      "role",
      "doppler",
    );
    assert.notInStore("RewardPayout", base.concatI32(2).toHexString());
  });

  test("khong sinh hang nao khi moi so tien deu 0", () => {
    seedCoin(false);
    handleCoinMarketRewardsV4(
      createCoinMarketRewardsV4Event(
        COIN,
        CURRENCY,
        CREATOR,
        REFERRER,
        TRADER,
        PROTOCOL,
        DOPPLER,
        buildMarketRewardsTuple(
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
        ),
      ),
    );

    assert.entityCount("RewardPayout", 0);
  });

  test("bo qua khi coin chua co trong store", () => {
    handleCoinMarketRewardsV4(
      createCoinMarketRewardsV4Event(
        COIN,
        CURRENCY,
        CREATOR,
        REFERRER,
        TRADER,
        PROTOCOL,
        DOPPLER,
        buildMarketRewardsTuple(
          BigInt.fromString("500"),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
          BigInt.zero(),
        ),
      ),
    );

    assert.entityCount("RewardPayout", 0);
  });
});
