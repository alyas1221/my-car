# 📱 راهنمای ساده ساخت APK برای My-Car

> **مخاطب:** صاحب پروژه (بدون دانش برنامه‌نویسی)
> **هدف:** ساخت فایل APK برای نصب روی گوشی اندروید
> **زمان تقریبی:** ۲۰ دقیقه

---

## 🎯 کدام روش را انتخاب کنم؟

| روش | سختی | نیاز | زمان |
|------|--------|------|------|
| **روش ۱: GitHub Actions** | ⭐ آسان | فقط اکانت GitHub | ۵ دقیقه |
| **روش ۲: سیستم شخصی (Android Studio)** | ⭐⭐⭐ سخت | ۸GB رم، ۲۰GB دیسک | ۳۰ دقیقه |
| **روش ۳: اجاره موقت** | ⭐⭐ متوسط | کارت اعتباری | ۱۰ دقیقه |

**پیشنهاد من: روش ۱ (GitHub Actions)** چون رایگان است، سریع است، و هیچ چیز روی کامپیوتر شما نصب نمی‌شود.

---

## 🟢 روش ۱: GitHub Actions (توصیه‌شده)

### قدم ۱: ساخت اکانت GitHub
1. برو به https://github.com
2. روی Sign up کلیک کن
3. با ایمیل و رمز ثبت‌نام کن

### قدم ۲: ساخت مخزن (Repository) جدید
1. بعد از ورود، روی + بالای صفحه کلیک کن > New repository
2. اسم: `my-car`
3. Public یا Private (هر دو OK)
4. تیک `Add a README file` را بزن
5. Create repository

### قدم ۳: آپلود فایل‌های پروژه به GitHub

**دو راه دارید:**

**راه الف: با مرورگر (ساده‌تر)**
1. در صفحه مخزن، روی `Add file` > `Upload files` کلیک کن
2. فایل `/tmp/my-car-for-apk.tar.gz` را از سرور دانلود کن (با WinSCP یا FileZilla)
3. فایل را از حالت فشرده خارج کن (Right-click > Extract)
4. پوشه `android`، `package.json`، `capacitor.config.json` و پوشه `src` را آپلود کن
5. Commit changes

**راه ب: با دستور (برای بعداً)**
```bash
# از سرور اجرا کن (نیاز به تنظیم SSH به GitHub)
cd /opt/my-scripts/my-car
git init
git add .
git commit -m "Initial"
git remote add origin https://github.com/YOUR-USERNAME/my-car.git
git push -u origin main
```

### قدم ۴: فایل workflow را اضافه کن
1. در مخزن، روی `Add file` > `Create new file` کلیک کن
2. مسیر: `.github/workflows/build-apk.yml`
3. محتوای فایل را از اینجا کپی کن:
```
name: Build APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - run: npm install
      - run: npx cap sync android
      - run: cd android && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: my-car-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```
4. Commit changes

### قدم ۵: APK را دانلود کن
1. به تب `Actions` در مخزن برو
2. آخرین اجرا را کلیک کن
3. در بخش `Artifacts`، فایل `my-car-apk` را دانلود کن
4. فایل ZIP را باز کن > فایل `app-debug.apk` را روی گوشی نصب کن

---

## 🟡 روش ۲: سیستم شخصی

### پیش‌نیاز
1. Windows / Mac / Linux
2. حداقل ۸GB رم، ۲۰GB دیسک آزاد

### قدم ۱: نصب Android Studio
1. برو به https://developer.android.com/studio
2. دانلود و نصب کن (Next > Next > Finish)
3. اولین بار باز شدن، SDK دانلود می‌شود (~۳GB)

### قدم ۲: دانلود پروژه از سرور
1. با WinSCP یا FileZilla به سرور وصل شو
2. فایل `/tmp/my-car-for-apk.tar.gz` را دانلود کن
3. روی سیستم خودت از حالت فشرده خارج کن

### قدم ۳: نصب Node.js
1. برو به https://nodejs.org
2. نسخه ۱۸ LTS را دانلود و نصب کن

### قدم ۴: ساخت APK
1. Command Prompt یا Terminal را باز کن
2. به پوشه پروژه برو:
```
cd C:\Users\YourName\Downloads\my-car
```
3. این دستورات را یکی‌یکی اجرا کن:
```
npm install @capacitor/core@5 @capacitor/cli@5 @capacitor/android@5
npx cap sync android
cd android
gradlew assembleDebug
```
4. APK در مسیر `android\app\build\outputs\apk\debug\app-debug.apk` است

---

## 🔵 روش ۳: اجاره موقت (اگر روش ۱ و ۲ نشد)

### سایت‌های پیشنهادی
- GitHub Codespaces: https://github.com/features/codespaces
- Gitpod: https://gitpod.io
- Replit: https://replit.com

مراحل مشابه روش ۲ است ولی روی مرورگر.

---

## 📥 نصب APK روی گوشی

1. فایل APK را به گوشی منتقل کن (کابل USB، تلگرام، بلوتوث)
2. در گوشی: تنظیمات > امنیت > نصب از منابع ناشناس (فعال کن)
3. فایل APK را باز کن
4. نصب
5. آیکون My-Car روی صفحه اصلی

---

## 🆘 اگر مشکلی پیش آمد

1. **در همین چت به من بگو:** "در قدم X خطا دادم، متن خطا: [کپی کن]"
2. **اسکرین‌شات بفرست:** در چت می‌توانی تصویر آپلود کنی
3. **من قدم به قدم راهنمایی می‌کنم**

---

## 📝 یادآوری

- این فایل را هر جا می‌روی همراه داشته باش
- هر بار APK جدید می‌خواهی، فقط روش ۱ را تکرار کن (۵ دقیقه)
- برای نسخه‌های بعدی، فقط کد را در GitHub به‌روز کن و APK خودکار ساخته می‌شود
