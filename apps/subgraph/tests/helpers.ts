import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { CoinCreatedV4 } from "../generated/LeakFactory/LeakFactoryImpl";
import {
  CoinMarketRewardsV4,
  Swapped,
} from "../generated/LeakCoinHook/LeakCoinHook";
import { CoinTransfer } from "../generated/templates/LeakCoin/ContentCoin";
import { handleCoinCreatedV4 } from "../src/factory";

/**
 * Dia chi gia cho test, sinh tu mot byte lap lai 20 lan.
 * Khong viet chuoi hex 40 ky tu: dia chi test khong co nguon on-chain de dan
 * trong so bang chung, va cong chan chan moi dia chi khong co bang chung.
 * Address.fromBytes doi dung 20 byte, Bytes.fromUint8Array co san (E-205).
 */
function fixtureAddress(fill: i32): Address {
  let raw = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    raw[i] = fill as u8;
  }
  return Address.fromBytes(Bytes.fromUint8Array(raw));
}

export const FACTORY: Address = fixtureAddress(0x11);
export const HOOK: Address = fixtureAddress(0x22);
export const COIN: Address = fixtureAddress(0x33);
export const CURRENCY: Address = fixtureAddress(0x44);
export const CREATOR: Address = fixtureAddress(0x55);
export const TRADER: Address = fixtureAddress(0x66);
export const ROUTER: Address = fixtureAddress(0x77);
export const REFERRER: Address = fixtureAddress(0x88);
export const PROTOCOL: Address = fixtureAddress(0x99);
export const DOPPLER: Address = fixtureAddress(0xaa);

/** bytes32 tuy y, chi can on dinh giua cac lan chay. */
export const POOL_KEY_HASH: Bytes = Bytes.fromHexString(
  "0x00000000000000000000000000000000000000000000000000000000000000aa",
);

/** LP_FEE_V4 = 10_000 (E-403), TICK_SPACING = 200 (E-402). */
export const FEE: i32 = 10000;
export const TICK_SPACING: i32 = 200;

/** PoolKey = (address,address,uint24,int24,address) — E-005. */
export function buildPoolKeyTuple(
  currency0: Address,
  currency1: Address,
  fee: i32,
  tickSpacing: i32,
  hooks: Address,
): ethereum.Tuple {
  let tuple = new ethereum.Tuple();
  tuple.push(ethereum.Value.fromAddress(currency0));
  tuple.push(ethereum.Value.fromAddress(currency1));
  tuple.push(ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(fee)));
  tuple.push(ethereum.Value.fromI32(tickSpacing));
  tuple.push(ethereum.Value.fromAddress(hooks));
  return tuple;
}

/**
 * 11 tham so, dung thu tu cua E-001:
 * caller, payoutRecipient, platformReferrer, currency, uri, name, symbol,
 * coin, poolKey, poolKeyHash, version.
 */
export function createCoinCreatedV4Event(
  caller: Address,
  payoutRecipient: Address,
  platformReferrer: Address,
  currency: Address,
  uri: string,
  name: string,
  symbol: string,
  coin: Address,
  poolKey: ethereum.Tuple,
  poolKeyHash: Bytes,
  version: string,
): CoinCreatedV4 {
  let event = changetype<CoinCreatedV4>(newMockEvent());
  event.address = FACTORY;
  event.parameters = new Array<ethereum.EventParam>();
  event.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "payoutRecipient",
      ethereum.Value.fromAddress(payoutRecipient),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "platformReferrer",
      ethereum.Value.fromAddress(platformReferrer),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency)),
  );
  event.parameters.push(
    new ethereum.EventParam("uri", ethereum.Value.fromString(uri)),
  );
  event.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
  );
  event.parameters.push(
    new ethereum.EventParam("symbol", ethereum.Value.fromString(symbol)),
  );
  event.parameters.push(
    new ethereum.EventParam("coin", ethereum.Value.fromAddress(coin)),
  );
  event.parameters.push(
    new ethereum.EventParam("poolKey", ethereum.Value.fromTuple(poolKey)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "poolKeyHash",
      ethereum.Value.fromFixedBytes(poolKeyHash),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam("version", ethereum.Value.fromString(version)),
  );
  return event;
}

/** SwapParams = (bool,int256,uint160) — E-014. */
export function buildSwapParamsTuple(
  zeroForOne: boolean,
  amountSpecified: BigInt,
  sqrtPriceLimitX96: BigInt,
): ethereum.Tuple {
  let tuple = new ethereum.Tuple();
  tuple.push(ethereum.Value.fromBoolean(zeroForOne));
  tuple.push(ethereum.Value.fromSignedBigInt(amountSpecified));
  tuple.push(ethereum.Value.fromUnsignedBigInt(sqrtPriceLimitX96));
  return tuple;
}

/**
 * 11 tham so, dung thu tu cua E-010:
 * sender, swapSender, isTrustedSwapSenderAddress, key, poolKeyHash, params,
 * amount0, amount1, isCoinBuy, hookData, sqrtPriceX96.
 */
export function createSwappedEvent(
  sender: Address,
  swapSender: Address,
  isTrustedSwapSenderAddress: boolean,
  key: ethereum.Tuple,
  poolKeyHash: Bytes,
  params: ethereum.Tuple,
  amount0: BigInt,
  amount1: BigInt,
  isCoinBuy: boolean,
  hookData: Bytes,
  sqrtPriceX96: BigInt,
): Swapped {
  let event = changetype<Swapped>(newMockEvent());
  event.address = HOOK;
  event.parameters = new Array<ethereum.EventParam>();
  event.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "swapSender",
      ethereum.Value.fromAddress(swapSender),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "isTrustedSwapSenderAddress",
      ethereum.Value.fromBoolean(isTrustedSwapSenderAddress),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam("key", ethereum.Value.fromTuple(key)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "poolKeyHash",
      ethereum.Value.fromFixedBytes(poolKeyHash),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam("params", ethereum.Value.fromTuple(params)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "amount0",
      ethereum.Value.fromSignedBigInt(amount0),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "amount1",
      ethereum.Value.fromSignedBigInt(amount1),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam("isCoinBuy", ethereum.Value.fromBoolean(isCoinBuy)),
  );
  event.parameters.push(
    new ethereum.EventParam("hookData", ethereum.Value.fromBytes(hookData)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "sqrtPriceX96",
      ethereum.Value.fromUnsignedBigInt(sqrtPriceX96),
    ),
  );
  return event;
}

/** Dung mot Coin san co de test cac handler khong tao Coin. */
export function seedCoin(coinIsToken0: boolean): void {
  let poolKey = coinIsToken0
    ? buildPoolKeyTuple(COIN, CURRENCY, FEE, TICK_SPACING, HOOK)
    : buildPoolKeyTuple(CURRENCY, COIN, FEE, TICK_SPACING, HOOK);
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
}

/** 5 tham so, dung thu tu cua E-040. */
export function createCoinTransferEvent(
  sender: Address,
  recipient: Address,
  amount: BigInt,
  senderBalance: BigInt,
  recipientBalance: BigInt,
): CoinTransfer {
  let event = changetype<CoinTransfer>(newMockEvent());
  event.address = COIN;
  event.parameters = new Array<ethereum.EventParam>();
  event.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
  );
  event.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "amount",
      ethereum.Value.fromUnsignedBigInt(amount),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "senderBalance",
      ethereum.Value.fromUnsignedBigInt(senderBalance),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "recipientBalance",
      ethereum.Value.fromUnsignedBigInt(recipientBalance),
    ),
  );
  return event;
}

/** 10 truong uint256, thu tu theo E-024. */
export function buildMarketRewardsTuple(
  creatorCurrency: BigInt,
  creatorCoin: BigInt,
  platformReferrerCurrency: BigInt,
  platformReferrerCoin: BigInt,
  tradeReferrerCurrency: BigInt,
  tradeReferrerCoin: BigInt,
  protocolCurrency: BigInt,
  protocolCoin: BigInt,
  dopplerCurrency: BigInt,
  dopplerCoin: BigInt,
): ethereum.Tuple {
  let tuple = new ethereum.Tuple();
  tuple.push(ethereum.Value.fromUnsignedBigInt(creatorCurrency));
  tuple.push(ethereum.Value.fromUnsignedBigInt(creatorCoin));
  tuple.push(ethereum.Value.fromUnsignedBigInt(platformReferrerCurrency));
  tuple.push(ethereum.Value.fromUnsignedBigInt(platformReferrerCoin));
  tuple.push(ethereum.Value.fromUnsignedBigInt(tradeReferrerCurrency));
  tuple.push(ethereum.Value.fromUnsignedBigInt(tradeReferrerCoin));
  tuple.push(ethereum.Value.fromUnsignedBigInt(protocolCurrency));
  tuple.push(ethereum.Value.fromUnsignedBigInt(protocolCoin));
  tuple.push(ethereum.Value.fromUnsignedBigInt(dopplerCurrency));
  tuple.push(ethereum.Value.fromUnsignedBigInt(dopplerCoin));
  return tuple;
}

/**
 * 8 tham so, thu tu theo E-020 (ABI), KHONG theo doc-comment (E-022):
 * coin, currency, payoutRecipient, platformReferrer, tradeReferrer,
 * protocolRewardRecipient, dopplerRecipient, marketRewards.
 */
export function createCoinMarketRewardsV4Event(
  coin: Address,
  currency: Address,
  payoutRecipient: Address,
  platformReferrer: Address,
  tradeReferrer: Address,
  protocolRewardRecipient: Address,
  dopplerRecipient: Address,
  marketRewards: ethereum.Tuple,
): CoinMarketRewardsV4 {
  let event = changetype<CoinMarketRewardsV4>(newMockEvent());
  event.address = HOOK;
  event.parameters = new Array<ethereum.EventParam>();
  event.parameters.push(
    new ethereum.EventParam("coin", ethereum.Value.fromAddress(coin)),
  );
  event.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "payoutRecipient",
      ethereum.Value.fromAddress(payoutRecipient),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "platformReferrer",
      ethereum.Value.fromAddress(platformReferrer),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "tradeReferrer",
      ethereum.Value.fromAddress(tradeReferrer),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "protocolRewardRecipient",
      ethereum.Value.fromAddress(protocolRewardRecipient),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "dopplerRecipient",
      ethereum.Value.fromAddress(dopplerRecipient),
    ),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "marketRewards",
      ethereum.Value.fromTuple(marketRewards),
    ),
  );
  return event;
}
