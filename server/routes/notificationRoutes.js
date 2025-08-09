const express = require('express');
const router = express.Router();

const notifications = [
  { id: '1', message: "📢 You have been assigned to 'Health Camp'" },
  { id: '2', message: "⏰ Reminder: 'Food Drive' starts tomorrow" },
  { id: '3', message: "⚠️ Location changed for 'Education Fair'" }
];
//notifications
router.get('/', (req, res) => {
  res.json(notifications);
});

module.exports = router;
