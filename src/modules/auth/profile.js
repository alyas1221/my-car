const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../public/uploads/avatars')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  res.render('profile', { user: req.session.user, profile });
});

router.post('/update', requireAuth, upload.single('avatar'), (req, res) => {
  const { firstName, lastName, address } = req.body;
  const avatar = req.file?.filename || null;
  if (avatar) {
    db.prepare('UPDATE users SET first_name=?, last_name=?, address=?, avatar=? WHERE id=?').run(firstName, lastName, address || null, avatar, req.session.user.id);
  } else {
    db.prepare('UPDATE users SET first_name=?, last_name=?, address=? WHERE id=?').run(firstName, lastName, address || null, req.session.user.id);
  }
  req.session.user.firstName = firstName;
  req.session.user.lastName = lastName;
  res.redirect('/profile');
});

router.post('/password', requireAuth, async (req, res) => {
  const { current, newpass, newpass2 } = req.body;
  if (newpass !== newpass2) return res.status(400).send('رمز جدید و تکرار آن یکسان نیست');
  if (newpass.length < 6) return res.status(400).send('رمز جدید حداقل ۶ کاراکتر');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) return res.status(400).send('رمز فعلی اشتباه است');
  const hash = await bcrypt.hash(newpass, 10);
  db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, req.session.user.id);
  res.redirect('/profile');
});

module.exports = router;
