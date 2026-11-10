// My-Car Moderation Utility
// Blocks phone numbers, links, bad words, and tricks (spacing/dots between letters)
const fs = require('fs');
const path = require('path');

// Load blocked words list (can be edited by admin)
let blockedWords = [];
try {
  const p = path.join(__dirname, '../../config/blocked-words.json');
  if (fs.existsSync(p)) blockedWords = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) { console.error('[MOD] blocked-words load error:', e.message); }

// Persian/Arabic digits mapping
const DIGIT_MAP = {
  '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
  '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
};

function normalize(text) {
  if (!text) return '';
  let s = String(text);
  for (const [fa, en] of Object.entries(DIGIT_MAP)) s = s.split(fa).join(en);
  // remove zero-width chars
  s = s.replace(/[\u200c\u200d\u200e\u200f]/g, '');
  return s;
}

// Detect phone numbers (Iranian mobile 09xxxxxxxxx or landline 0xx...)
function detectPhone(text) {
  const s = normalize(text).replace(/[\s\-\(\)\.]/g, '');
  // 09xxxxxxxxx or +989xxxxxxxxx or 00989...
  const mobile = /(?:\+?98|0)?9\d{9}/;
  const landline = /0\d{2,3}\d{7,8}/;
  if (mobile.test(s)) return true;
  if (landline.test(s)) return true;
  return false;
}

// Detect links
function detectLink(text) {
  const s = normalize(text).toLowerCase();
  const patterns = [
    /https?:\/\//i, /www\./i, /t\.me\//i, /telegram\./i, /instagram\./i,
    /wa\.me\//i, /whatsapp/i, /\.ir\b/i, /\.com\b/i, /\.net\b/i, /\.org\b/i,
    /bit\.ly/i, /goo\.gl/i, /youtu/i, /aparat/i
  ];
  return patterns.some(p => p.test(s));
}

// Detect bad words - with anti-trick (strip non-letters)
function detectBadWord(text) {
  if (!blockedWords.length) return false;
  const s = normalize(text).toLowerCase();
  // remove spaces, dots, dashes, underscores between chars
  const compact = s.replace(/[\s\.\-\_\!\?\*\#\@\،\,]/g, '');
  return blockedWords.some(w => {
    const wc = normalize(w).toLowerCase().replace(/[\s\.\-\_]/g, '');
    return wc && (s.includes(w) || compact.includes(wc));
  });
}

// Combine check
function check(text, userRole) {
  // super_admin bypass
  if (userRole === 'super_admin') return { allowed: true };
  const s = String(text || '');
  if (!s.trim()) return { allowed: true };
  if (detectLink(s)) return { allowed: false, reason: 'link' };
  if (detectPhone(s)) return { allowed: false, reason: 'phone' };
  if (detectBadWord(s)) return { allowed: false, reason: 'badword' };
  return { allowed: true };
}

module.exports = { check, detectPhone, detectLink, detectBadWord, normalize };
