const express = require('express');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const router = express.Router();

// List services for user's vehicles
router.get('/', requireAuth, (req, res) => {
  const vehicles = db.prepare('SELECT id, model, plate FROM vehicles WHERE user_id = ?').all(req.session.user.id);
  const services = db.prepare(`
    SELECT s.*, v.model || ' - ' || COALESCE(v.plate, '') AS vehicle_name
    FROM services s
    JOIN vehicles v ON v.id = s.vehicle_id
    WHERE v.user_id = ?
    ORDER BY s.id DESC
  `).all(req.session.user.id);
  res.render('services', { user: req.session.user, vehicles, services });
});

// Add service
router.post('/add', requireAuth, (req, res) => {
  try {
    const { vehicle_id, service_type, km, service_date, cost, description } = req.body;
    // verify vehicle belongs to user
    const v = db.prepare('SELECT id FROM vehicles WHERE id = ? AND user_id = ?').get(vehicle_id, req.session.user.id);
    if (!v) return res.status(403).send('دسترسی غیرمجاز');
    db.prepare('INSERT INTO services (vehicle_id, mechanic_id, service_type, description, km, service_date, cost) VALUES (?,?,?,?,?,?,?)')
      .run(vehicle_id, req.session.user.id, service_type, description || null, parseInt(km) || 0, service_date || null, parseInt(cost) || 0);
    res.redirect('/services');
  } catch (err) {
    console.error('[SERVICES] add error:', err);
    res.status(500).send('خطا در ثبت سرویس');
  }
});

module.exports = router;
