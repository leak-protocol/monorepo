import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

/** BaseCoin ke thua ERC20Upgradeable, decimals() tra 18 (E-400). */
export const COIN_DECIMALS: i32 = 18;

/**
 * 2^96 — mau so khi doi sqrtPriceX96 sang ti le gia.
 * Chia TRUOC roi binh phuong, khong binh phuong roi chia cho 2^192:
 * BigDecimal.div cua graph-node cat con 34 chu so co nghia, nen
 * 2^194 / 2^192 ra 4.000000000000000000000000000000001 con
 * (2^97 / 2^96)^2 ra dung 4. Xem muc "Lech so voi plan".
 */
export const Q96: BigDecimal = BigInt.fromI32(2).pow(96).toBigDecimal();

export const ZERO_BI: BigInt = BigInt.zero();
export const ZERO_BD: BigDecimal = BigDecimal.zero();
export const ONE_BD: BigDecimal = BigDecimal.fromString("1");
export const ZERO_ADDRESS: Address = Address.zero();
