import { Router } from 'express';
import sql from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/users/sync
 * Called after Firebase login to ensure the user exists in our DB.
 */
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { uid, email } = req;
    const { name, avatarUrl } = req.body;

    await sql`
      INSERT INTO users (id, email, name, avatar_url)
      VALUES (${uid!}, ${email!}, ${name || 'User'}, ${avatarUrl || null})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
    `;

    const [user] = await sql`SELECT * FROM users WHERE id = ${uid!}`;
    res.json(user);
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

/**
 * GET /api/users/me
 */
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await sql`SELECT * FROM users WHERE id = ${req.uid!}`;
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/users/me
 */
router.patch('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const [user] = await sql`
      UPDATE users 
      SET name = COALESCE(${name}, name),
          avatar_url = COALESCE(${avatarUrl}, avatar_url)
      WHERE id = ${req.uid!}
      RETURNING *
    `;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/me
 * Deletes the current user and cascades related records.
 */
router.delete('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.uid!}`;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
