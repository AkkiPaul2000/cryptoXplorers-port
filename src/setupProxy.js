const { createProxyMiddleware } = require("http-proxy-middleware");

// Only the RSS feeds need a proxy (no CORS headers); every other API is called directly.
module.exports = function setupProxy(app) {
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
