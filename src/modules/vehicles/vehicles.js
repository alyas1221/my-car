const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../../utils/db');
const requireAuth = require('../../utils/requireAuth');
const router = express.Router();

// Storage for vehicle photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === 'plate_photo'
      ? path.join(__dirname, '../../../public/uploads/plates')
      : path.join(__dirname, '../../../public/uploads/vehicles');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// List page
router.get('/', requireAuth, (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE user_id = ? ORDER BY id DESC').all(req.session.user.id);
  res.render('vehicles', { user: req.session.user, vehicles });
});

// Add vehicle
router.post('/add', requireAuth, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'plate_photo', maxCount: 1 }]), (req, res) => {
  try {
    const { type, model, year, plate, initial_km, insurance_status } = req.body;
    const photo = req.files?.photo?.[0]?.filename || null;
    const plate_photo = req.files?.plate_photo?.[0]?.filename || null;
    db.prepare('INSERT INTO vehicles (user_id, type, model, year, plate, plate_photo, photo, initial_km, insurance_status) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(req.session.user.id, type || 'car', model || '', year || null, plate || null, plate_photo, photo, parseInt(initial_km) || 0, insurance_status || null);
    res.redirect('/vehicles');
  } catch (err) {
    console.error('[VEHICLES] add error:', err);
    res.status(500).send('خطا در ثبت خودرو');
  }
});

module.exports = router;
