const express = require('express');
const router = express.Router();
const db = require('../index').db;

// GET /history/volunteer?email=... or ?volunteerId=...
router.get('/volunteer', async (req, res, next) => {
  try {
    const { email, volunteerId, from, to } = req.query;

    let where = [];
    let params = [];

    if (email) {
      where.push('uc.email = ?');
      params.push(email);
    } else if (volunteerId) {
      where.push('uc.id = ?');
      params.push(Number(volunteerId));
    } else {
      return res.status(400).json({ error: 'email or volunteerId is required' });
    }

    if (from && to) {
      where.push('vh.participation_date BETWEEN ? AND ?');
      params.push(from, to);
    }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.promise().query(`
      SELECT
        vh.id,
        uc.id           AS volunteerId,
        up.full_name    AS volunteerName,
        uc.email        AS volunteerEmail,
        vh.participation_date AS participationDate,
        vh.role,
        vh.hours,
        ed.id           AS eventId,
        ed.name         AS eventName,
        ed.event_date   AS eventDate,
        ed.location     AS eventLocation,
        ed.required_skills AS eventRequiredSkills,
        ed.urgency
      FROM VolunteerHistory vh
      JOIN UserCredentials uc ON uc.id = vh.volunteer_id
      LEFT JOIN UserProfile up ON up.user_id = uc.id
      JOIN EventDetails ed ON ed.id = vh.event_id
      ${clause}
      ORDER BY vh.participation_date DESC, ed.name ASC
    `, params);

    // parse skills JSON for convenience
    const data = rows.map(r => ({
      ...r,
      eventRequiredSkills: r.eventRequiredSkills ? JSON.parse(r.eventRequiredSkills) : []
    }));

    res.json(data);
  } catch (e) { next(e); }
});

// POST /history  (assign a volunteer to an event / log participation)
router.post('/', async (req, res, next) => {
  try {
    const { volunteerEmail, volunteerId, eventId, participation_date, role, hours } = req.body;

    // resolve volunteer_id
    let vId = volunteerId;
    if (!vId && volunteerEmail) {
      const [u] = await db.promise().query(`SELECT id FROM UserCredentials WHERE email = ?`, [volunteerEmail]);
      if (!u.length) return res.status(404).json({ error: 'Volunteer not found' });
      vId = u[0].id;
    }
    if (!vId) return res.status(400).json({ error: 'volunteerEmail or volunteerId is required' });

    // ensure event exists
    const [e] = await db.promise().query(`SELECT id, event_date FROM EventDetails WHERE id = ?`, [eventId]);
    if (!e.length) return res.status(404).json({ error: 'Event not found' });

    const date = participation_date || e[0].event_date;   // default to the event date

    const [result] = await db.promise().query(
      `INSERT INTO VolunteerHistory (volunteer_id, event_id, participation_date, role, hours)
       VALUES (?, ?, ?, ?, ?)`,
      [vId, eventId, date, role || 'Volunteer', Number(hours || 0)]
    );

    res.status(201).json({ id: result.insertId, volunteerId: vId, eventId, participation_date: date, role, hours: Number(hours || 0) });
  } catch (e) { next(e); }
});

// (optional) GET /history/event/:id  -> see all volunteers assigned to an event
router.get('/event/:id', async (req, res, next) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT
        vh.id,
        uc.id AS volunteerId,
        up.full_name AS volunteerName,
        uc.email AS volunteerEmail,
        vh.participation_date,
        vh.role,
        vh.hours
      FROM VolunteerHistory vh
      JOIN UserCredentials uc ON uc.id = vh.volunteer_id
      LEFT JOIN UserProfile up ON up.user_id = uc.id
      WHERE vh.event_id = ?
      ORDER BY up.full_name ASC
    `, [req.params.id]);

    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
