// server/routes/reportsRoutes.js
const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

// pull in your existing db connection
// const db = require('../index').db; // if you export it there
const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// --- SQL helpers (adjust table/column names to your schema) ---

// 1) Volunteers + Participation History
const qVolunteers = `
  SELECT 
    v.id AS volunteer_id,
    v.email,
    v.name,
    vh.event_id,
    e.name AS event_name,
    vh.participated_at,
    vh.hours
  FROM Volunteers v
  LEFT JOIN VolunteerHistory vh ON vh.volunteer_id = v.id
  LEFT JOIN EventDetails e ON e.id = vh.event_id
  ORDER BY v.id, vh.participated_at DESC;
`;

// 2) Events + Volunteer Assignments
const qEvents = `
  SELECT
    e.id AS event_id,
    e.name AS event_name,
    e.description,
    e.location,
    e.required_skills,
    e.urgency,
    e.event_date,
    va.volunteer_id,
    v.name AS volunteer_name,
    v.email AS volunteer_email
  FROM EventDetails e
  LEFT JOIN VolunteerAssignments va ON va.event_id = e.id
  LEFT JOIN Volunteers v ON v.id = va.volunteer_id
  ORDER BY e.event_date DESC, e.id;
`;

// ---------- CSV endpoints ----------

// GET /reports/volunteers.csv
router.get('/volunteers.csv', (req, res) => {
  db.query(qVolunteers, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'DB error', error: err.message });
    }
    const fields = [
      { label: 'Volunteer ID', value: 'volunteer_id' },
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
      { label: 'Event ID', value: 'event_id' },
      { label: 'Event Name', value: 'event_name' },
      { label: 'Participated At', value: row => row.participated_at ? dayjs(row.participated_at).format('YYYY-MM-DD') : '' },
      { label: 'Hours', value: 'hours' },
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows || []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volunteers_history.csv"');
    return res.status(200).send(csv);
  });
});

// GET /reports/events.csv
router.get('/events.csv', (req, res) => {
  db.query(qEvents, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'DB error', error: err.message });
    }
    const fields = [
      { label: 'Event ID', value: 'event_id' },
      { label: 'Event Name', value: 'event_name' },
      { label: 'Description', value: 'description' },
      { label: 'Location', value: 'location' },
      { label: 'Required Skills', value: 'required_skills' },
      { label: 'Urgency', value: 'urgency' },
      { label: 'Event Date', value: row => row.event_date ? dayjs(row.event_date).format('YYYY-MM-DD') : '' },
      { label: 'Volunteer ID', value: 'volunteer_id' },
      { label: 'Volunteer Name', value: 'volunteer_name' },
      { label: 'Volunteer Email', value: 'volunteer_email' },
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows || []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events_assignments.csv"');
    return res.status(200).send(csv);
  });
});

// ---------- PDF endpoint (combined summary) ----------

// GET /reports/summary.pdf
router.get('/summary.pdf', (req, res) => {
  // Fetch both datasets then render one PDF
  db.query(qVolunteers, (err, volunteersRows) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    db.query(qEvents, (err2, eventsRows) => {
      if (err2) return res.status(500).json({ message: 'DB error', error: err2.message });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="volunteer_reports_summary.pdf"');

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      // Title
      doc.fontSize(18).text('Volunteer Management Report', { align: 'center' });
      doc.moveDown(0.5).fontSize(10).text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, { align: 'center' });
      doc.moveDown(1.5);

      // Section 1: Volunteers + History
      doc.fontSize(14).text('1) Volunteers & Participation History');
      doc.moveDown(0.5);

      if (!volunteersRows || volunteersRows.length === 0) {
        doc.fontSize(10).text('No volunteer history found.');
      } else {
        let currentVol = null;
        volunteersRows.forEach((r) => {
          if (currentVol !== r.volunteer_id) {
            doc.moveDown(0.6);
            doc.fontSize(12).text(`Volunteer #${r.volunteer_id}: ${r.name || '(no name)'} <${r.email || ''}>`);
            currentVol = r.volunteer_id;
          }
          const line = [
            '  - ',
            r.event_name ? `Event: ${r.event_name}` : 'Event: (none)',
            r.participated_at ? ` | Date: ${dayjs(r.participated_at).format('YYYY-MM-DD')}` : '',
            (r.hours != null) ? ` | Hours: ${r.hours}` : '',
          ].join('');
          doc.fontSize(10).text(line);
        });
      }

      doc.addPage();

      // Section 2: Events + Assignments
      doc.fontSize(14).text('2) Events & Volunteer Assignments');
      doc.moveDown(0.5);

      if (!eventsRows || eventsRows.length === 0) {
        doc.fontSize(10).text('No events found.');
      } else {
        let currentEvent = null;
        eventsRows.forEach((r) => {
          if (currentEvent !== r.event_id) {
            doc.moveDown(0.6);
            doc.fontSize(12).text(`Event #${r.event_id}: ${r.event_name || '(no name)'}  |  ${dayjs(r.event_date).format('YYYY-MM-DD')}`);
            doc.fontSize(10).text(`Location: ${r.location || ''}`);
            doc.fontSize(10).text(`Urgency: ${r.urgency || ''} | Required Skills: ${r.required_skills || ''}`);
            currentEvent = r.event_id;
          }
          const assignee = r.volunteer_id ? `  - ${r.volunteer_name || '(no name)'} <${r.volunteer_email || ''}>` : '  - (no volunteers assigned)';
          doc.fontSize(10).text(assignee);
        });
      }

      doc.end();
    });
  });
});

module.exports = router;
