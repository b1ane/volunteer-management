// server/routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../index').db;     // your mysql2 connection/pool

// map DB row -> API shape
const row2dto = r => ({
  id: String(r.id),
  name: r.name,
  description: r.description,
  location: r.location,
  requiredSkills: r.required_skills ? JSON.parse(r.required_skills) : [],
  urgency: Number(r.urgency),
  event_date: r.event_date,
  stateCode: r.stateCode || null
});

// GET /events
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM EventDetails ORDER BY event_date DESC'
    );
    res.json(rows.map(row2dto));
  } catch (e) { next(e); }
});

// POST /events
// expects: {name, description, location, requiredSkills:[], urgency(1-5), event_date('YYYY-MM-DD'), stateCode?}
router.post('/', async (req, res, next) => {
  try {
    const { name, description, location, requiredSkills, urgency, event_date, stateCode } = req.body;

    if (!name || !location || !urgency || !event_date) {
      return res.status(400).json({ error: 'Name, location, urgency (1-5), and event_date (YYYY-MM-DD) are required.' });
    }
    if (isNaN(Number(urgency)) || urgency < 1 || urgency > 5) {
      return res.status(400).json({ error: 'Urgency must be a number between 1 and 5.' });
    }

    const [result] = await db.promise().query(
      `INSERT INTO EventDetails
         (name, description, location, required_skills, urgency, event_date, stateCode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description ?? null, location, JSON.stringify(requiredSkills || []), Number(urgency), event_date, stateCode ?? null]
    );

    const [rows] = await db.promise().query('SELECT * FROM EventDetails WHERE id = ?', [result.insertId]);
    res.status(201).json(row2dto(rows[0]));
  } catch (e) { next(e); }
});

module.exports = router;
