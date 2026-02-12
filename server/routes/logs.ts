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
      reversible: l.reversible ?? false,
      reversed: l.reversed ?? false,
      relatedId: l.related_id || undefined,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * PUT /api/logs/:logId/reverse — reverse (undo) a log entry.
 */
router.put('/:logId/reverse', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    const [log] = await sql`
      SELECT * FROM activity_logs WHERE id = ${logId} AND user_id = ${req.uid!}
    `;
    if (!log) return res.status(404).json({ error: 'Log not found' });
    if (!log.reversible) return res.status(400).json({ error: 'Log is not reversible' });
    if (log.reversed) return res.status(400).json({ error: 'Log already reversed' });

    await sql`UPDATE activity_logs SET reversed = TRUE WHERE id = ${logId}`;

    // If it's a goal log with related_id, subtract the amount
    if (log.type === 'goal' && log.related_id) {
      const match = log.description.match(/Added ([\d.]+)/);
      if (match) {
        const amount = parseFloat(match[1]);
        await sql`UPDATE goals SET current = GREATEST(0, current - ${amount}) WHERE id = ${log.related_id}`;
      }
    }

    // If it's a habit log with related_id, remove the habit entry for that date
    if (log.type === 'habit' && log.related_id) {
      const dateMatch = log.description.match(/for (\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        await sql`DELETE FROM habit_entries WHERE habit_id = ${log.related_id} AND date = ${dateMatch[1]}`;
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Reverse log error:', err);
    res.status(500).json({ error: 'Failed to reverse log' });
  }
});

/**
 * PUT /api/logs/:logId — edit a log entry (e.g. edit goal amount).
 */
router.put('/:logId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { logId } = req.params;
    const { description, newAmount } = req.body;

    const [log] = await sql`
      SELECT * FROM activity_logs WHERE id = ${logId} AND user_id = ${req.uid!}
    `;
    if (!log) return res.status(404).json({ error: 'Log not found' });

    // If editing a goal log amount, adjust the goal value
    if (log.type === 'goal' && log.related_id && newAmount !== undefined) {
      const oldMatch = log.description.match(/Added ([\d.]+)/);
      if (oldMatch) {
        const oldAmount = parseFloat(oldMatch[1]);
        const diff = newAmount - oldAmount;
        await sql`UPDATE goals SET current = GREATEST(0, current + ${diff}) WHERE id = ${log.related_id}`;
      }
    }

    await sql`UPDATE activity_logs SET description = ${description} WHERE id = ${logId}`;
    res.json({ success: true });
  } catch (err) {
    console.error('Edit log error:', err);
    res.status(500).json({ error: 'Failed to edit log' });
  }
});

export default router;
