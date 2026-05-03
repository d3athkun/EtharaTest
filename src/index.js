require('dotenv').config();
const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const app = express();

// Run DB migrations on startup (safe to run multiple times)
if (process.env.NODE_ENV === 'production') {
  try {
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration warning (may already be applied):', err.message);
  }
}

// Middleware
const clientOrigin = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : '*';
app.use(cors({
  origin: clientOrigin === '*' ? true : clientOrigin,
  credentials: true,
}));
app.use(express.json());

// Health check — responds immediately, even before DB is ready
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
