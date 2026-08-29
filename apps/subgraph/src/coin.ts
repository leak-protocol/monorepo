import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { CoinTransfer } from "../generated/templates/LeakCoin/ContentCoin";
import { Coin, Holder } from "../generated/schema";
import { ZERO_ADDRESS } from "./constants";

/**
 * Tra ve chenh lech holderCount: +1 khi mot vi tu 0 thanh co so du,
 * -1 khi tu co so du ve 0, 0 con lai.
 * CoinTransfer mang SO DU SAU cua ca hai ben (E-042) nen gan thang.
 */
function upsertHolder(
  coinId: Bytes,
  owner: Address,
  balance: BigInt,
  timestamp: BigInt,
): i32 {
  let id = coinId.concat(owner);
  let existing = Holder.load(id);
  let delta: i32 = 0;

  let holder: Holder;
  if (existing == null) {
    holder = new Holder(id);
    holder.coin = coinId;
    holder.owner = owner;
    if (balance.gt(BigInt.zero())) {
      delta = 1;
    }
  } else {
    holder = existing;
    let hadBalance = holder.balance.gt(BigInt.zero());
    let hasBalance = balance.gt(BigInt.zero());
    if (!hadBalance && hasBalance) {
      delta = 1;
    } else if (hadBalance && !hasBalance) {
      delta = -1;
    }
  }

  holder.balance = balance;
  holder.updatedAt = timestamp;
  holder.save();
  return delta;
}

/**
 * CoinTransfer — 5 tham so, thu tu theo E-040, phat tu dia chi tung coin (E-054).
 * Coin la clone dong nen datasource nay sinh tu template (E-055); dia chi coin
 * chinh la event.address.
 */
export function handleCoinTransfer(event: CoinTransfer): void {
  let coinId = event.address;
  let coin = Coin.load(coinId);
  if (coin == null) {
    return;
  }

  let holderDelta: i32 = 0;

  if (event.params.sender.equals(ZERO_ADDRESS)) {
    coin.totalSupply = coin.totalSupply.plus(event.params.amount);
  } else {
    holderDelta += upsertHolder(
      coinId,
      event.params.sender,
      event.params.senderBalance,
      event.block.timestamp,
    );
  }

  if (event.params.recipient.equals(ZERO_ADDRESS)) {
    coin.totalSupply = coin.totalSupply.minus(event.params.amount);
  } else {
    holderDelta += upsertHolder(
      coinId,
      event.params.recipient,
      event.params.recipientBalance,
      event.block.timestamp,
    );
  }

  coin.holderCount = coin.holderCount + holderDelta;
  coin.save();
}
