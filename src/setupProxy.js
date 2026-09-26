const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  app.use(
    "/paprika",
    createProxyMiddleware({
      target: "https://api.coinpaprika.com",
      changeOrigin: true,
      pathRewrite: { "^/paprika": "" },
    })
  );

  app.use(
    "/binance",
    createProxyMiddleware({
      target: "https://api.binance.com",
      changeOrigin: true,
      pathRewrite: { "^/binance": "" },
    })
  );

  app.use(
    "/sentiment",
    createProxyMiddleware({
      target: "https://api.alternative.me",
      changeOrigin: true,
      pathRewrite: { "^/sentiment": "" },
    })
  );

  app.use(
    "/btc",
    createProxyMiddleware({
      target: "https://api.blockchain.info",
      changeOrigin: true,
      pathRewrite: { "^/btc": "" },
    })
  );

  app.use(
    "/rss/cointelegraph",
    createProxyMiddleware({
      target: "https://cointelegraph.com",
      changeOrigin: true,
      pathRewrite: { "^/rss/cointelegraph": "/rss" },
    })
  );

  app.use(
    "/rss/coindesk",
    createProxyMiddleware({
      target: "https://www.coindesk.com",
      changeOrigin: true,
      pathRewrite: { "^/rss/coindesk": "/arc/outboundfeeds/rss" },
    })
  );
};
