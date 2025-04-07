const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy all API requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://backend:8000',
      changeOrigin: true,
      secure: false,
      xfwd: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`Proxying request to: ${req.method} ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          error: 'Proxy error',
          message: err.message,
          code: err.code 
        }));
      },
    })
  );

  // Add a health check route
  app.use('/health', (req, res) => {
    res.send('OK');
  });
}; 