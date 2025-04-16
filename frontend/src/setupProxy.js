const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function(app) {
  app.use("/api", createProxyMiddleware({ target: process.env.REACT_APP_API_URL || "http://localhost:8000", changeOrigin: true }));
  app.use("/health", (req, res) => { res.send("OK"); });
  app.use("*", (req, res, next) => { next(); });
};
