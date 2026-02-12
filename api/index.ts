import express from 'express';
import cors from 'cors';

import { initDB } from '../server/db';
import userRoutes from '../server/routes/users';
import habitRoutes from '../server/routes/habits';
import goalRoutes from '../server/routes/goals';
import logRoutes from '../server/routes/logs';
import friendRoutes from '../server/routes/friends';
import eventRoutes from '../server/routes/events';

const app = express();

// Allow requests from any origin in production (Vercel handles domain routing)
app.use(cors());
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

// Initialize DB on first cold start
let dbInitialized = false;
const originalHandler = app;

const handler = async (req: any, res: any) => {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
  return originalHandler(req, res);
};

export default handler;
