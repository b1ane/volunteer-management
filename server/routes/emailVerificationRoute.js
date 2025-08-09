// emailVerificationRoute.js

const express = require('express');
const router = express.Router();
const { db } = require('../index');

router.get('/verify-email', async (req, res) => {
  const token = req.query.token;

  if (!token) return res.status(400).send('Invalid verification link');

  try {
    const [rows] = await db.promise().execute(
      'SELECT * FROM UserCredentials WHERE verify_token = ?',
      [token]
    );

    if (rows.length === 0) return res.status(400).send('Invalid or expired token');

    await db.promise().execute(
      'UPDATE UserCredentials SET is_verified = 1, verify_token = NULL WHERE id = ?',
      [rows[0].id]
    );

    res.send(`
      <h2>Email Verified!</h2>
      <p>Your account has been activated. You can now <a href="http://localhost:3000">log in</a>.</p>
    `);

  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).send('Server error. Please try again later.');
  }
});

module.exports = router;

