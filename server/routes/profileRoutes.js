const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

router.get('/', (req, res) => {
  const email = req.query.email;

  const query = `
    SELECT up.* 
    FROM UserProfile up
    JOIN UserCredentials uc ON up.user_id = uc.id
    WHERE uc.email = ?
  `;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(results[0]);
  });
});

router.post('/', (req, res) => {
  const {
    email,
    fullName,
    address1,
    address2,
    city,
    state,
    zip,
    skills,
    preferences,
    availability
  } = req.body;

  const getUserIdQuery = 'SELECT id, role FROM UserCredentials WHERE email = ?';
  db.query(getUserIdQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch user ID' });

    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = results[0].id;
    const role = results[0].role;

    const isVolunteer = role === 'volunteer';

    const insertProfileQuery = `
      INSERT INTO UserProfile 
        (user_id, full_name, address1, address2, city, state, zip, skills, preferences, availability)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        full_name = VALUES(full_name),
        address1 = VALUES(address1),
        address2 = VALUES(address2),
        city = VALUES(city),
        state = VALUES(state),
        zip = VALUES(zip),
        skills = VALUES(skills),
        preferences = VALUES(preferences),
        availability = VALUES(availability)
    `;

    db.query(insertProfileQuery, [
      userId,
      fullName,
      address1,
      address2,
      city,
      state,
      zip,
      JSON.stringify(skills || null),
      preferences || null,
      JSON.stringify(availability || null)
    ], (err, result) => {
      if (err) {
        console.error('Profile insert error:', err);
        return res.status(500).json({ message: 'Failed to save profile' });
      }

      res.json({ message: 'Profile saved successfully' });
    });
  });
});

module.exports = router;