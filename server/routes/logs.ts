import { Router } from 'express';
import sql from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/logs — fetch activity logs for the current user.
 * Query: ?limit=50
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await sql`
      SELECT * FROM activity_logs
      WHERE user_id = ${req.uid!}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const formatted = logs.map(l => ({
      id: l.id.toString(),
      type: l.type,
      description: l.description,
      timestamp: l.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
