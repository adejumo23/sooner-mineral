import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3051;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Import API server is running',
    timestamp: new Date().toISOString()
  });
});

// Mock import endpoints for testing
app.post('/api/import/upload', (req, res) => {
  res.json({
    success: true,
    message: 'File upload endpoint ready (mock implementation)',
    note: 'Full implementation requires database connection setup'
  });
});

app.get('/api/import/staging-tables', (req, res) => {
  res.json({
    success: true,
    stagingTables: [],
    message: 'Staging tables endpoint ready (mock implementation)'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Import API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
