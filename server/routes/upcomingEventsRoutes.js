const express = require('express');
const router = express.Router();
const { db } = require('../index');

// GET /upcomingevents/volunteer-id?email=...
router.get('/volunteer-id', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const sql = 'SELECT id FROM usercredentials WHERE email = ? LIMIT 1';
  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.error('GET /upcomingevents/volunteer-id DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!rows.length) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    res.json({ volunteerId: rows[0].id });
  });
});

module.exports = router;
