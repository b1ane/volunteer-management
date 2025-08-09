// routes/volunteerRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../index').db;

// GET /volunteers  (?search= optional)
router.get('/', async (req, res) => {
  const { search = '' } = req.query;
  const like = `%${search.trim()}%`;

  try {
    const [rows] = await db
      .promise()
      .query(
        `
        SELECT
          up.user_id            AS id,          -- <-- use profile.user_id as the volunteer id
          up.full_name,
          up.skills,
          up.availability,
          uc.email
        FROM userprofile up
        LEFT JOIN usercredentials uc ON uc.id = up.user_id
        ${search
          ? `WHERE (up.full_name LIKE ? OR up.skills LIKE ? OR uc.email LIKE ?)`
          : ''}
        ORDER BY COALESCE(up.full_name, uc.email) ASC
        `,
        search ? [like, like, like] : []
      );

    // normalize for UI
    const out = rows.map((r) => {
      // skills may be JSON or CSV
      let skills = [];
      if (Array.isArray(r.skills)) skills = r.skills;
      else if (typeof r.skills === 'string' && r.skills.trim()) {
        try { skills = JSON.parse(r.skills); }
        catch { skills = r.skills.split(',').map(s => s.trim()).filter(Boolean); }
      }
      return {
        id: r.id,                       // userprofile.user_id
        name: r.full_name || null,
        first_name: r.full_name ? r.full_name.split(' ')[0] : null,
        last_name: r.full_name ? r.full_name.split(' ').slice(1).join(' ') || null : null,
        email: r.email || null,         // from usercredentials (optional)
        skills,
        availability: r.availability || null,
      };
    });

    res.json(out);
  } catch (e) {
    console.error('GET /volunteers error:', e);
    res.status(500).json({ error: 'Failed to load volunteers' });
  }
});

module.exports = router;
