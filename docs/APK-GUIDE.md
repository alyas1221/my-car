# 📱 راهنمای ساخت APK برای My-Car

## پیش‌نیازها

| مورد | حداقل |
|------|--------|
| Java | JDK 17 |
| Android SDK | cmdline-tools + platform-tools + platform-34 + build-tools-34 |
| RAM آزاد | ۳ گیگابایت |
| دیسک آزاد | ۵ گیگابایت |

## روش ۱: روی سیستم شخصی (توصیه‌شده)

```bash
# 1) نصب Android Studio از https://developer.android.com/studio
# 2) پروژه را با scp منتقل کنید:
scp -r dedhban@62.11.22.207:/opt/my-scripts/my-car/android ./
# 3) در Android Studio باز کنید و Build > Build APK
```

## روش ۲: روی سرور (پرریسک، منابع کم)

```bash
# 1) نصب Java 17
sudo apt install openjdk-17-jdk

# 2) نصب Android SDK
mkdir -p ~/android-sdk
cd ~/android-sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/bin cmdline-tools/lib cmdline-tools/source.properties cmdline-tools/latest/ 2>/dev/null || true

# 3) تنظیم PATH
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 4) نصب پکیج‌ها
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 5) ساخت APK
cd /opt/my-scripts/my-car
bash scripts/build-apk.sh
```

## روش ۳: GitHub Actions (رایگان، ابری)

فایل `.github/workflows/build-apk.yml` را ساخته‌ایم. با push به GitHub، APK خودکار ساخته می‌شود.

## خروجی

```
android/app/build/outputs/apk/debug/app-debug.apk
backups/my-car-YYYYMMDD-HHMM.apk
```

## نصب APK روی گوشی

1. فایل APK را به گوشی منتقل کنید (کابل، بلوتوث، تلگرام)
2. در گوشی: تنظیمات > امنیت > نصب از منابع ناشناس را فعال کنید
3. روی فایل APK بزنید > نصب

## امضای APK (برای Google Play)

```bash
keytool -genkey -v -keystore my-car.keystore -alias my-car -keyalg RSA -keysize 2048 -validity 10000
# سپس در android/app/build.gradle امضا را تنظیم کنید
```
