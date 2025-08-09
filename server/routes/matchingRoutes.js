// routes/matchingRoutes.js  (Option A: singular /match)
const express = require('express');
const router = express.Router();
const db = require('../index').db; // mysql2 createConnection

// GET /match?eventId=123  -> current assignments for an event
router.get('/', async (req, res) => {
  const eventId = parseInt(req.query.eventId, 10);
  if (!eventId) return res.status(400).json({ error: 'eventId required' });

  try {
    const [rows] = await db.promise().query(
      `
      SELECT
        ae.id,
        ae.event_id,
        ae.volunteer_id,            -- equals userprofile.user_id
        ae.status,
        ae.assigned_at,
        up.full_name,
        uc.email
      FROM assigned_events ae
      JOIN userprofile up          ON up.user_id = ae.volunteer_id
      LEFT JOIN usercredentials uc ON uc.id = up.user_id
      WHERE ae.event_id = ?
      ORDER BY ae.assigned_at DESC
      `,
      [eventId]
    );

    const out = rows.map(r => ({
      id: r.id,
      event_id: r.event_id,
      volunteer_id: r.volunteer_id,
      status: r.status,
      assigned_at: r.assigned_at,
      name: r.full_name || null,
      first_name: r.full_name ? r.full_name.split(' ')[0] : null,
      last_name: r.full_name ? r.full_name.split(' ').slice(1).join(' ') || null : null,
      email: r.email || null
    }));

    res.json(out);
  } catch (e) {
    console.error('GET /match error:', e);
    res.status(500).json({ error: 'Failed to fetch current assignments' });
  }
});

// POST /match/bulk { eventId, volunteerIds: number[], notes? }
router.post('/bulk', async (req, res) => {
  const { eventId, volunteerIds, notes } = req.body || {};
  if (!eventId || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
    return res.status(400).json({ error: 'eventId and volunteerIds are required' });
  }

  const adminId = 1; // TODO: replace with real authenticated user id
  const conn = db.promise(); // use the existing connection in promise mode

  try {
    await conn.beginTransaction();

    // Ensure the event exists in eventdetails
    const [[evt]] = await conn.query(
      `SELECT id FROM eventdetails WHERE id = ?`,
      [eventId]
    );
    if (!evt) {
      await conn.rollback();
      return res.status(404).json({ error: 'Event not found' });
    }

    // Insert IGNORE to skip duplicates (requires UNIQUE(event_id, volunteer_id))
    const values = volunteerIds.map(vid => [eventId, vid, adminId, notes ?? null]);
    const [result] = await conn.query(
      `INSERT IGNORE INTO assigned_events (event_id, volunteer_id, assigned_by, notes)
       VALUES ?`,
      [values]
    );

    await conn.commit();
    const inserted = result.affectedRows || 0;
    res.status(201).json({
      inserted,
      duplicatesSkipped: volunteerIds.length - inserted
    });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error('POST /match/bulk error:', e);
    res.status(500).json({ error: 'Bulk assign failed' });
  }
});

// DELETE /match/bulk  { eventId, volunteerIds: number[] }
router.delete('/bulk', async (req, res) => {
  const { eventId, volunteerIds } = req.body || {};
  if (!eventId || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
    return res.status(400).json({ error: 'eventId and volunteerIds are required' });
  }

  try {
    const [result] = await db.promise().query(
      `DELETE FROM assigned_events
         WHERE event_id = ?
           AND volunteer_id IN (?)`,
      [Number(eventId), volunteerIds]
    );

    res.json({ removed: result.affectedRows || 0 });
  } catch (e) {
    console.error('DELETE /match/bulk error:', e);
    res.status(500).json({ error: 'Bulk unassign failed' });
  }
});

// DELETE /match/:id -> unassign one volunteer (by assignment id)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'id required' });

  try {
    const [r] = await db.promise().execute(
      `DELETE FROM assigned_events WHERE id = ?`,
      [id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /match/:id error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
