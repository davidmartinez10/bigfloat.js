import JSBI from "jsbi";

export interface IBigFloat {
  coefficient: JSBI;
  exponent: number;
}

export type NumericValue = string|number|IBigFloat|JSBI;

export const BIGINT_ZERO        = JSBI.BigInt("0");
export const BIGINT_ONE         = JSBI.BigInt("1");
export const BIGINT_TEN         = JSBI.BigInt("10");
export const BIGINT_TEN_MILLION = JSBI.BigInt("10000000");

export const ZERO: IBigFloat = Object.create(null);
ZERO.coefficient             = BIGINT_ZERO;
ZERO.exponent                = 0;
Object.freeze(ZERO);

export const EPSILON
  = make("0.0000000000000000000000000000000000000000000000001");
export const ONE = make("1");
export const TWO = make("2");

export let PRECISION = -5;

export function set_precision(n: number): void {
  n = Number(n);
  if (! Number.isInteger(n) || Number(n) >= 0) {
    throw Error("Only negative integers are allowed for precision.");
  }
  PRECISION = n;
}

export function is_big_float(big: NumericValue): boolean {
  return (! (big instanceof JSBI) && typeof big === "object"
          && big.coefficient instanceof JSBI
          && Number.isSafeInteger(big.exponent));
}

export function is_number(token: string): boolean {
  return ! Number.isNaN(Number(token));
}

export function is_negative(big: IBigFloat): boolean {
  return JSBI.LT(big.coefficient, BIGINT_ZERO);
}

export function is_positive(big: IBigFloat): boolean {
  return JSBI.GT(big.coefficient, BIGINT_ZERO);
}

export function is_zero(big: IBigFloat): boolean {
  return JSBI.EQ(big.coefficient, BIGINT_ZERO);
}

export function is_integer(a: IBigFloat): boolean { return eq(a, integer(a)); }

export function eq(comparahend: IBigFloat, comparator: IBigFloat): boolean {
  return comparahend === comparator || is_zero(sub(comparahend, comparator));
}

export function lt(comparahend: IBigFloat, comparator: IBigFloat): boolean {
  return is_negative(sub(comparahend, comparator));
}

export function lte(comparahend: IBigFloat, comparator: IBigFloat): boolean {
  return lt(comparahend, comparator) || eq(comparahend, comparator);
}

export function gt(comparahend: IBigFloat, comparator: IBigFloat): boolean {
  return lt(comparator, comparahend);
}

export function gte(comparahend: IBigFloat, comparator: IBigFloat): boolean {
  return gt(comparahend, comparator) || eq(comparahend, comparator);
}

export function make_big_float(coefficient: JSBI, exponent: number): IBigFloat {
  if (JSBI.EQ(coefficient, BIGINT_ZERO)) { return ZERO; }
  const new_big_float: IBigFloat = Object.create(null);
  new_big_float.coefficient      = coefficient;
  new_big_float.exponent         = exponent;
  return Object.freeze(new_big_float);
}

export function number(a: NumericValue): number {
  if (typeof a !== "number" && typeof a !== "string") {
    if (a instanceof JSBI) {
      return JSBI.toNumber(a);
    } else if (is_big_float(a)) {
      return a.exponent === 0 ? JSBI.toNumber(a.coefficient)
                              : JSBI.toNumber(a.coefficient) * 10 ** a.exponent;
    }
  }
  return Number(a);
}

export function normalize(a: IBigFloat): IBigFloat {
  let { coefficient, exponent } = a;

  // If the exponent is zero, it is already normal.
  if (exponent !== 0) {
    if (exponent > 0) {
      coefficient
        = JSBI.multiply(coefficient,
                        JSBI.exponentiate(BIGINT_TEN, JSBI.BigInt(exponent)));
      exponent = 0;
    } else {
      let quotient;
      let remainder;

      while (exponent <= -7) {
        quotient  = JSBI.divide(coefficient, BIGINT_TEN_MILLION);
        remainder = JSBI.remainder(coefficient, BIGINT_TEN_MILLION);
        if (! JSBI.EQ(remainder, BIGINT_ZERO)) { break; }
        coefficient = quotient;
        exponent += 7;
      }
      while (exponent < 0) {
        quotient  = JSBI.divide(coefficient, BIGINT_TEN);
        remainder = JSBI.remainder(coefficient, BIGINT_TEN);
        if (! JSBI.EQ(remainder, BIGINT_ZERO)) { break; }
        coefficient = quotient;
        exponent += 1;
      }
    }
  }
  return make_big_float(coefficient, exponent);
}

export function integer(a: IBigFloat): IBigFloat {
  // The integer function is like the normalize function except that it throws
  // away significance. It discards the digits after the decimal point.

  const { coefficient, exponent } = a;

  // If the exponent is zero, it is already an integer.

  if (exponent === 0) { return a; }

  // If the exponent is positive,
  // multiply the coefficient by 10 ** exponent.

  if (exponent > 0) {
    return make_big_float(
      JSBI.multiply(coefficient,
                    JSBI.exponentiate(BIGINT_TEN, JSBI.BigInt(exponent))),
      0);
  }

  // If the exponent is negative, divide the coefficient by 10 ** -exponent.
  // This truncates the unnecessary bits. This might be a zero result.

  return make_big_float(JSBI.divide(coefficient,
                                    JSBI.exponentiate(BIGINT_TEN,
                                                      JSBI.BigInt(-exponent))),
                        0);
}

export function fraction(a: IBigFloat): IBigFloat { return sub(a, integer(a)); }

export function make(a: NumericValue, b?: number|string): IBigFloat {
  const number_pattern = /^(-?\d+)(?:\.(\d*))?(?:(e|E)(-?\d+))?$/;

  // . Capturing groups
  // .      [1] int
  // .      [2] frac
  // .      [3] e
  // .      [4] exp
  if (a instanceof JSBI) {
    return make_big_float(a, Number(b) || 0);
  } else if (typeof a === "string" || typeof a === "number") {
    a = String(a);
    if (Number.isSafeInteger(Number(b))) {
      return make(JSBI.BigInt(parseInt(a, Number(b))), 0);
    }
    const parts = a.match(number_pattern);
    if (parts) {
      const frac = parts[2] || "";
      return make(JSBI.BigInt(parts[1] + frac),
                  (Number(parts[4]) || 0) - frac.length);
    }
  } else if (is_big_float(a)) {
    return a;
  }
  return ZERO;
}

export function string(a: IBigFloat, radix?: IBigFloat): string|undefined {
  if (is_zero(a)) { return "0"; }
  if (radix && is_big_float(radix)) {
    radix = normalize(radix);
    return radix && radix.exponent === 0
             ? integer(a).coefficient.toString(JSBI.toNumber(radix.coefficient))
             : undefined;
  }
  a     = normalize(a);
  let s = (JSBI.LT(a.coefficient, BIGINT_ZERO) ? -a.coefficient : a.coefficient)
            .toString();
  if (a.exponent < 0) {
    let point = s.length + a.exponent;
    if (point <= 0) {
      s     = "0".repeat(1 - point) + s;
      point = 1;
    }
    s = s.slice(0, point) + "." + s.slice(point);
  } else if (a.exponent > 0) {
    s += "0".repeat(a.exponent);
  }
  if (JSBI.LT(a.coefficient, BIGINT_ZERO)) { s = "-" + s; }
  return s;
}

export function scientific(a: IBigFloat): string {
  if (is_zero(a)) { return "0"; }
  a       = normalize(a);
  let   s = String(JSBI.LT(a.coefficient, BIGINT_ZERO) ? -a.coefficient
                                                       : a.coefficient);
  const e = a.exponent + s.length - 1;
  if (s.length > 1) {
    const decimals = [...s.slice(1)];
    for (const d of decimals.toReversed()) {
      if (d !== "0") { break; }
      decimals.pop();
    }
    s = s.slice(0, 1);
    "." + decimals.join("");
  }

  if (e !== 0) { s += "e" + e; }
  if (JSBI.LT(a.coefficient, BIGINT_ZERO)) { s = "-" + s; }
  return s;
}

export function neg(a: IBigFloat): IBigFloat {
  return make_big_float(JSBI.unaryMinus(a.coefficient), a.exponent);
}

export function abs(a: IBigFloat): IBigFloat {
  return is_negative(a) ? neg(a) : a;
}

function conform_op(op: (a: JSBI, b: JSBI) => JSBI) {
  return function(a: IBigFloat, b: IBigFloat) {
    const differential = a.exponent - b.exponent;
    return differential === 0
             ? make_big_float(op(a.coefficient, b.coefficient), a.exponent)
           : differential > 0
             ? make_big_float(
                 op(JSBI.multiply(a.coefficient,
                                  JSBI.exponentiate(BIGINT_TEN,
                                                    JSBI.BigInt(differential))),
                    b.coefficient),
                 b.exponent)
             : make_big_float(op(a.coefficient,
                                 JSBI.multiply(b.coefficient,
                                               JSBI.exponentiate(
                                                 BIGINT_TEN,
                                                 JSBI.BigInt(-differential)))),
                              a.exponent);
  };
}

export const add = conform_op(JSBI.add);
export const sub = conform_op(JSBI.subtract);

export function mul(multiplicand: IBigFloat, multiplier: IBigFloat): IBigFloat {
  return make_big_float(JSBI.multiply(multiplicand.coefficient,
                                      multiplier.coefficient),
                        multiplicand.exponent + multiplier.exponent);
}

export function div(dividend: IBigFloat, divisor: IBigFloat,
                    precision = PRECISION): IBigFloat {
  if (is_zero(divisor)) { throw RangeError("Division by zero"); }
  if (is_zero(dividend)) { return ZERO; }

  let { coefficient, exponent } = dividend;
  exponent -= divisor.exponent;

  if (typeof precision !== "number") { precision = number(precision); }

  if (exponent > precision) {
    coefficient
      = JSBI.multiply(coefficient,
                      JSBI.exponentiate(BIGINT_TEN,
                                        JSBI.BigInt(exponent - precision)));
    exponent = precision;
  }

  coefficient = JSBI.divide(coefficient, divisor.coefficient);
  return make_big_float(coefficient, exponent);
}

export function sqrt(n: IBigFloat): IBigFloat {
  let x = n;
  let y = ONE;
  while (gt(sub(x, y), EPSILON)) {
    x = div(add(x, y), TWO);
    y = div(n, x);
  }
  return x;
}

export function exponentiation(base: IBigFloat, exp: IBigFloat): IBigFloat {
  if (eq(exp, ZERO)) { return ONE; }

  if (is_negative(exp)) { return div(ONE, exponentiation(base, abs(exp))); }

  if (exp.exponent === 0) {
    let result = base;
    let n      = 1;
    while (n !== number(exp)) {
      result = mul(result, base);
      n += 1;
    }
    return result;
  }
  if (gt(exp, ONE) || eq(exp, ONE)) {
    const temp = exponentiation(base, div(exp, TWO));
    return mul(temp, temp);
  }
  let low  = ZERO;
  let high = ONE;

  let sqr = sqrt(base);
  let acc = sqr;
  let mid = div(high, TWO);

  while (gt(abs(sub(mid, exp)), EPSILON)) {
    sqr = sqrt(sqr);

    if (lt(mid, exp) || eq(mid, exp)) {
      low = mid;
      acc = mul(acc, sqr);
    } else {
      high = mid;
      acc  = mul(acc, div(ONE, sqr));
    }
    mid = div(add(low, high), TWO);
  }
  return acc;
}

export function ceil(n: IBigFloat): IBigFloat {
  if (is_integer(n)) {
    return n;
  } else {
    return make_big_float(JSBI.add(integer(n).coefficient, BIGINT_ONE), 0);
  }
}

export function floor(n: IBigFloat): IBigFloat { return integer(n); }

export function modulo(a: IBigFloat, b: IBigFloat): IBigFloat {
  return make_big_float(JSBI.remainder(integer(a).coefficient,
                                       integer(b).coefficient),
                        0);
}
