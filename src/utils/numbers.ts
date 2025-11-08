import Decimal from 'decimal.js';

// Configure Decimal.js with high precision settings for idle game numbers
Decimal.set({
  precision: 100,
  rounding: Decimal.ROUND_DOWN,
  toExpNeg: -9e15,
  toExpPos: 9e15,
  maxE: 9e15,
  minE: -9e15,
});

/**
 * Creates a Decimal instance from a number, string, or existing Decimal.
 * This is a convenience wrapper to make working with Decimal.js more ergonomic.
 *
 * @param value - The value to convert to a Decimal
 * @returns A new Decimal instance
 *
 * @example
 * const num = D(100);
 * const big = D("1e100");
 * const copy = D(someDecimal);
 */
export function D(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

/**
 * Formats a number for display using suffixes for large numbers.
 *
 * - Numbers < 1000: Shows 2 decimal places (e.g., "123.45")
 * - Large numbers: Uses suffixes K, M, B, T, Qa, Qi, etc.
 * - Extremely large numbers: Falls back to scientific notation
 *
 * @param value - The number to format (Decimal, number, or string)
 * @returns Formatted string representation
 *
 * @example
 * formatNumber(123.456) // "123.46"
 * formatNumber(1234567) // "1.23M"
 * formatNumber("1e50") // "1.00e50"
 */
export function formatNumber(value: Decimal.Value): string {
  const decimal = D(value);

  // Handle negative numbers
  if (decimal.isNegative()) {
    return '-' + formatNumber(decimal.abs());
  }

  // Handle zero and very small numbers
  if (decimal.isZero()) {
    return '0';
  }

  if (decimal.lessThan(0.01)) {
    return decimal.toFixed(2);
  }

  // Numbers less than 1000: show 2 decimal places
  if (decimal.lessThan(1000)) {
    return decimal.toDecimalPlaces(2).toString();
  }

  // Suffix notation for large numbers
  const suffixes = [
    { value: D(1e3), symbol: 'K' },      // Thousand
    { value: D(1e6), symbol: 'M' },      // Million
    { value: D(1e9), symbol: 'B' },      // Billion
    { value: D(1e12), symbol: 'T' },     // Trillion
    { value: D(1e15), symbol: 'Qa' },    // Quadrillion
    { value: D(1e18), symbol: 'Qi' },    // Quintillion
    { value: D(1e21), symbol: 'Sx' },    // Sextillion
    { value: D(1e24), symbol: 'Sp' },    // Septillion
    { value: D(1e27), symbol: 'Oc' },    // Octillion
    { value: D(1e30), symbol: 'No' },    // Nonillion
    { value: D(1e33), symbol: 'Dc' },    // Decillion
    { value: D(1e36), symbol: 'UDc' },   // Undecillion
    { value: D(1e39), symbol: 'DDc' },   // Duodecillion
    { value: D(1e42), symbol: 'TDc' },   // Tredecillion
    { value: D(1e45), symbol: 'QaDc' },  // Quattuordecillion
    { value: D(1e48), symbol: 'QiDc' },  // Quindecillion
  ];

  // Find the appropriate suffix
  for (let i = suffixes.length - 1; i >= 0; i--) {
    const { value: divisor, symbol } = suffixes[i];
    if (decimal.greaterThanOrEqualTo(divisor)) {
      const result = decimal.dividedBy(divisor);
      return result.toDecimalPlaces(2).toString() + symbol;
    }
  }

  // Fallback to scientific notation for extremely large numbers
  return decimal.toExponential(2);
}

/**
 * Adds two Decimal values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Sum of a and b
 *
 * @example
 * add(100, 50) // Returns Decimal(150)
 * add("1e100", "2e100") // Returns Decimal("3e100")
 */
export function add(a: Decimal.Value, b: Decimal.Value): Decimal {
  return D(a).plus(b);
}

/**
 * Subtracts the second value from the first.
 *
 * @param a - Value to subtract from
 * @param b - Value to subtract
 * @returns Difference of a and b
 *
 * @example
 * subtract(100, 50) // Returns Decimal(50)
 */
export function subtract(a: Decimal.Value, b: Decimal.Value): Decimal {
  return D(a).minus(b);
}

/**
 * Multiplies two Decimal values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns Product of a and b
 *
 * @example
 * multiply(10, 5) // Returns Decimal(50)
 */
export function multiply(a: Decimal.Value, b: Decimal.Value): Decimal {
  return D(a).times(b);
}

/**
 * Divides the first value by the second.
 *
 * @param a - Dividend
 * @param b - Divisor
 * @returns Quotient of a and b
 *
 * @example
 * divide(100, 4) // Returns Decimal(25)
 */
export function divide(a: Decimal.Value, b: Decimal.Value): Decimal {
  return D(a).dividedBy(b);
}

/**
 * Checks if the first value is less than the second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if a < b
 *
 * @example
 * lessThan(10, 20) // Returns true
 * lessThan(20, 10) // Returns false
 */
export function lessThan(a: Decimal.Value, b: Decimal.Value): boolean {
  return D(a).lessThan(b);
}

/**
 * Checks if the first value is greater than the second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if a > b
 *
 * @example
 * greaterThan(20, 10) // Returns true
 * greaterThan(10, 20) // Returns false
 */
export function greaterThan(a: Decimal.Value, b: Decimal.Value): boolean {
  return D(a).greaterThan(b);
}

/**
 * Checks if two values are equal.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if a === b
 *
 * @example
 * equals(10, 10) // Returns true
 * equals(10, 20) // Returns false
 */
export function equals(a: Decimal.Value, b: Decimal.Value): boolean {
  return D(a).equals(b);
}

/**
 * Returns the maximum of two Decimal values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns The larger of a and b
 *
 * @example
 * max(10, 20) // Returns Decimal(20)
 */
export function max(a: Decimal.Value, b: Decimal.Value): Decimal {
  return Decimal.max(a, b);
}

/**
 * Returns the minimum of two Decimal values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns The smaller of a and b
 *
 * @example
 * min(10, 20) // Returns Decimal(10)
 */
export function min(a: Decimal.Value, b: Decimal.Value): Decimal {
  return Decimal.min(a, b);
}

/**
 * Checks if the first value is less than or equal to the second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if a <= b
 *
 * @example
 * lessThanOrEqualTo(10, 20) // Returns true
 * lessThanOrEqualTo(20, 20) // Returns true
 * lessThanOrEqualTo(30, 20) // Returns false
 */
export function lessThanOrEqualTo(a: Decimal.Value, b: Decimal.Value): boolean {
  return D(a).lessThanOrEqualTo(b);
}

/**
 * Checks if the first value is greater than or equal to the second.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if a >= b
 *
 * @example
 * greaterThanOrEqualTo(20, 10) // Returns true
 * greaterThanOrEqualTo(20, 20) // Returns true
 * greaterThanOrEqualTo(10, 20) // Returns false
 */
export function greaterThanOrEqualTo(a: Decimal.Value, b: Decimal.Value): boolean {
  return D(a).greaterThanOrEqualTo(b);
}

/**
 * Clamps a value between a minimum and maximum.
 *
 * @param value - Value to clamp
 * @param minValue - Minimum allowed value
 * @param maxValue - Maximum allowed value
 * @returns Clamped value
 *
 * @example
 * clamp(5, 0, 10) // Returns Decimal(5)
 * clamp(-5, 0, 10) // Returns Decimal(0)
 * clamp(15, 0, 10) // Returns Decimal(10)
 */
export function clamp(
  value: Decimal.Value,
  minValue: Decimal.Value,
  maxValue: Decimal.Value
): Decimal {
  return max(minValue, min(value, maxValue));
}
