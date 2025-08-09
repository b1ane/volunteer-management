// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const crypto = require('crypto');
const sendVerificationEmail = require('./utils/email');

const app = express();

// Basic logging to see what hits the server
app.use((req, _res, next) => { console.log('[REQ]', req.method, req.url); next(); });

// CORS + JSON
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});
db.connect((err) => {
  if (err) console.error('Failed to connect to MySQL:', err.message);
  else console.log('Connected to MySQL');
});
module.exports.db = db;

/* ------------------ ROUTES ------------------ */

// Feature routers
app.use('/profile',       require('./routes/profileRoutes'));
app.use('/events',        require('./routes/eventRoutes'));        // your event CRUD etc.
app.use('/history',       require('./routes/historyRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/match',         require('./routes/matchingRoutes'));
app.use('/reports',       require('./routes/reportRoutes'));
app.use('/states',        require('./routes/statesRoutes'));
app.use('/volunteers',    require('./routes/volunteerRoutes'));

// 🔹 Upcoming Events namespace (everything lives under /upcomingevents)
app.use('/upcomingevents', require('./routes/upcomingEventsRoutes'));   // contains GET /volunteer-id
app.use('/upcomingevents', require('./routes/assignedEventsRoutes'));    // contains GET /assigned

// Health
app.get('/_ping', (_req, res) => res.json({ ok: true }));
app.get('/match/_ping', (_req, res) => res.json({ ok: true }));

/* ------------------ AUTH ENDPOINTS ------------------ */

// Register (POST /volunteers)
app.post('/volunteers', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const checkQuery = 'SELECT * FROM usercredentials WHERE email = ?';
  db.query(checkQuery, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) return res.status(409).json({ message: 'Email already registered' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const verifyToken = crypto.randomBytes(32).toString('hex');

      const insertQuery = `
        INSERT INTO usercredentials (email, password_hash, role, is_verified, verify_token)
        VALUES (?, ?, ?, 0, ?)
      `;
      db.query(insertQuery, [email, hashedPassword, role, verifyToken], async (err2, result) => {
        if (err2) {
          console.error('Insert error:', err2);
          return res.status(500).json({ message: 'Failed to register volunteer' });
        }
        try {
          await sendVerificationEmail(email, verifyToken);
          return res.status(201).json({
            message: 'Registration successful. Check your email to verify your account.',
            userId: result.insertId
          });
        } catch (emailErr) {
          console.error('Failed to send verification email:', emailErr);
          return res.status(500).json({ message: 'User created, but email verification failed.' });
        }
      });
    } catch (hashErr) {
      console.error('Hash error:', hashErr);
      return res.status(500).json({ message: 'Server error' });
    }
  });
});

// (Legacy) Volunteer ID lookup at root — keep temporarily for backward compat
app.get('/volunteer-id', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const query = 'SELECT id FROM usercredentials WHERE email = ? LIMIT 1';
  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'Volunteer not found' });
    res.json({ volunteerId: results[0].id });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM usercredentials WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(401).json({ message: 'Email address not registered' });

    const user = results[0];
    try {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ message: 'Incorrect password' });
      if (!user.is_verified) {
        return res.status(403).json({ message: 'Please verify your email before logging in.' });
      }
      return res.json({ message: 'Login successful', email: user.email, role: user.role });
    } catch (e) {
      console.error('Bcrypt compare failed:', e);
      return res.status(500).json({ message: 'Incorrect password' });
    }
  });
});

// Verify email
app.get('/verify-email', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid verification link');

  const query = 'SELECT * FROM usercredentials WHERE verify_token = ?';
  db.query(query, [token], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(400).send('Invalid or expired token');

    const update = 'UPDATE usercredentials SET is_verified = 1, verify_token = NULL WHERE id = ?';
    db.query(update, [results[0].id], (err2) => {
      if (err2) return res.status(500).send('Failed to verify email');
      return res.redirect('http://localhost:3000/login');
    });
  });
});

/* ------------------ (Optional) inline GET /volunteers ------------------ */
/* Keeps your matching UI alive; can be moved back to routes/volunteerRoutes.js later. */
app.get('/volunteers', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const like = `%${search}%`;

    const [rows] = await db.promise().query(
      `
      SELECT
        up.user_id AS id,
        up.full_name,
        up.skills,
        up.availability,
        uc.email
      FROM userprofile up
      LEFT JOIN usercredentials uc ON uc.id = up.user_id
      ${search ? 'WHERE (up.full_name LIKE ? OR up.skills LIKE ? OR uc.email LIKE ?)' : ''}
      ORDER BY COALESCE(up.full_name, uc.email) ASC
      `,
      search ? [like, like, like] : []
    );

    const out = (rows || []).map((r) => {
      let skills = [];
      if (Array.isArray(r.skills)) skills = r.skills;
      else if (typeof r.skills === 'string' && r.skills.trim()) {
        try { skills = JSON.parse(r.skills); }
        catch { skills = r.skills.split(',').map(s => s.trim()).filter(Boolean); }
      }
      return {
        id: r.id,
        name: r.full_name || null,
        first_name: r.full_name ? r.full_name.split(' ')[0] : null,
        last_name: r.full_name ? r.full_name.split(' ').slice(1).join(' ') || null : null,
        email: r.email || null,
        skills,
        availability: r.availability || null,
      };
    });

    return res.json(out);
  } catch (e) {
    console.error('GET /volunteers inline error:', e);
    return res.status(500).json({ error: 'Failed to load volunteers' });
  }
});

/* ------------------ ERROR HANDLERS ------------------ */

// 404 for unknown API paths (after all routers)
app.use((req, res, next) => {
  if (
    req.path.startsWith('/events') ||
    req.path.startsWith('/volunteers') ||
    req.path.startsWith('/match') ||
    req.path.startsWith('/profile') ||
    req.path.startsWith('/history') ||
    req.path.startsWith('/notifications') ||
    req.path.startsWith('/reports') ||
    req.path.startsWith('/states') ||
    req.path.startsWith('/upcomingevents') // 🔹 ensure we don't 404 those
  ) {
    return res.status(404).json({ error: 'Not found', path: req.path });
  }
  next();
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ------------------ START SERVER ------------------ */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
