import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ONE_BD, Q96, ZERO_BD } from "./constants";

/**
 * Doi sqrtPriceX96 (E-015) sang gia cua 1 coin tinh theo currency.
 *
 * (sqrtPriceX96 / 2^96)^2 = luong token1 tren mot token0, tinh theo don vi RAW.
 * Coin luon 18 decimals (E-400) nhung decimals cua currency thi mapping khong
 * biet (E-903), nen ket qua giu nguyen dang ti le raw; tang tren chia decimals.
 */
export function sqrtPriceX96ToCoinPrice(
  sqrtPriceX96: BigInt,
  coinIsToken0: boolean,
): BigDecimal {
  if (sqrtPriceX96.isZero()) {
    return ZERO_BD;
  }
  let sqrtRatio = sqrtPriceX96.toBigDecimal().div(Q96);
  let ratio = sqrtRatio.times(sqrtRatio);
  if (coinIsToken0) {
    return ratio;
  }
  if (ratio.equals(ZERO_BD)) {
    return ZERO_BD;
  }
  return ONE_BD.div(ratio);
}
