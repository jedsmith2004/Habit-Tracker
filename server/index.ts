import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db';

import userRoutes from './routes/users';
import habitRoutes from './routes/habits';
import goalRoutes from './routes/goals';
import logRoutes from './routes/logs';
import friendRoutes from './routes/friends';
import eventRoutes from './routes/events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 HabitFlow API running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
