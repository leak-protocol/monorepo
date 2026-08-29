import { BigInt } from "@graphprotocol/graph-ts";
import { CoinCreatedV4 } from "../generated/LeakFactory/LeakFactoryImpl";
import { Coin } from "../generated/schema";
import { LeakCoin } from "../generated/templates";
import { COIN_DECIMALS, ZERO_BD, ZERO_BI } from "./constants";

/**
 * CoinCreatedV4 — 11 tham so, thu tu theo E-001. Phat tu dia chi proxy cua
 * factory (E-050). Coin la ERC-1167 clone nen phai bat dau index no bang
 * data source dong (E-055).
 */
export function handleCoinCreatedV4(event: CoinCreatedV4): void {
  let coin = new Coin(event.params.coin);

  coin.caller = event.params.caller;
  coin.payoutRecipient = event.params.payoutRecipient;
  coin.platformReferrer = event.params.platformReferrer;
  coin.currency = event.params.currency;
  coin.uri = event.params.uri;
  coin.name = event.params.name;
  coin.symbol = event.params.symbol;
  coin.version = event.params.version;

  coin.poolKeyHash = event.params.poolKeyHash;
  coin.currency0 = event.params.poolKey.currency0;
  coin.currency1 = event.params.poolKey.currency1;
  coin.fee = event.params.poolKey.fee;
  coin.tickSpacing = event.params.poolKey.tickSpacing;
  coin.hooks = event.params.poolKey.hooks;
  coin.coinIsToken0 = event.params.poolKey.currency0.equals(event.params.coin);

  coin.decimals = COIN_DECIMALS;
  coin.totalSupply = ZERO_BI;
  coin.holderCount = 0;
  coin.swapCount = 0;
  coin.volumeCurrency = ZERO_BI;
  coin.lastPrice = ZERO_BD;
  coin.lastSqrtPriceX96 = ZERO_BI;

  coin.createdAt = event.block.timestamp;
  coin.createdAtBlock = event.block.number;
  coin.createdTx = event.transaction.hash;

  coin.save();

  LeakCoin.create(event.params.coin);
}
