// server/routes/assignedEventsRoutes.js
const express = require('express');
const router = express.Router();
const { db } = require('../index');

const EVENTS_TABLE = 'eventdetails';
const ASSIGN_TABLE = 'assigned_events';

// Candidate columns by meaning
const DATE_COLS  = ['eventDate', 'start_time', 'date', 'startDate', 'start']; // add more if needed
const TITLE_COLS = ['event_name', 'title', 'name'];
const LOC_COLS   = ['location', 'venue', 'place'];
const DESC_COLS  = ['description', 'details', 'notes'];

// Look up actual columns in the target table and pick the first that exists
async function pickCols(table) {
  const [rows] = await db.promise().query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?`,
    [table]
  );
  const set = new Set(rows.map(r => r.COLUMN_NAME));
  const pick = (cands) => cands.find(c => set.has(c));
  return {
    hasId:    set.has('id'),
    dateCol:  pick(DATE_COLS),
    titleCol: pick(TITLE_COLS),
    locCol:   pick(LOC_COLS),
    descCol:  pick(DESC_COLS),
  };
}

/**
 * GET /upcomingevents/assigned?volunteerId=123
 * Also accepts userId/id as fallbacks.
 */
router.get('/assigned', async (req, res) => {
  try {
    // Accept several keys and coerce to number
    const idRaw = req.query.volunteerId ?? req.query.userId ?? req.query.id;
    const volunteerId = Number(idRaw);
    if (!Number.isFinite(volunteerId) || volunteerId <= 0) {
      return res.status(400).json({ message: 'volunteerId (or userId/id) must be a positive number' });
    }

    // Discover real columns in eventdetails
    const meta = await pickCols(EVENTS_TABLE);

    // Build select list with safe fallbacks
    const selectList = [
      meta.hasId   ? 'e.id AS id'                           : 'NULL AS id',
      meta.titleCol? `e.\`${meta.titleCol}\` AS title`      : `'Untitled Event' AS title`,
      meta.locCol  ? `e.\`${meta.locCol}\` AS location`     : 'NULL AS location',
      meta.descCol ? `e.\`${meta.descCol}\` AS description` : 'NULL AS description',
      meta.dateCol ? `e.\`${meta.dateCol}\` AS start_time`  : 'NULL AS start_time'
    ].join(', ');

    // Date filter only if we found a date column
    const dateWhere = meta.dateCol ? `AND e.\`${meta.dateCol}\` >= CURDATE()` : '';
    const dateOrder = meta.dateCol ? `ORDER BY e.\`${meta.dateCol}\` ASC`     : 'ORDER BY e.id ASC';

    const sql = `
      SELECT ${selectList}
      FROM \`${EVENTS_TABLE}\` e
      INNER JOIN \`${ASSIGN_TABLE}\` a ON a.event_id = e.id
      WHERE a.volunteer_id = ?
      ${dateWhere}
      ${dateOrder}
    `;

    const [rows] = await db.promise().query(sql, [volunteerId]);
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    // Log full MySQL error for debugging
    console.error('GET /upcomingevents/assigned error:', {
      code: err.code, errno: err.errno, sqlState: err.sqlState, sqlMessage: err.sqlMessage
    });
    return res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;
