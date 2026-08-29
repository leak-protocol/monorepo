import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Candle, Coin } from "../generated/schema";
import { ZERO_BI } from "./constants";

/** 5 phut, 1 gio, 1 ngay — spec §7. */
export const CANDLE_INTERVALS: i32[] = [300, 3600, 86400];
export const CANDLE_LABELS: string[] = ["5m", "1h", "1d"];

/** id cua Candle la String! (E-116) nen ghep tay tu hex cua coin. */
export function candleId(
  coin: Bytes,
  label: string,
  periodStart: BigInt,
): string {
  return coin.toHexString() + "-" + label + "-" + periodStart.toString();
}

/**
 * Cap nhat ca ba khung cho mot swap. Gia truyen vao la gia sau swap (E-015),
 * nen `close` luon la gia cua swap cuoi trong khung.
 */
export function updateCandles(
  coin: Coin,
  price: BigDecimal,
  volumeCurrency: BigInt,
  timestamp: BigInt,
): void {
  for (let i = 0; i < CANDLE_INTERVALS.length; i++) {
    let length = BigInt.fromI32(CANDLE_INTERVALS[i]);
    let periodStart = timestamp.div(length).times(length);
    let id = candleId(coin.id, CANDLE_LABELS[i], periodStart);

    let existing = Candle.load(id);
    let candle: Candle;
    if (existing == null) {
      candle = new Candle(id);
      candle.coin = coin.id;
      candle.interval = CANDLE_LABELS[i];
      candle.periodStart = periodStart;
      candle.open = price;
      candle.high = price;
      candle.low = price;
      candle.volumeCurrency = ZERO_BI;
      candle.swapCount = 0;
    } else {
      candle = existing;
      if (price.gt(candle.high)) {
        candle.high = price;
      }
      if (price.lt(candle.low)) {
        candle.low = price;
      }
    }

    candle.close = price;
    candle.volumeCurrency = candle.volumeCurrency.plus(volumeCurrency);
    candle.swapCount = candle.swapCount + 1;
    candle.save();
  }
}
