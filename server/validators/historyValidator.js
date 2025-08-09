function isValidDate(str) {
  return !isNaN(Date.parse(str));
}

function validateHistory(req, res, next) {
  const { volunteerId, eventId, date, hours, role, notes } = req.body;
  if (!volunteerId || typeof volunteerId !== 'string') {
    return res.status(400).json({ message: 'volunteerId is required and must be a string.' });
  }
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ message: 'eventId is required and must be a string.' });
  }
  if (!date || typeof date !== 'string' || !isValidDate(date)) {
    return res.status(400).json({ message: 'date is required and must be a valid date string.' });
  }
  if (typeof hours !== 'number' || hours < 0.5 || hours > 24) {
    return res.status(400).json({ message: 'hours is required and must be a number between 0.5 and 24.' });
  }
  if (!role || typeof role !== 'string' || role.length > 50) {
    return res.status(400).json({ message: 'role is required, must be a string, and max 50 chars.' });
  }
  if (notes && (typeof notes !== 'string' || notes.length > 200)) {
    return res.status(400).json({ message: 'notes must be a string and max 200 chars.' });
  }
  next();
}

module.exports = { validateHistory }; 