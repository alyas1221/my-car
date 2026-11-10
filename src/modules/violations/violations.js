const express = require('express');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const mod = require('../../utils/moderation');
const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const requests = db.prepare('SELECT * FROM violation_requests WHERE user_id = ? ORDER BY id DESC').all(req.session.user.id);
  res.render('violations', { user: req.session.user, requests });
});

router.post('/add', requireAuth, (req, res) => {
  const plateType = req.body.plate_type === 'motorcycle' ? 'motorcycle' : 'car';
  const plate = (req.body.plate || '').toString().trim();
  if (!plate) return res.status(400).send('پلاک الزامی است');
  const chk = mod.check(plate, req.session.user.role);
  if (!chk.allowed) {
    db.prepare('INSERT INTO moderation_logs (user_id, user_phone, content, reason) VALUES (?,?,?,?)').run(req.session.user.id, null, plate, chk.reason);
    return res.status(403).send('پلاک نامعتبر');
  }
  db.prepare('INSERT INTO violation_requests (user_id, plate_type, plate) VALUES (?,?,?)').run(req.session.user.id, plateType, plate);
  res.redirect('/violations');
});

module.exports = router;
