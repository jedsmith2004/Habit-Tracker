import { Router } from 'express';
import sql from '../db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/events — fetch events the user organized or was invited to.
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Events I organized OR where I have an RSVP
    const events = await sql`
      SELECT DISTINCT e.*, u.name as organizer_name
      FROM events e
      JOIN users u ON u.id = e.organizer_id
      WHERE e.organizer_id = ${req.uid!}
        OR e.id IN (SELECT event_id FROM event_rsvps WHERE user_id = ${req.uid!})
      ORDER BY e.date DESC, e.time DESC
    `;

    if (events.length === 0) return res.json([]);

    const eventIds = events.map(e => e.id);
    const rsvps = await sql`
      SELECT * FROM event_rsvps WHERE event_id = ANY(${eventIds})
    `;

    const result = events.map(e => {
      const eventRsvps = rsvps.filter(r => r.event_id === e.id);
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        date: e.date,
        time: e.time,
        organizer: e.organizer_name,
        organizerId: e.organizer_id,
        invitees: eventRsvps.filter(r => r.status === 'invited').map(r => r.user_id),
        attendees: eventRsvps.filter(r => r.status === 'attending').map(r => r.user_id),
        declined: eventRsvps.filter(r => r.status === 'declined').map(r => r.user_id),
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/events — create a new event.
 * Body: { title, description, location, date, time }
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, title, description, location, date, time } = req.body;
    const eventId = id || `event-${Date.now()}`;

    await sql`
      INSERT INTO events (id, organizer_id, title, description, location, date, time)
      VALUES (${eventId}, ${req.uid!}, ${title}, ${description || ''}, ${location || ''}, ${date}, ${time || ''})
    `;

    // Organizer auto-attends
    await sql`
      INSERT INTO event_rsvps (event_id, user_id, status)
      VALUES (${eventId}, ${req.uid!}, 'attending')
    `;

    // Log it
    await sql`
      INSERT INTO activity_logs (user_id, type, description, related_id)
      VALUES (${req.uid!}, 'event', ${`Created event "${title}"`}, ${eventId})
    `;

    const [me] = await sql`SELECT name FROM users WHERE id = ${req.uid!}`;

    res.status(201).json({
      id: eventId,
      title,
      description: description || '',
      location: location || '',
      date,
      time: time || '',
      organizer: me.name,
      organizerId: req.uid!,
      invitees: [],
      attendees: [req.uid!],
      declined: [],
    });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * POST /api/events/:eventId/invite — invite friends to an event.
 * Body: { friendIds: string[] }
 */
router.post('/:eventId/invite', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;
    const { friendIds } = req.body;

    // Verify organizer
    const [event] = await sql`SELECT * FROM events WHERE id = ${eventId} AND organizer_id = ${req.uid!}`;
    if (!event) return res.status(403).json({ error: 'Only the organizer can invite people' });

    for (const fid of friendIds) {
      await sql`
        INSERT INTO event_rsvps (event_id, user_id, status)
        VALUES (${eventId}, ${fid}, 'invited')
        ON CONFLICT (event_id, user_id) DO NOTHING
      `;
    }

    // Log it
    await sql`
      INSERT INTO activity_logs (user_id, type, description, related_id)
      VALUES (${req.uid!}, 'event', ${`Invited ${friendIds.length} friend(s) to "${event.title}"`}, ${eventId})
    `;

    res.json({ success: true });
  } catch (err) {
    console.error('Invite to event error:', err);
    res.status(500).json({ error: 'Failed to invite to event' });
  }
});

/**
 * POST /api/events/:eventId/rsvp — RSVP to an event.
 * Body: { attending: boolean }
 */
router.post('/:eventId/rsvp', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { eventId } = req.params;
    const { attending } = req.body;
    const status = attending ? 'attending' : 'declined';

    await sql`
      INSERT INTO event_rsvps (event_id, user_id, status)
      VALUES (${eventId}, ${req.uid!}, ${status})
      ON CONFLICT (event_id, user_id) DO UPDATE SET status = ${status}
    `;

    const [event] = await sql`SELECT title FROM events WHERE id = ${eventId}`;
    if (event) {
      await sql`
        INSERT INTO activity_logs (user_id, type, description, related_id)
        VALUES (${req.uid!}, 'event', ${`${attending ? 'Attending' : 'Declined'} event "${event.title}"`}, ${eventId})
      `;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

export default router;
