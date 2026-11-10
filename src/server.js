// My-Car - Main Server
// Version: 0.5.0

const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8'));
const mod = require('./utils/moderation');

// ---------- Database ----------
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', config.database.path);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT);
  INSERT OR IGNORE INTO _meta (key, value) VALUES ('version', '0.5.0');
`);
console.log('[DB] connected:', dbPath);

// ---------- App (port 4441) ----------
const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, '../database') }),
  secret: config.security.jwt_secret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
}));

app.use(express.static(path.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: config.app.version, time: new Date().toISOString() });
});

// Modules
const authRoutes = require('./modules/auth/auth');
const vehiclesRoutes = require('./modules/vehicles/vehicles');
const servicesRoutes = require('./modules/services/services');
const socialRoutes = require('./modules/social/social');
const chatRoutes = require('./modules/chat/chat');
app.use('/auth', authRoutes);
app.use('/vehicles', vehiclesRoutes);
app.use('/services', servicesRoutes);
app.use('/social', socialRoutes);
app.use('/forum', chatRoutes);
const profileRoutes = require('./modules/auth/profile');
app.use('/profile', profileRoutes);
const adminRoutes = require('./modules/admin/admin');
app.use('/admin', adminRoutes);
const violationsRoutes = require('./modules/violations/violations');
app.use('/violations', violationsRoutes);

const requireAuth = require('./utils/requireAuth');
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});
app.get('/login', (req, res) => { res.render('login'); });
app.get('/register', (req, res) => { res.render('register'); });
app.get('/', (req, res) => {
  res.send('<html><body style="font-family:tahoma;direction:rtl;text-align:center;padding:40px"><h2>My-Car</h2><p>Server is running (v0.5.0)</p><p><a href="/login">ورود</a> | <a href="/register">ثبت نام</a></p></body></html>');
});

// ---------- WebSocket (port 4442) ----------
const wsHttp = http.createServer();
const io = new Server(wsHttp, { cors: { origin: '*' } });
let onlineUsers = {};

io.on('connection', (socket) => {
  console.log('[WS] connected:', socket.id);

  socket.on('user:join', (user) => {
    onlineUsers[socket.id] = { id: socket.id, name: user.name || 'Unknown', role: user.role || 'user' };
    io.emit('users:online', Object.values(onlineUsers));
  });

  socket.on('room:join', ({ roomId }) => {
    socket.join('room-' + roomId);
  });

  socket.on('room:message', (m) => {
    const u = onlineUsers[socket.id] || { name: 'Guest', role: 'user' };
    const chk = mod.check(m.text, u.role);
    if (!chk.allowed) {
      socket.emit('moderation:blocked', { reason: chk.reason });
      return;
    }
    io.to('room-' + m.roomId).emit('room:message', { roomId: m.roomId, name: u.name, text: m.text, time: Date.now() });
  });

  socket.on('chat:message', (msg) => {
    io.emit('chat:message', { user: onlineUsers[socket.id]?.name || 'Guest', text: msg.text, time: Date.now() });
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];
    io.emit('users:online', Object.values(onlineUsers));
  });
});

// ---------- Start ----------
const APP_PORT = config.app.port_app;
const WS_PORT = config.app.port_ws;

app.listen(APP_PORT, '0.0.0.0', () => {
  console.log('[APP] listening on http://0.0.0.0:' + APP_PORT);
});
wsHttp.listen(WS_PORT, '0.0.0.0', () => {
  console.log('[WS ] listening on ws://0.0.0.0:' + WS_PORT);
});

process.on('SIGINT', () => { console.log('Shutting down'); db.close(); process.exit(0); });
