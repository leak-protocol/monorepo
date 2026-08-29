import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  CoinMarketRewardsV4,
  Swapped,
} from "../generated/LeakCoinHook/LeakCoinHook";
import { Coin, RewardPayout, Swap } from "../generated/schema";
import { updateCandles } from "./candles";
import { sqrtPriceX96ToCoinPrice } from "./price";

/**
 * Coin luon la mot trong hai currency cua poolKey (E-017), nen hai lan load la
 * du de noi Swapped ve dung coin. Khong can bang tra poolKeyHash -> coin, nho
 * vay giu dung sau entity cua spec §7.
 */
export function loadCoinFromPoolKey(
  currency0: Bytes,
  currency1: Bytes,
): Coin | null {
  let coin = Coin.load(currency0);
  if (coin != null) {
    return coin;
  }
  return Coin.load(currency1);
}

/**
 * Swapped — 11 tham so, thu tu theo E-010, phat tu dia chi hook (E-051).
 * Huong mua/ban lay tu isCoinBuy (E-016). Quy uoc dau cua amount0/amount1
 * KHONG duoc xac minh (E-901) nen khoi luong lay tri tuyet doi.
 */
export function handleSwapped(event: Swapped): void {
  let coin = loadCoinFromPoolKey(
    event.params.key.currency0,
    event.params.key.currency1,
  );
  if (coin == null) {
    return;
  }

  let amount0 = event.params.amount0;
  let amount1 = event.params.amount1;
  let coinAmount = coin.coinIsToken0 ? amount0.abs() : amount1.abs();
  let currencyAmount = coin.coinIsToken0 ? amount1.abs() : amount0.abs();
  let price = sqrtPriceX96ToCoinPrice(
    event.params.sqrtPriceX96,
    coin.coinIsToken0,
  );

  let swap = new Swap(event.transaction.hash.concatI32(event.logIndex.toI32()));
  swap.coin = coin.id;
  swap.sender = event.params.sender;
  swap.trader = event.params.swapSender;
  swap.isTrustedSwapSender = event.params.isTrustedSwapSenderAddress;
  swap.isCoinBuy = event.params.isCoinBuy;
  swap.zeroForOne = event.params.params.zeroForOne;
  swap.amountSpecified = event.params.params.amountSpecified;
  swap.coinAmount = coinAmount;
  swap.currencyAmount = currencyAmount;
  swap.amount0 = amount0;
  swap.amount1 = amount1;
  swap.sqrtPriceX96 = event.params.sqrtPriceX96;
  swap.priceInCurrency = price;
  swap.timestamp = event.block.timestamp;
  swap.blockNumber = event.block.number;
  swap.txHash = event.transaction.hash;
  swap.logIndex = event.logIndex;
  swap.save();

  coin.swapCount = coin.swapCount + 1;
  coin.volumeCurrency = coin.volumeCurrency.plus(currencyAmount);
  coin.lastPrice = price;
  coin.lastSqrtPriceX96 = event.params.sqrtPriceX96;

  updateCandles(coin, price, currencyAmount, event.block.timestamp);

  coin.save();
}

/**
 * CoinMarketRewardsV4 — 8 tham so, KHONG co tham so indexed nao (E-021), nen
 * loc theo coin phai lam trong handler. Thu tu tham so theo ABI (E-020), khong
 * theo doc-comment (E-022): tradeReferrer dung TRUOC protocolRewardRecipient.
 * Emit tu dia chi hook vi CoinRewardsV4 la library internal (E-052).
 */
export function handleCoinMarketRewardsV4(event: CoinMarketRewardsV4): void {
  let coin = Coin.load(event.params.coin);
  if (coin == null) {
    return;
  }

  let rewards = event.params.marketRewards;
  let base = event.transaction.hash.concatI32(event.logIndex.toI32());

  // Thu tu 5 vai tro khop thu tu 10 truong cua tuple (E-024).
  let roles: string[] = [
    "creator",
    "platformReferrer",
    "tradeReferrer",
    "protocol",
    "doppler",
  ];
  let recipients: Bytes[] = [
    event.params.payoutRecipient,
    event.params.platformReferrer,
    event.params.tradeReferrer,
    event.params.protocolRewardRecipient,
    event.params.dopplerRecipient,
  ];
  let currencyAmounts: BigInt[] = [
    rewards.creatorPayoutAmountCurrency,
    rewards.platformReferrerAmountCurrency,
    rewards.tradeReferrerAmountCurrency,
    rewards.protocolAmountCurrency,
    rewards.dopplerAmountCurrency,
  ];
  // O nhanh content coin cac truong nay luon 0 (E-025); van ghi de khong phai
  // doi schema khi nhanh khac bat dau tra thuong bang coin.
  let coinAmounts: BigInt[] = [
    rewards.creatorPayoutAmountCoin,
    rewards.platformReferrerAmountCoin,
    rewards.tradeReferrerAmountCoin,
    rewards.protocolAmountCoin,
    rewards.dopplerAmountCoin,
  ];

  for (let i = 0; i < roles.length; i++) {
    if (currencyAmounts[i].isZero() && coinAmounts[i].isZero()) {
      continue;
    }
    let payout = new RewardPayout(base.concatI32(i));
    payout.coin = coin.id;
    payout.currency = event.params.currency;
    payout.role = roles[i];
    payout.recipient = recipients[i];
    payout.amountCurrency = currencyAmounts[i];
    payout.amountCoin = coinAmounts[i];
    payout.timestamp = event.block.timestamp;
    payout.blockNumber = event.block.number;
    payout.txHash = event.transaction.hash;
    payout.logIndex = event.logIndex;
    payout.save();
  }
}
