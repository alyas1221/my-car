const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../utils/db');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, password, password2, address } = req.body;
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).send('همه فیلدهای اجباری را پر کنید');
    }
    if (password !== password2) {
      return res.status(400).send('رمز عبور و تکرار آن یکسان نیست');
    }
    if (!/^09\d{9}$/.test(phone)) {
      return res.status(400).send('شماره تماس نامعتبر است (مثال: 09123456789)');
    }
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).send('این شماره قبلا ثبت نام کرده است');
    }
    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare('INSERT INTO users (first_name, last_name, phone, password_hash, address, role) VALUES (?,?,?,?,?,?)')
      .run(firstName, lastName, phone, hash, address || null, 'user');
    const userId = info.lastInsertRowid;

    const { vehicleType, vehicleModel, vehicleYear, plate, initialKm } = req.body;
    if (vehicleType && vehicleModel) {
      db.prepare('INSERT INTO vehicles (user_id, type, model, year, plate, initial_km) VALUES (?,?,?,?,?,?)')
        .run(userId, vehicleType, vehicleModel, vehicleYear || null, plate || null, parseInt(initialKm) || 0);
    }
    res.redirect('/login?registered=1');
  } catch (err) {
    console.error('[AUTH] register error:', err);
    res.status(500).send('خطا در ثبت نام');
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('نام کاربری و رمز عبور الزامی است');
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(username);
    if (!user) return res.status(400).send('کاربر یافت نشد');
    if (!user.is_active) return res.status(403).send('حساب غیرفعال است');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).send('رمز عبور اشتباه است');
    req.session.user = { id: user.id, firstName: user.first_name, lastName: user.last_name, role: user.role };
    res.redirect('/dashboard');
  } catch (err) {
    console.error('[AUTH] login error:', err);
    res.status(500).send('خطا در ورود');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
