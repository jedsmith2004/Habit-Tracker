import { Router } from 'express';
import sql from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/friends — fetch the current user's accepted friends with their goals.
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const friendRows = await sql`
      SELECT u.id, u.name, u.email, u.avatar_url, f.created_at as friended_at
      FROM friends f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ${req.uid!} AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `;

    const friendIds = friendRows.map(f => f.id);
    const friendGoals = friendIds.length
      ? await sql`SELECT * FROM goals WHERE user_id = ANY(${friendIds}) ORDER BY created_at`
      : [];

    const result = friendRows.map(f => ({
      id: f.id,
      name: f.name,
      email: f.email,
      avatarUrl: f.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=2ea043&color=fff`,
      status: 'HabitFlow user',
      lastActive: 'recently',
      goals: friendGoals
        .filter(g => g.user_id === f.id)
        .map(g => ({
          id: g.id,
          title: g.title,
          category: g.category,
          target: Number(g.target),
          current: Number(g.current),
          unit: g.unit,
          deadline: g.deadline,
          history: [],
        })),
    }));

    res.json(result);
  } catch (err) {
    console.error('Fetch friends error:', err);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

/**
 * GET /api/friends/requests — fetch pending friend requests received by current user.
 */
router.get('/requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const requests = await sql`
      SELECT f.id as request_id, f.created_at, u.id, u.name, u.email, u.avatar_url
      FROM friends f
      JOIN users u ON u.id = f.user_id
      WHERE f.friend_id = ${req.uid!} AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `;

    const formatted = requests.map(r => ({
      requestId: r.request_id.toString(),
      id: r.id,
      name: r.name,
      email: r.email,
      avatarUrl: r.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=2ea043&color=fff`,
      createdAt: r.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch friend requests error:', err);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

/**
 * GET /api/friends/search?q=<query> — search users by name or email.
 * Excludes self, existing friends, and pending requests sent by current user.
 */
router.get('/search', requireAuth, async (req: AuthRequest, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) return res.json([]);

    const pattern = `%${q}%`;
    const results = await sql`
      SELECT u.id, u.name, u.email, u.avatar_url
      FROM users u
      WHERE u.id != ${req.uid!}
        AND (u.name ILIKE ${pattern} OR u.email ILIKE ${pattern})
        AND u.id NOT IN (
          SELECT friend_id FROM friends WHERE user_id = ${req.uid!}
        )
        AND u.id NOT IN (
          SELECT user_id FROM friends WHERE friend_id = ${req.uid!} AND status = 'pending'
        )
      ORDER BY u.name
      LIMIT 20
    `;

    res.json(results.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2ea043&color=fff`,
    })));
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

/**
 * POST /api/friends — send a friend request.
 * Body: { friendId: string }
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId is required' });
    if (friendId === req.uid) return res.status(400).json({ error: 'Cannot add yourself' });

    const [targetUser] = await sql`SELECT id, name FROM users WHERE id = ${friendId}`;
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Create pending friend request (one direction only)
    await sql`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES (${req.uid!}, ${friendId}, 'pending')
      ON CONFLICT (user_id, friend_id) DO NOTHING
    `;

    // Log it for the sender
    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'friend', ${`Sent friend request to "${targetUser.name}"`})
    `;

    res.status(201).json({ success: true, name: targetUser.name });
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

/**
 * POST /api/friends/accept — accept a friend request.
 * Body: { friendId: string } — the user who sent the request
 */
router.post('/accept', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { friendId } = req.body;

    // Update the incoming request to 'accepted'
    await sql`
      UPDATE friends SET status = 'accepted'
      WHERE user_id = ${friendId} AND friend_id = ${req.uid!} AND status = 'pending'
    `;

    // Create the reverse friendship (also accepted)
    await sql`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES (${req.uid!}, ${friendId}, 'accepted')
      ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'
    `;

    const [friendUser] = await sql`SELECT id, name, email, avatar_url FROM users WHERE id = ${friendId}`;
    const [me] = await sql`SELECT name FROM users WHERE id = ${req.uid!}`;

    // Log for acceptor
    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'friend', ${`Accepted friend request from "${friendUser.name}"`})
    `;
    // Log for the original sender
    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${friendId}, 'friend', ${`${me.name} accepted your friend request`})
    `;

    // Return the friend data
    const friendGoals = await sql`SELECT * FROM goals WHERE user_id = ${friendId} ORDER BY created_at`;

    res.json({
      id: friendUser.id,
      name: friendUser.name,
      email: friendUser.email,
      avatarUrl: friendUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendUser.name)}&background=2ea043&color=fff`,
      status: 'HabitFlow user',
      lastActive: 'recently',
      goals: friendGoals.map((g: any) => ({
        id: g.id, title: g.title, category: g.category,
        target: Number(g.target), current: Number(g.current),
        unit: g.unit, deadline: g.deadline, history: [],
      })),
    });
  } catch (err) {
    console.error('Accept friend error:', err);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

/**
 * POST /api/friends/reject — reject a friend request.
 * Body: { friendId: string }
 */
router.post('/reject', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { friendId } = req.body;

    await sql`
      DELETE FROM friends
      WHERE user_id = ${friendId} AND friend_id = ${req.uid!} AND status = 'pending'
    `;

    const [friendUser] = await sql`SELECT name FROM users WHERE id = ${friendId}`;

    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'friend', ${`Declined friend request from "${friendUser?.name || 'Unknown'}"`})
    `;

    res.json({ success: true });
  } catch (err) {
    console.error('Reject friend error:', err);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

/**
 * DELETE /api/friends/:friendId — remove a friend.
 */
router.delete('/:friendId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { friendId } = req.params;
    const [friendUser] = await sql`SELECT name FROM users WHERE id = ${friendId}`;

    await sql`DELETE FROM friends WHERE user_id = ${req.uid!} AND friend_id = ${friendId}`;
    await sql`DELETE FROM friends WHERE user_id = ${friendId} AND friend_id = ${req.uid!}`;

    await sql`
      INSERT INTO activity_logs (user_id, type, description)
      VALUES (${req.uid!}, 'friend', ${`Removed "${friendUser?.name || 'a friend'}" from friends`})
    `;

    res.json({ success: true });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

/**
 * GET /api/friends/feed — get recent activity from all accepted friends.
 * Returns habit/goal activity logs so friends can see each other's progress.
 */
router.get('/feed', requireAuth, async (req: AuthRequest, res) => {
  try {
    const feedLogs = await sql`
      SELECT al.*, u.name, u.avatar_url
      FROM activity_logs al
      JOIN users u ON u.id = al.user_id
      WHERE al.user_id IN (
        SELECT friend_id FROM friends
        WHERE user_id = ${req.uid!} AND status = 'accepted'
      )
      AND al.type IN ('habit', 'goal')
      AND al.reversed = FALSE
      ORDER BY al.created_at DESC
      LIMIT 30
    `;

    const formatted = feedLogs.map(l => ({
      id: l.id.toString(),
      friendId: l.user_id,
      friendName: l.name,
      friendAvatar: l.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(l.name)}&background=2ea043&color=fff`,
      description: l.description,
      timestamp: l.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch feed error:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
