import { Router } from 'express';
import sql from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/habits — fetch all habits + their entries for the current user.
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const habits = await sql`
      SELECT * FROM habits WHERE user_id = ${req.uid!} ORDER BY created_at
    `;

    // Fetch all entries for these habits in one query
    const habitIds = habits.map(h => h.id);
    const entries = habitIds.length
      ? await sql`SELECT * FROM habit_entries WHERE habit_id = ANY(${habitIds})`
      : [];

    // Build history maps
    const habitsWithHistory = habits.map(h => ({
      id: h.id,
      title: h.title,
      description: h.description,
      category: h.category,
      history: Object.fromEntries(
        entries
          .filter(e => e.habit_id === h.id)
          .map(e => [e.date.toISOString().split('T')[0], e.status])
      ),
    }));

    res.json(habitsWithHistory);
  } catch (err) {
    console.error('Fetch habits error:', err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

/**
 * POST /api/habits — create a new habit.
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, title, description, category } = req.body;
    const [habit] = await sql`
      INSERT INTO habits (id, user_id, title, description, category)
      VALUES (${id}, ${req.uid!}, ${title}, ${description || null}, ${category || 'Health'})
      RETURNING *
    `;
    res.status(201).json({ ...habit, history: {} });
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

/**
 * DELETE /api/habits/:id
 */
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await sql`DELETE FROM habits WHERE id = ${req.params.id} AND user_id = ${req.uid!}`;
    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'habit', 'Deleted a habit')
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

/**
 * PUT /api/habits/:id — edit a habit (e.g. rename).
 */
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title } = req.body;
    const habitId = req.params.id;
    const [habit] = await sql`
      UPDATE habits SET title = ${title}
      WHERE id = ${habitId} AND user_id = ${req.uid!}
      RETURNING *
    `;
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'habit', ${'Renamed habit to "' + title + '"'})
    `;
    res.json({ success: true });
  } catch (err) {
    console.error('Edit habit error:', err);
    res.status(500).json({ error: 'Failed to edit habit' });
  }
});

/**
 * PUT /api/habits/:id/entries — toggle a habit entry for a date.
 * Body: { date: "YYYY-MM-DD", status: "COMPLETED" | "FAILED" | null }
 * If status is null/undefined, the entry is deleted (cleared).
 */
router.put('/:id/entries', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date, status } = req.body;
    const habitId = req.params.id;

    if (!status) {
      await sql`DELETE FROM habit_entries WHERE habit_id = ${habitId} AND date = ${date}`;
    } else {
      await sql`
        INSERT INTO habit_entries (habit_id, date, status)
        VALUES (${habitId}, ${date}, ${status})
        ON CONFLICT (habit_id, date) DO UPDATE SET status = ${status}
      `;
    }

    // Log it
    const [habit] = await sql`SELECT title, category FROM habits WHERE id = ${habitId}`;
    if (habit && status === 'COMPLETED') {
      const isNegative = false; // server doesn't track isNegative yet, client adds proper description
      await sql`
        INSERT INTO activity_logs (user_id, type, description, reversible, related_id)
        VALUES (${req.uid!}, 'habit', ${`Completed "${habit.title}" for ${date}`}, TRUE, ${habitId})
      `;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Toggle habit error:', err);
    res.status(500).json({ error: 'Failed to update habit entry' });
  }
});

export default router;
