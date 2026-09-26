export function placeholderCoinIcon(symbol = "?") {
  const label = String(symbol || "?").slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="#14161a"/>
    <rect x="3" y="3" width="122" height="122" rx="25" fill="none" stroke="#EEBC1D" stroke-width="3"/>
    <text x="64" y="76" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-size="30" font-weight="800" fill="#EEBC1D">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function coinLogoSources(symbol) {
  const code = String(symbol || "").toLowerCase();
  if (!code) return [placeholderCoinIcon("?")];

  return [
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${code}.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${code}.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/generic.png`,
    placeholderCoinIcon(symbol),
  ];
}

export function coinLogo(symbol) {
  return coinLogoSources(symbol)[0];
}

export function mapTicker(ticker, currency = "USD") {
  const quote = ticker?.quotes?.[currency] || ticker?.quotes?.USD || {};
  return {
    id: ticker.id,
    name: ticker.name,
    symbol: ticker.symbol,
    image: coinLogo(ticker.symbol),
    market_cap_rank: ticker.rank,
    current_price: quote.price,
    market_cap: quote.market_cap,
    total_volume: quote.volume_24h,
    price_change_percentage_24h: quote.percent_change_24h,
    price_change_percentage_7d_in_currency: quote.percent_change_7d,
    price_change_percentage_30d: quote.percent_change_30d,
    price_change_percentage_1y: quote.percent_change_1y,
    ath_price: quote.ath_price,
    ath_change: quote.percent_from_price_ath,
    beta: ticker.beta_value,
    circulating_supply: ticker.total_supply,
    max_supply: ticker.max_supply,
  };
}

export function walkBook(levels, mid, direction) {
  if (!mid || !levels?.length) return null;
  const target = direction === "up" ? mid * 1.02 : mid * 0.98;
  let cost = 0;
  for (const level of levels) {
    const price = Number(level[0]);
    const qty = Number(level[1]);
    const pastTarget = direction === "up" ? price > target : price < target;
    if (pastTarget) break;
    cost += price * qty;
  }
  return cost;
}
