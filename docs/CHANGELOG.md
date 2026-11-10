# CHANGELOG - My-Car Project

> This file records every change line by line, version by version.

## Base Info

| Item | Value |
|------|-------|
| Project Name | My-Car |
| Project Path | /opt/my-scripts/my-car |
| Server IP | 62.11.22.207 |
| App Port | 4441 |
| WS/API Port | 4442 |
| Run User | dedhban |
| OS | Ubuntu 24.04.5 LTS |
| Node.js | v18.19.1 |
| NPM | 9.2.0 |
| Default DB | SQLite (internal) |
| Future DB | PostgreSQL / MySQL |

## User Roles (5)

1. super_admin - full access, backup, global settings
2. admin - user/content/forum management
3. mechanic - register services, view vehicle records
4. user - register, add vehicles, posts, chat
5. guest - view only

## Folder Structure

```
/opt/my-scripts/my-car/
  docs/       - this file
  backups/    - project backups
  config/     - config files
  database/   - SQLite DB
  src/        - modules/routes/models/utils
  public/     - css/js/uploads (vehicles,plates,posts,avatars)
```

## Version History

### v0.1.0 - 2026-11-10

**Title:** Initial project structure

**Commands:**

```bash
mkdir -p /opt/my-scripts/my-car/{docs,backups,config,database,src/modules/{auth,vehicles,services,social,chat,admin,ocr},src/routes,src/models,src/utils,public/{css,js,uploads/vehicles,uploads/plates,uploads/posts,uploads/avatars}}
```

**Changes:** 25 folders created, CHANGELOG initialized.

**Status:** Stable

---

## UI Design Rules (IMPORTANT)

- Persian RTL layout, small and clean typography
- Small buttons, compact spacing, NO large elements
- No pointless scrollbars, no empty white space
- Responsive on both desktop and mobile
- Consistent Persian font (Vazirmatn)
- Small icons, subtle colors, professional look
- All pages must be mobile-friendly

### v0.2.0 - 2026-11-10

**Title:** Nginx config for car.dedhban.ir + UI rules added

**Commands:**

```bash
# Backup nginx configs
sudo mkdir -p backups/nginx-YYYYMMDD-HHMM
sudo cp -r /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/nginx.conf backups/nginx-YYYYMMDD-HHMM/

# Rewrote /etc/nginx/sites-available/car.dedhban.ir
# - HTTP -> HTTPS redirect
# - SSL Let's Encrypt
# - Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
# - client_max_body_size 15M for photo uploads
# - /socket.io/ -> ws://62.11.22.207:4442 (WebSocket)
# - / -> http://62.11.22.207:4441 (main app)
```

**Changes:**
- Nginx config rewritten and tested (OK)
- Backup saved under backups/nginx-20261110-2204
- UI design rules documented

**Pending:** reload nginx after app starts on port 4441

**Status:** Config valid, not reloaded yet

### v0.4.0 - 2026-11-10

**Title:** Session persistence + auth flow + dashboard

**New files:**
- src/utils/db.js - SQLite schema (users, vehicles, services, posts, likes, comments, chat_rooms, chat_messages)
- src/utils/requireAuth.js - middleware
- src/modules/auth/auth.js - register/login/logout
- public/views/login.ejs
- public/views/register.ejs
- public/views/dashboard.ejs
- public/css/style.css (Vazirmatn font, small compact UI)
- database/sessions.db (persistent sessions)

**Tests passed:**
- Register with user+vehicle -> bcrypt hash in DB
- Login -> session cookie
- Dashboard requires auth (302 vs 200)
- Session persists after PM2 restart (SQLite store)

**Status:** Stable

---

## Project Rules & Future Plans (IMPORTANT)

### Rule 1 - CHANGELOG as Communication Bridge

This file (CHANGELOG.md) is the SINGLE SOURCE OF TRUTH between the
developer (owner) and the AI assistant across different chat sessions.

- Every command executed must be recorded here line by line.
- Every new feature / file / decision must be documented.
- If a new chat session starts, the AI MUST read this file first.
- Current phase, pending tasks, and known issues must always be at bottom.
- Version header must be bumped on every significant change.

### Rule 2 - UI Design (repeated)

- Persian RTL, small (12-13px base), compact, no giant elements
- No pointless scrollbars, no empty white space
- Responsive: must work on desktop browser AND mobile browser
- Vazirmatn font from CDN
- Small buttons (padding 6px 14px), small inputs (padding 7px 10px)

### Rule 3 - Future: Mobile APK

At project completion, we must also:
- Build a mobile APK (Android) for the My-Car app
- Provide automatic installation instructions (install script)
- Either use Capacitor/Cordova wrap of the web app, or a native Kotlin/Flutter app
- APK must support: login, vehicles, services, social, forum, chat
- APK build must be reproducible from this repo

### Rule 4 - Backup Folder

- backups/ folder contains project backups (tar.gz) at milestones
- Admin panel must provide a backup button (generate tar.gz)
- DB backup must be included (SQLite file + sessions.db)

### Rule 5 - Auth Roles (5 roles)

- super_admin, admin, mechanic, user, guest
- Login page must let super_admin login from same page (role detection)
- Admin panel: every feature can be toggled ON/OFF from config.json

### Rule 6 - Database

- Default: internal SQLite (database/app.db)
- Later: ability to connect PostgreSQL/MySQL for external DB
- Schema must be migrated, not recreated, when adding tables

---

**Current Phase:** v0.4.0 done - dashboard with menu + online users

**Next Steps (pending):**
- [ ] /vehicles page (add vehicle, photo upload, plate OCR)
- [ ] /services page (log services with Jalali date)
- [ ] /social page (posts, likes, comments, emoji)
- [ ] /forum page (rooms, chat)
- [ ] /profile page (edit info, avatar)
- [ ] /admin page (toggle features, backup, users)
- [ ] Chat with socket.io (rooms)
- [ ] Jalali date picker (scrollable)
- [ ] Plate OCR (photo -> text)
- [ ] APK build (end of project)

**Status:** Stable, ready for /vehicles

### Rule 7 - Content Moderation & Ads Control (CRITICAL)

All user-generated content must pass through the moderation layer:

- Detect and BLOCK phone numbers (Persian/Arabic digits + English)
- Detect and BLOCK URLs and links
- Detect and BLOCK offensive/prohibited words (custom list)
- Detect tricks: words separated by spaces/dots/numbers (e.g. ع.ل.ی or ali123)
- Login must be strict (phone format + password strength + rate limit)
- Only super_admin can: post ads, insert banner, share links or phone numbers
- Admin can toggle moderation rules from config.json
- A moderation log must be saved (who tried, what, when)

### Rule 8 - Ads Banner (only super_admin)

- A banner slot at top of chat rooms and forum
- Only super_admin can set the banner text/image/link from /admin
- Other roles: no banner, no links, no phone numbers

**Status:** Rule added, implementation pending

### v0.5.0 - 2026-11-10

**Title:** Content moderation + vehicles + services + social + forum

**New files:**
- src/utils/moderation.js - phone/link/badword detector (with anti-trick)
- config/blocked-words.json - blocked words list
- src/modules/vehicles/vehicles.js - add vehicle with photo upload
- src/modules/services/services.js - log services
- src/modules/social/social.js - posts + likes + comments
- src/modules/chat/chat.js - forum rooms
- public/views/vehicles.ejs, services.ejs, social.ejs, forum.ejs, room.ejs
- database/sessions.db (persistent sessions)
- moderation_logs table

**Tests passed:**
- /vehicles 200, add vehicle with photo -> DB + uploads/vehicles/
- /services 200, add service -> DB
- /social 200, add post with image -> DB + uploads/posts/
- /forum 200, create room -> DB
- Moderation: phone 403, link 403, clean 200
- Moderation logs saved in DB

**Known issue:**
- socket.io room:message moderation works, but chat rooms page needs banner

**Status:** Stable

### Rule 9 - Traffic Violation Inquiry (تخلفات)

- Any user can submit a violation inquiry for their vehicle
- User selects plate type (car/motorcycle) + enters plate
- Request goes to admin panel with status=pending
- Admin checks (offline with real police system) and records result
- Result shown to user in /violations after 24h (or sooner)
- Status flow: pending -> answered -> (user sees result)
- Only admin/super_admin can answer

**Status:** Rule added, implementation now

### v0.6.0 - 2026-11-10

**Title:** Violation inquiry + admin panel + profile

**New files:**
- src/modules/admin/admin.js - admin panel (banner, toggle, users, logs, backup)
- src/modules/admin/ - violation answer routes
- src/modules/violations/violations.js - user violation request
- src/modules/auth/profile.js - profile edit + password change
- public/views/admin.ejs, admin_users.ejs, admin_logs.ejs, admin_violations.ejs
- public/views/violations.ejs, profile.ejs
- violation_requests table

**Tests passed:**
- /violations 200 (user side)
- Submit violation request -> status=pending
- /admin/violations 200 (admin side)
- Admin answer -> status=answered + result
- /admin 200 (panel)
- /admin/users 200
- /admin/logs 200
- /admin/backup (tar.gz)
- /profile 200 (edit + password)

**Status:** Stable, ready for banner + APK

### v0.7.0 - 2026-11-10

**Title:** APK infrastructure (Capacitor v5 + build scripts)

**New files:**
- capacitor.config.json - appId ir.dedhban.mycar, server.url=https://car.dedhban.ir
- android/ - Capacitor Android platform
- scripts/build-apk.sh - one-shot APK builder
- docs/APK-GUIDE.md - APK build instructions (3 methods)
- .github/workflows/build-apk.yml - free cloud build
- config/banner.json - banner text/link

**Capacitor:** v5.7.8 (Node 18 compatible)

**Server resources (WARNING):**
- RAM: 11GB total, 7.3GB used, 410MB free (LOW)
- Disk: 19GB free of 116GB (84% used)
- APK build on server RISKY (needs 3GB RAM + 3GB disk)
- Recommended: build APK on local machine or GitHub Actions

**Status:** APK scaffolding ready, actual build pending decision

### v0.9.0 (APK Final Decision) - 2026-11-10

**Decision:** Do NOT install Android SDK on this server (RAM 410MB free, OOM risk).
**Approach:** APK built on local machine or GitHub Actions.

**Files:**
- apk-builder/export-to-local.sh - export project as tar.gz for local build
- apk-builder/configure.sh - safe SDK check (no forced install)

**How to build APK (local):**
1. Run: /opt/my-scripts/apk-builder/export-to-local.sh my-car
2. SCP /tmp/my-car-for-apk.tar.gz to your computer
3. Extract, npm install, npx cap sync, gradlew assembleDebug
4. APK: android/app/build/outputs/apk/debug/app-debug.apk

**Status:** Ready. Build on local machine or GitHub Actions.

### Rule 10 - Simple Guide for Non-Technical Tasks (IMPORTANT)

The owner is not a developer and does not know terminal commands for APK.
Every non-trivial task (APK, DB, deployment) must have a plain-language guide in docs/.

- Step-by-step with screenshots (text description)
- Copy-paste ready commands (no placeholders like <your-name>)
- Alternatives if something fails
- Owner can ask AI in chat for each step

**Status:** Rule added
