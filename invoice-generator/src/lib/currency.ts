/**
 * Currency utilities for formatting and conversion
 */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: "AUD", name: "Australian Dollar", symbol: "$", flag: "🇦🇺" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$", flag: "🇳🇿" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$", flag: "🇸🇬" },
  { code: "CAD", name: "Canadian Dollar", symbol: "$", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "$", flag: "🇭🇰" },
];

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "AUD"
): string {
  const currency = currencies.find((c) => c.code === currencyCode);
  const symbol = currency?.symbol || "$";

  // Format with 2 decimal places and thousand separators
  const formatted = Number(amount).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Special handling for currencies
  if (currencyCode === "JPY" || currencyCode === "KRW") {
    // Japanese Yen and Korean Won don't use decimal places
    return `${symbol}${Math.round(amount).toLocaleString("en-AU")}`;
  }

  return `${symbol}${formatted}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = currencies.find((c) => c.code === currencyCode);
  return currency?.symbol || "$";
}

/**
 * Get currency info
 */
export function getCurrency(currencyCode: string): Currency | undefined {
  return currencies.find((c) => c.code === currencyCode);
}

/**
 * Convert amount between currencies using exchange rate
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return amount;
  return amount * exchangeRate;
}

/**
 * Format exchange rate display
 */
export function formatExchangeRate(
  rate: number,
  fromCurrency: string,
  toCurrency: string
): string {
  return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
}
