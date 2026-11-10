const express = require('express');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const router = express.Router();

// List rooms
router.get('/', requireAuth, (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, (SELECT COUNT(*) FROM chat_messages WHERE room_id = r.id) AS msg_count
    FROM chat_rooms r ORDER BY r.id DESC
  `).all();
  const banner = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../../../config/banner.json'), 'utf8'));
  res.render('forum', { user: req.session.user, rooms, banner });
});

// Create room
router.post('/room', requireAuth, (req, res) => {
  const name = (req.body.name || '').toString().trim();
  if (!name) return res.status(400).send('نام اتاق الزامی است');
  db.prepare('INSERT INTO chat_rooms (name, created_by) VALUES (?,?)').run(name, req.session.user.id);
  res.redirect('/forum');
});

// Show room
router.get('/room/:id', requireAuth, (req, res) => {
  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).send('اتاق یافت نشد');
  const messages = db.prepare(`
    SELECT m.*, u.first_name FROM chat_messages m JOIN users u ON u.id = m.user_id
    WHERE m.room_id = ? ORDER BY m.id ASC LIMIT 200
  `).all(room.id);
  res.render('room', { user: req.session.user, room, messages });
});

module.exports = router;
