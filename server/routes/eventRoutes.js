// server/routes/events.js
const express = require('express');
const router = express.Router();
const db = require('../index').db; // mysql2 connection (has .promise())

// --- helpers ---
function safeParseJSON(s) {
  if (s == null) return [];
  if (Array.isArray(s)) return s;
  if (typeof s !== 'string') return [];
  try { 
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    // fallback: treat as CSV
    return s.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
  }
}

const row2dto = (r) => {
  const requiredSkills = safeParseJSON(r.required_skills);
  const eventDate = r.event_date; // 'YYYY-MM-DD' from DB
  return {
    id: String(r.id),
    name: r.name,
    description: r.description,
    details: r.description,              // legacy alias for old FE
    location: r.location,
    requiredSkills,
    urgency: Number(r.urgency),          // 1..5
    // expose BOTH snake_case and camelCase for the FE
    event_date: eventDate,
    eventDate: eventDate,
    stateCode: r.stateCode || null
  };
};

function normalizeSkills(v) {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === 'string')
    return v.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  return [];
}
function normalizeUrgency(v) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const s = String(v).toLowerCase().trim();
  if (/^[1-5]$/.test(s)) return Number(s);
  const map = { low: 1, medium: 3, high: 5 };
  return map[s] ?? NaN;
}
function pickEventDate(body) {
  // accept either event_date or eventDate
  return body.event_date ?? body.eventDate ?? null;
}

// --- routes ---

// GET /events  (list)
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM EventDetails ORDER BY event_date ASC'
    );
    res.json(rows.map(row2dto));
  } catch (e) { next(e); }
});

// ✅ GET /events/:id  (needed by SelectVolunteersPage)
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const [rows] = await db.promise().query('SELECT * FROM EventDetails WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(row2dto(rows[0]));
  } catch (e) { next(e); }
});

// POST /events
// Accepts: name, description|details, location, requiredSkills (array|string|csv), urgency (1-5|low/medium/high), event_date|eventDate, stateCode
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      description,        // new FE field
      details,            // legacy FE field
      location,
      requiredSkills,
      urgency,
      stateCode
    } = req.body;

    const desc = description ?? details ?? null;
    const skills = normalizeSkills(requiredSkills);
    const urgencyNum = normalizeUrgency(urgency);
    const eventDate = pickEventDate(req.body);

    // validate
    if (!name || !location || !eventDate) {
      return res.status(400).json({ error: 'name, location, and event_date/eventDate are required.' });
    }
    if (!Number.isFinite(urgencyNum) || urgencyNum < 1 || urgencyNum > 5) {
      return res.status(400).json({ error: 'Urgency must be low/medium/high or a number 1–5.' });
    }

    // insert
    const [result] = await db.promise().query(
      `INSERT INTO EventDetails
         (name, description, location, required_skills, urgency, event_date, stateCode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, desc, location, JSON.stringify(skills), urgencyNum, eventDate, stateCode ?? null]
    );

    // read back
    const [rows] = await db.promise().query('SELECT * FROM EventDetails WHERE id = ?', [result.insertId]);
    res.status(201).json(row2dto(rows[0]));
  } catch (e) { next(e); }
});

/* (Optional but useful)
router.put('/:id', async (req, res, next) => { ...update with same normalizers... });
router.delete('/:id', async (req, res, next) => { ... });
*/

module.exports = router;
