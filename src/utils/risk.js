const BANDS = [
  { max: 20, label: "Low", tone: "calm" },
  { max: 35, label: "Moderately Low", tone: "steady" },
  { max: 50, label: "Moderate", tone: "watch" },
  { max: 65, label: "Moderately High", tone: "hot" },
  { max: 80, label: "High", tone: "risk" },
  { max: 100, label: "Very High", tone: "extreme" },
];

export function riskBand(score) {
  return BANDS.find((band) => score <= band.max) || BANDS[BANDS.length - 1];
}

export function listRiskScore(coin) {
  const swing = Math.abs(coin?.price_change_percentage_24h || 0);
  const week = Math.abs(coin?.price_change_percentage_7d_in_currency || 0);
  const rank = coin?.market_cap_rank || 100;
  const size = rank <= 10 ? 8 : rank <= 25 ? 18 : rank <= 50 ? 30 : 46;
  return Math.max(4, Math.min(98, Math.round(swing * 2.4 + week * 0.45 + size)));
}

export function coinRiskScore(coin) {
  const price = coin?.current_price || 0;
  const low = coin?.low_24h;
  const high = coin?.high_24h;
  const day = Math.abs(coin?.price_change_percentage_24h || 0);
  const week = Math.abs(coin?.price_change_percentage_7d_in_currency || 0);
  const month = Math.abs(coin?.price_change_percentage_30d || 0);
  const range = price && low && high ? ((high - low) / price) * 100 : day;
  const betaBoost = Math.min(20, Math.abs((coin?.beta || 1) - 1) * 25);
  const rank = coin?.market_cap_rank || 100;
  const size = rank <= 10 ? 6 : rank <= 25 ? 16 : rank <= 50 ? 28 : 42;
  return Math.max(
    4,
    Math.min(
      98,
      Math.round(range * 1.6 + day * 0.7 + week * 0.35 + month * 0.12 + betaBoost + size)
    )
  );
}
