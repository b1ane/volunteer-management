function validateEvent(req, res, next) {
  const { name, location, urgency, requiredSkills, details } = req.body;
  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ message: 'Name is required, must be a string, and max 100 chars.' });
  }
  if (!location || typeof location !== 'string' || location.length > 100) {
    return res.status(400).json({ message: 'Location is required, must be a string, and max 100 chars.' });
  }
  if (!urgency || !['low', 'medium', 'high'].includes(urgency)) {
    return res.status(400).json({ message: 'Urgency is required and must be one of: low, medium, high.' });
  }
  if (!Array.isArray(requiredSkills) || requiredSkills.length < 1 || !requiredSkills.every(s => typeof s === 'string')) {
    return res.status(400).json({ message: 'requiredSkills is required and must be an array of at least one string.' });
  }
  if (details && (typeof details !== 'string' || details.length > 500)) {
    return res.status(400).json({ message: 'Details must be a string and max 500 chars.' });
  }
  next();
}

module.exports = { validateEvent }; 