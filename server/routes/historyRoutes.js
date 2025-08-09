// server/routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../index').db; // mysql2 pool/connection

// ---------- helpers ----------
async function insertHistory({ volunteer_id, event_id, participation_date, role, hours, notes }) {
  // Try with notes; if the column doesn't exist, retry without it
  try {
    const [result] = await db.promise().query(
      `INSERT INTO VolunteerHistory (volunteer_id, event_id, participation_date, role, hours, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [volunteer_id, event_id, participation_date, role, hours, notes ?? null]
    );
    return { id: result.insertId, volunteer_id, event_id, participation_date, role, hours, notes: notes ?? null };
  } catch (err) {
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      const [result] = await db.promise().query(
        `INSERT INTO VolunteerHistory (volunteer_id, event_id, participation_date, role, hours)
         VALUES (?, ?, ?, ?, ?)`,
        [volunteer_id, event_id, participation_date, role, hours]
      );
      return { id: result.insertId, volunteer_id, event_id, participation_date, role, hours };
    }
    throw err;
  }
}

async function selectVolunteerHistory(whereClause, params) {
  // Try selecting notes; if column doesn't exist, fall back without notes
  const withNotes = `
    SELECT
      vh.id,
      vh.participation_date,
      vh.role,
      vh.hours,
      vh.notes,
      ed.id   AS eventId,
      ed.name AS eventName
    FROM VolunteerHistory vh
    JOIN UserCredentials uc ON uc.id = vh.volunteer_id
    JOIN EventDetails ed    ON ed.id = vh.event_id
    ${whereClause}
    ORDER BY vh.participation_date DESC, ed.name ASC
  `;

  const withoutNotes = `
    SELECT
      vh.id,
      vh.participation_date,
      vh.role,
      vh.hours,
      ed.id   AS eventId,
      ed.name AS eventName
    FROM VolunteerHistory vh
    JOIN UserCredentials uc ON uc.id = vh.volunteer_id
    JOIN EventDetails ed    ON ed.id = vh.event_id
    ${whereClause}
    ORDER BY vh.participation_date DESC, ed.name ASC
  `;

  try {
    const [rows] = await db.promise().query(withNotes, params);
    return rows;
  } catch (err) {
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      const [rows] = await db.promise().query(withoutNotes, params);
      return rows;
    }
    throw err;
  }
}

// ---------- routes ----------

// POST /history
// Body: { volunteerEmail? OR volunteerId?, eventId, participation_date? | date?, role?, hours?, notes? }
router.post('/', async (req, res, next) => {
  try {
    let {
      volunteerEmail,
      volunteerId,
      eventId,
      participation_date,
      date,            // allow alias from FE
      role,
      hours,
      notes,
    } = req.body;

    // Validate eventId
    const eId = Number(eventId);
    if (!Number.isFinite(eId)) {
      return res.status(400).json({ error: 'eventId is required and must be a number' });
    }

    // Resolve volunteer_id (email or id)
    let vId = Number(volunteerId);
    if (!Number.isFinite(vId) && volunteerEmail) {
      const [u] = await db.promise().query(
        'SELECT id FROM UserCredentials WHERE email = ?',
        [volunteerEmail]
      );
      if (!u.length) return res.status(404).json({ error: 'Volunteer not found' });
      vId = u[0].id;
    }
    if (!Number.isFinite(vId)) {
      return res.status(400).json({ error: 'volunteerEmail or volunteerId is required' });
    }

    // Ensure event exists & default date to event_date if missing
    const [ev] = await db.promise().query(
      'SELECT id, event_date FROM EventDetails WHERE id = ?',
      [eId]
    );
    if (!ev.length) return res.status(404).json({ error: 'Event not found' });

    const finalDate = participation_date || date || ev[0].event_date;
    const hrs = Number(hours || 0);
    const r = role && String(role).trim() ? String(role).trim() : 'Volunteer';

    const created = await insertHistory({
      volunteer_id: vId,
      event_id: eId,
      participation_date: finalDate,
      role: r,
      hours: hrs,
      notes
    });

    return res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// GET /history/volunteer?email=... OR ?volunteerId=... [&from=YYYY-MM-DD&to=YYYY-MM-DD]
router.get('/volunteer', async (req, res, next) => {
  try {
    const { email, volunteerId, from, to } = req.query;

    const where = [];
    const params = [];

    if (email) {
      where.push('uc.email = ?'); params.push(email);
    } else if (volunteerId) {
      where.push('uc.id = ?'); params.push(Number(volunteerId));
    } else {
      return res.status(400).json({ error: 'email or volunteerId is required' });
    }

    if (from && to) { where.push('vh.participation_date BETWEEN ? AND ?'); params.push(from, to); }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await selectVolunteerHistory(clause, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// (Optional) compatibility: GET /history/:volunteerId
// So older frontends that call /history/123 still work.
router.get('/:volunteerId', async (req, res, next) => {
  try {
    const vId = Number(req.params.volunteerId);
    if (!Number.isFinite(vId)) return res.status(400).json({ error: 'volunteerId must be a number' });
    const clause = `WHERE uc.id = ?`;
    const rows = await selectVolunteerHistory(clause, [vId]);
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
