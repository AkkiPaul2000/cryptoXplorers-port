import { formatMarketCap, formatPercent, formatPrice, safeUrl, timeAgo } from "./formatters";

test("formats prices, caps, percents and relative times", () => {
  expect(formatPrice(84174.3217, "$")).toBe("$84,174.32");
  expect(formatPrice(0.5)).toBe("0.50");
  expect(formatPrice(0.04512)).toBe("0.0451");
  expect(formatPrice(0.004512)).toBe("0.004512");
  expect(formatPrice(0.00001234)).toBe("0.00001234");
  expect(formatPrice(null)).toBe("—");
  expect(formatMarketCap(1.6912e12, "$")).toBe("$1.69T");
  expect(formatMarketCap(3.0e12, "$")).toBe("$3.00T");
  expect(formatMarketCap(0)).toBe("—");
  expect(formatPercent(1.234)).toBe("+1.23%");
  expect(formatPercent(-0.5)).toBe("-0.50%");
  const now = Date.UTC(2026, 0, 10);
  expect(timeAgo(now - 3 * 3600e3, now)).toBe("3 hr. ago");
  expect(timeAgo(now + 2 * 86400e3, now)).toBe("in 2 days");
  // eslint-disable-next-line no-script-url
  expect(safeUrl("javascript:alert(1)")).toBeNull();
  expect(safeUrl("https://bitcoin.org/x").hostname).toBe("bitcoin.org");
});
