import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { assert, describe, test } from "matchstick-as";
import { sqrtPriceX96ToCoinPrice } from "../src/price";

// Bon test dau so sanh bang BigDecimal.equals nen khong phu thuoc cach
// graph-node in so thap phan ra chuoi. Test cuoi moi ghim dinh dang chuoi.
describe("sqrtPriceX96ToCoinPrice", () => {
  test("sqrtPriceX96 = 2^96 cho gia 1 o ca hai chieu", () => {
    let q96 = BigInt.fromI32(2).pow(96);
    let one = BigDecimal.fromString("1");
    assert.assertTrue(sqrtPriceX96ToCoinPrice(q96, true).equals(one));
    assert.assertTrue(sqrtPriceX96ToCoinPrice(q96, false).equals(one));
  });

  test("sqrtPriceX96 = 2^97 cho ti le 4 khi coin la token0", () => {
    let value = BigInt.fromI32(2).pow(97);
    assert.assertTrue(
      sqrtPriceX96ToCoinPrice(value, true).equals(BigDecimal.fromString("4")),
    );
  });

  test("sqrtPriceX96 = 2^97 cho gia 0.25 khi coin la token1", () => {
    let value = BigInt.fromI32(2).pow(97);
    assert.assertTrue(
      sqrtPriceX96ToCoinPrice(value, false).equals(
        BigDecimal.fromString("0.25"),
      ),
    );
  });

  test("sqrtPriceX96 = 0 cho gia 0, khong chia cho 0", () => {
    let zero = BigDecimal.zero();
    assert.assertTrue(
      sqrtPriceX96ToCoinPrice(BigInt.zero(), true).equals(zero),
    );
    assert.assertTrue(
      sqrtPriceX96ToCoinPrice(BigInt.zero(), false).equals(zero),
    );
  });

  // GHIM DINH DANG. Cach graph-node in BigDecimal ra chuoi chua xac minh duoc
  // tu repo (E-908). Test nay la diem duy nhat phu thuoc no. Neu no FAIL, chuoi
  // ma runner in ra CHINH LA dinh dang that: chep no vao day, roi chep sang moi
  // ky vong BigDecimal cua assert.fieldEquals trong swap.test.ts va candles.test.ts.
  test("ghim dinh dang chuoi cua BigDecimal", () => {
    let q96 = BigInt.fromI32(2).pow(96);
    assert.stringEquals(sqrtPriceX96ToCoinPrice(q96, true).toString(), "1");
    assert.stringEquals(
      sqrtPriceX96ToCoinPrice(BigInt.fromI32(2).pow(97), true).toString(),
      "4",
    );
    assert.stringEquals(
      sqrtPriceX96ToCoinPrice(BigInt.fromI32(2).pow(97), false).toString(),
      "0.25",
    );
  });
});
