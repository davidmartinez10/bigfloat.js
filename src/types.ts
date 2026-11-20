import JSBI from "jsbi";

export interface IBigFloat {
  coefficient: JSBI;
  exponent: number;
}

export type NumericValue = string|number|IBigFloat|JSBI;
