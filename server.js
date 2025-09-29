import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './services/databaseConnection.ts';
import importRoutes from './routes/importRoutes.ts';

const app = express();
const PORT = process.env.PORT || 3001;
console.log(process.env, "In server.js");
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Initialize database connection
initializeDatabase().catch(console.error);

// Routes
app.use('/api/import', importRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Import API server is running' });
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
});

export default app;
