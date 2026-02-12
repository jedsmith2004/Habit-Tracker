import { Router } from 'express';
import sql from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/goals
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const goals = await sql`
      SELECT * FROM goals WHERE user_id = ${req.uid!} ORDER BY created_at
    `;

    const goalIds = goals.map(g => g.id);
    const entries = goalIds.length
      ? await sql`SELECT * FROM goal_entries WHERE goal_id = ANY(${goalIds}) ORDER BY date`
      : [];

    const goalsWithHistory = goals.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category,
      target: Number(g.target),
      current: Number(g.current),
      unit: g.unit,
      deadline: g.deadline,
      history: entries
        .filter(e => e.goal_id === g.id)
        .map(e => ({ date: e.date.toISOString().split('T')[0], amount: Number(e.amount) })),
    }));

    res.json(goalsWithHistory);
  } catch (err) {
    console.error('Fetch goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

/**
 * POST /api/goals
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, title, category, target, unit, deadline } = req.body;
    const [goal] = await sql`
      INSERT INTO goals (id, user_id, title, category, target, current, unit, deadline)
      VALUES (${id}, ${req.uid!}, ${title}, ${category || 'Custom'}, ${target}, 0, ${unit || 'units'}, ${deadline || null})
      RETURNING *
    `;
    res.status(201).json({ ...goal, target: Number(goal.target), current: 0, history: [] });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

/**
 * DELETE /api/goals/:id
 */
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await sql`DELETE FROM goals WHERE id = ${req.params.id} AND user_id = ${req.uid!}`;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

/**
 * POST /api/goals/:id/add — add progress to a goal.
 * Body: { amount: number }
 */
router.post('/:id/add', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    const goalId = req.params.id;

    // Update current total
    const [goal] = await sql`
      UPDATE goals SET current = current + ${amount}
      WHERE id = ${goalId} AND user_id = ${req.uid!}
      RETURNING *
    `;

    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    // Record the entry
    await sql`
      INSERT INTO goal_entries (goal_id, amount) VALUES (${goalId}, ${amount})
    `;

    // Log it
    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'goal', ${`Added ${amount} ${goal.unit} to ${goal.title}`})
    `;

    res.json({ ...goal, target: Number(goal.target), current: Number(goal.current) });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

export default router;
