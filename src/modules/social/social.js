const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const mod = require('../../utils/moderation');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../public/uploads/posts')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const posts = db.prepare(`
    SELECT p.*, u.first_name, u.last_name,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) AS comments_count,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS liked
    FROM posts p JOIN users u ON u.id = p.user_id
    ORDER BY p.id DESC LIMIT 50
  `).all(userId);
  posts.forEach(p => {
    p.liked = !!p.liked;
    p.comments = db.prepare('SELECT c.*, u.first_name FROM post_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.id ASC').all(p.id);
  });
  res.render('social', { user: req.session.user, posts });
});

router.post('/post', requireAuth, upload.single('image'), (req, res) => {
  try {
    const image = req.file?.filename || null;
    const caption = req.body.caption || null;
    const chk = mod.check(caption, req.session.user.role);
    if (!chk.allowed) {
      db.prepare('INSERT INTO moderation_logs (user_id, user_phone, content, reason) VALUES (?,?,?,?)').run(req.session.user.id, null, caption, chk.reason);
      return res.status(403).send('محتوای شما مجاز نیست: ' + chk.reason);
    }
    db.prepare('INSERT INTO posts (user_id, image, caption) VALUES (?,?,?)').run(req.session.user.id, image, caption);
    res.redirect('/social');
  } catch (err) {
    console.error('[SOCIAL] post error:', err);
    res.status(500).send('خطا در انتشار پست');
  }
});

router.post('/like/:id', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.session.user.id;
  const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?').get(postId, userId);
  if (existing) {
    db.prepare('DELETE FROM post_likes WHERE id = ?').run(existing.id);
  } else {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)').run(postId, userId);
  }
  const count = db.prepare('SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?').get(postId).c;
  res.json({ count });
});

router.post('/comment/:id', requireAuth, (req, res) => {
  const postId = parseInt(req.params.id);
  const text = (req.body.text || '').toString().trim();
  if (!text) return res.status(400).json({ error: 'empty' });
  const chk = mod.check(text, req.session.user.role);
  if (!chk.allowed) {
    db.prepare('INSERT INTO moderation_logs (user_id, user_phone, content, reason) VALUES (?,?,?,?)').run(req.session.user.id, null, text, chk.reason);
    return res.status(403).json({ error: 'blocked', reason: chk.reason });
  }
  db.prepare('INSERT INTO post_comments (post_id, user_id, text) VALUES (?,?,?)').run(postId, req.session.user.id, text);
  res.json({ ok: true });
});

module.exports = router;
