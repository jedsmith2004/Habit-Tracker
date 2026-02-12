import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Add it to your .env file.');
}

const sql = neon(process.env.DATABASE_URL);

export default sql;

/**
 * Initialize the database schema. Run this once on server startup.
 */
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,               -- Firebase UID
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'Health',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS habit_entries (
      id SERIAL PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      status TEXT NOT NULL,              -- 'COMPLETED' | 'FAILED' | 'SKIPPED'
      UNIQUE(habit_id, date)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Custom',
      target NUMERIC NOT NULL,
      current NUMERIC NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'units',
      deadline DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goal_entries (
      id SERIAL PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      amount NUMERIC NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,                -- 'habit' | 'goal' | 'system' | 'friend' | 'event'
      description TEXT NOT NULL,
      reversible BOOLEAN NOT NULL DEFAULT FALSE,
      reversed BOOLEAN NOT NULL DEFAULT FALSE,
      related_id TEXT,                   -- optional FK to habit/goal/friend id
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS friends (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'accepted', -- 'pending' | 'accepted'
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, friend_id)
    );
  `;

  console.log('✅ Database schema initialized');

  // --- Migrations for existing tables ---
  // Add new columns if they don't already exist (safe to re-run)
  try {
    await sql`ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS reversible BOOLEAN NOT NULL DEFAULT FALSE`;
    await sql`ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS reversed BOOLEAN NOT NULL DEFAULT FALSE`;
    await sql`ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS related_id TEXT`;
    await sql`ALTER TABLE friends ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'`;
    console.log('✅ Database migrations applied');
  } catch (err) {
    // Columns likely already exist, safe to ignore
    console.log('ℹ️ Migration columns already exist or migration skipped');
  }
}
