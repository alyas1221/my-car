const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const router = express.Router();

const configPath = path.join(__dirname, '../../../config/config.json');
const bannerPath = path.join(__dirname, '../../../config/banner.json');

function loadConfig() { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
function saveConfig(c) { fs.writeFileSync(configPath, JSON.stringify(c, null, 2)); }

function loadBanner() {
  if (!fs.existsSync(bannerPath)) return { text: '', link: '' };
  return JSON.parse(fs.readFileSync(bannerPath, 'utf8'));
}

function requireAdmin(req, res, next) {
  if (!['admin', 'super_admin'].includes(req.session.user.role)) {
    return res.status(403).send('دسترسی ممنوع');
  }
  next();
}

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const config = loadConfig();
  const stats = {
    users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
    vehicles: db.prepare('SELECT COUNT(*) AS c FROM vehicles').get().c,
    services: db.prepare('SELECT COUNT(*) AS c FROM services').get().c,
    posts: db.prepare('SELECT COUNT(*) AS c FROM posts').get().c,
    messages: db.prepare('SELECT COUNT(*) AS c FROM chat_messages').get().c,
    logs: db.prepare('SELECT COUNT(*) AS c FROM moderation_logs').get().c,
  };
  res.render('admin', { user: req.session.user, features: config.features, banner: loadBanner(), stats });
});

router.post('/banner', requireAuth, requireAdmin, (req, res) => {
  if (req.session.user.role !== 'super_admin') return res.status(403).send('فقط مدیر ارشد');
  fs.writeFileSync(bannerPath, JSON.stringify({ text: req.body.text || '', link: req.body.link || '' }, null, 2));
  res.redirect('/admin');
});

router.post('/toggle', requireAuth, requireAdmin, (req, res) => {
  const config = loadConfig();
  const key = req.body.key;
  if (config.features[key] !== undefined) {
    config.features[key] = !config.features[key];
    saveConfig(config);
  }
  res.redirect('/admin');
});

router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, first_name, last_name, phone, role FROM users ORDER BY id DESC').all();
  res.render('admin_users', { user: req.session.user, users });
});

router.post('/user/role', requireAuth, requireAdmin, (req, res) => {
  if (req.session.user.role !== 'super_admin') return res.status(403).send('فقط مدیر ارشد');
  db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, req.body.user_id);
  res.redirect('/admin/users');
});

router.get('/logs', requireAuth, requireAdmin, (req, res) => {
  const logs = db.prepare('SELECT * FROM moderation_logs ORDER BY id DESC LIMIT 200').all();
  res.render('admin_logs', { user: req.session.user, logs });
});

router.get('/backup', requireAuth, requireAdmin, (req, res) => {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = 'my-car-backup-' + ts + '.tar.gz';
    const outFile = path.join(__dirname, '../../../backups', fileName);
    const projectDir = path.join(__dirname, '../../..');
    execSync(`tar -czf ${outFile} -C ${projectDir} --exclude=node_modules --exclude=backups .`);
    res.json({ ok: true, file: fileName, path: outFile });
  } catch (err) {
    console.error('[ADMIN] backup error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

// Violation requests list
router.get('/violations', requireAuth, requireAdmin, (req, res) => {
  const requests = db.prepare(`
    SELECT r.*, u.first_name, u.last_name
    FROM violation_requests r JOIN users u ON u.id = r.user_id
    ORDER BY r.id DESC LIMIT 200
  `).all();
  res.render('admin_violations', { user: req.session.user, requests });
});

// Answer a violation request
router.post('/violations/answer', requireAuth, requireAdmin, (req, res) => {
  const { id, result } = req.body;
  if (!id || !result) return res.status(400).send('نتیجه الزامی است');
  db.prepare("UPDATE violation_requests SET status='answered', result=?, answered_by=?, answered_at=datetime('now') WHERE id=?")
    .run(result, req.session.user.id, id);
  res.redirect('/admin/violations');
});
