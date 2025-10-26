const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3052;

// Enable CORS for all routes
app.use(cors());

// Proxy all /api requests to the backend server on port 3051
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3051',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Backend server unavailable' });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Proxy server running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Proxying /api requests to http://localhost:3051`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});







