const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth /*, requireAdmin*/ } = require('../middleware/auth');

// GET /volunteers  (optionally filter by ?search=)
router.get('/', requireAuth, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    let sql = `SELECT id, first_name, last_name, email, skills FROM volunteers`;
    const params = [];
    if (search) {
      sql += ` WHERE CONCAT_WS(' ', first_name, last_name, email, skills) LIKE ?`;
      params.push(`%${search}%`);
    }
    sql += ` ORDER BY last_name, first_name`;
    const [rows] = await db.execute(sql, params);

    // normalize skills if stored as JSON string
    const out = rows.map(r => ({
      ...r,
      skills: Array.isArray(r.skills)
        ? r.skills
        : (typeof r.skills === 'string'
            ? (safeJSON(r.skills) ?? r.skills.split(',').map(s=>s.trim()).filter(Boolean))
            : [])
    }));

    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load volunteers' });
  }
});

function safeJSON(s){ try { return JSON.parse(s); } catch { return null; } }

module.exports = router;
