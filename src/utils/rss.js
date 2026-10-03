// Decodes entities and drops tags; text/html parsing never runs scripts.
function htmlToText(html) {
  if (!html) return "";
  return new DOMParser().parseFromString(html, "text/html").body.textContent.replace(/\s+/g, " ").trim();
}

const first = (item, tag) => item.getElementsByTagName(tag)[0]?.textContent?.trim() || "";

function imageOf(item, description) {
  const media = item.getElementsByTagName("media:content")[0] || item.getElementsByTagName("enclosure")[0];
  return media?.getAttribute("url") || description.match(/<img[^>]+src="([^"]+)"/)?.[1] || "";
}

export function parseRss(xmlText, source = "") {
  if (!xmlText) return [];
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  return Array.from(doc.getElementsByTagName("item")).map((item) => {
    const description = first(item, "description");
    return {
      title: htmlToText(first(item, "title")),
      link: first(item, "link"),
      date: first(item, "pubDate"),
      summary: htmlToText(description),
      image: imageOf(item, description),
      author: first(item, "dc:creator").replace(/^Cointelegraph by /, ""),
      categories: Array.from(item.getElementsByTagName("category"), (node) => node.textContent.trim()).filter(Boolean),
      source,
    };
  });
}

export const TOPICS = [
  { key: "etf", label: "ETF", match: /\betfs?\b/i },
  { key: "regulation", label: "Regulation", match: /\b(sec|cftc|regulat\w*|laws?|bill|act|courts?|lawsuits?|sues?|sued|bans?|senate|congress|polic(y|ies)|licen[cs]\w*)\b/i },
  { key: "security", label: "Security", match: /\b(hack\w*|exploit\w*|breach\w*|stolen|scam\w*|phishing|drain\w*|attack\w*|vulnerab\w*)\b/i },
  { key: "macro", label: "Macro", match: /\b(fed|fomc|rate cuts?|interest rates?|inflation|cpi|jobs report|tariffs?|treasur(y|ies)|recession|dollar|gdp|powell)\b/i },
  { key: "institutions", label: "Institutions", match: /\b(blackrock|fidelity|grayscale|microstrategy|saylor|banks?|institution\w*|treasury firms?|asset managers?)\b/i },
  { key: "defi", label: "DeFi", match: /\b(defi|dex|lending|staking|yield|liquidity pools?)\b/i },
  { key: "stablecoins", label: "Stablecoins", match: /\b(stablecoins?|usdt|usdc|tether|circle)\b/i },
  { key: "tech", label: "Tech", match: /\b(upgrade\w*|forks?|mainnet|testnet|layer[- ]?2|rollups?|developers?)\b/i },
  { key: "mining", label: "Mining", match: /\b(miners?|mining|hash ?rate|halving)\b/i },
  { key: "ai", label: "AI", match: /\b(ai|artificial intelligence|agents?)\b/i },
];

const BULLISH = /\b(surg\w*|soar\w*|rall(y|ies|ied)|jump\w*|gains?|gained|record|all-time high|approv\w*|inflows?|adopt\w*|partner\w*|bull\w*|breakout|rebound\w*|recover\w*|climb\w*|rises?|rising|rose|boost\w*|outperform\w*|accumulat\w*|upgrade\w*)\b/gi;
const BEARISH = /\b(plung\w*|crash\w*|drops?|dropped|fall\w*|fell|slump\w*|tumbl\w*|sink\w*|sank|hack\w*|exploit\w*|lawsuits?|sues?|sued|bans?|banned|outflows?|liquidat\w*|bear\w*|sell-?offs?|fraud|scam\w*|probe\w*|fines?|fined|delist\w*|declin\w*|loss(es)?|warn\w*|fears?|slid\w*|dump\w*|underperform\w*|stolen|halt\w*|trapped)\b/gi;
const AHEAD = /\b(will|plans?|planned|upcoming|next (week|month|year|quarter)|set to|expected|expects?|deadline|votes?|decision|scheduled|could|forecast\w*|predict\w*|outlook|ahead|eyes|targets?|by (q[1-4]|20\d\d))\b/i;

// Keyword heuristics: good enough to sort and filter headlines, not a sentiment model.
export function tagHeadline(item) {
  const text = `${item.title} ${item.summary}`;
  const bull = (text.match(BULLISH) || []).length;
  const bear = (text.match(BEARISH) || []).length;
  return {
    ...item,
    topics: TOPICS.filter((topic) => topic.match.test(text)).map((topic) => topic.key),
    tone: bull > bear ? "bullish" : bear > bull ? "bearish" : "neutral",
    upcoming: AHEAD.test(item.title),
  };
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const GENERIC_NAMES = new Set(["just", "sky", "story", "gate", "sonic", "stable", "pump", "official", "plasma", "aster"]);

// Coin ids whose name (any case) or ticker (exact upper case) appears in the headline.
export function coinMatchers(coins) {
  return coins.map((coin) => ({
    id: coin.id,
    name: coin.name.length >= 4 && !GENERIC_NAMES.has(coin.name.toLowerCase()) ? new RegExp(`\\b${escape(coin.name)}\\b`, "i") : null,
    symbol: coin.symbol.length >= 3 ? new RegExp(`\\b${escape(coin.symbol.toUpperCase())}\\b`) : null,
  }));
}

export function mentionedCoins(item, matchers) {
  const text = `${item.title} ${item.summary}`;
  return matchers.filter((m) => m.name?.test(text) || m.symbol?.test(text)).map((m) => m.id);
}

export function filterNews(items, coin) {
  const terms = [coin.symbol, coin.name].filter(Boolean).map((term) => term.toLowerCase());
  return items.filter((item) => {
    const hay = `${item.title} ${item.summary}`.toLowerCase();
    return terms.some((term) => term.length > 2 && hay.includes(term));
  });
}
