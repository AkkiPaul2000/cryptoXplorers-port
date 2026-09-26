export function parseRss(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(doc.querySelectorAll("item"));
  return items.map((item) => ({
    title: item.querySelector("title")?.textContent?.trim() || "",
    link: item.querySelector("link")?.textContent?.trim() || "",
    date: item.querySelector("pubDate")?.textContent?.trim() || "",
    summary:
      item.querySelector("description")?.textContent?.replace(/<[^>]*>/g, " ").trim() ||
      "",
    source: "rss",
  }));
}

export function filterNews(items, coin) {
  const terms = [coin.symbol, coin.name]
    .filter(Boolean)
    .map((term) => term.toLowerCase());
  return items.filter((item) => {
    const hay = `${item.title} ${item.summary}`.toLowerCase();
    return terms.some((term) => term.length > 2 && hay.includes(term));
  });
}
