<div align="center">
  <br/>
  <img src="icon-192.svg" alt="CalcMaster Pro" width="96" height="96"/>
  <br/>
  <h1 align="center">🧮 CalcMaster Pro</h1>
  <p align="center">
    <strong>آلة حاسبة احترافية متعددة الوظائف</strong>
    <br/>
    <strong>Professional Multi‑Function Calculator</strong>
    <br/>
    <strong>Calculatrice Professionnelle Multifonction</strong>
  </p>
  <br/>

  <p align="center">
    <a href="#-المميزات">المميزات</a> •
    <a href="#-الوضعيات">الوضعيات</a> •
    <a href="#-التقنيات">التقنيات</a> •
    <a href="#-النشر">النشر</a> •
    <a href="#-التطوير">التطوير</a>
  </p>

  <br/>

  <p align="center">
    <img src="https://img.shields.io/badge/version-1.08-6c63ff?style=flat-square" alt="Version 1.08"/>
    <img src="https://img.shields.io/badge/PWA-ready-6c63ff?style=flat-square" alt="PWA Ready"/>
    <img src="https://img.shields.io/badge/license-MIT-6c63ff?style=flat-square" alt="MIT License"/>
    <img src="https://img.shields.io/badge/AR%20%7C%20FR%20%7C%20EN-6c63ff?style=flat-square" alt="Languages"/>
  </p>
</div>

---

## ✨ المميزات

| الميزة | الوصف |
|--------|-------|
| **⚡ PWA** | تثبت على الهاتف أو الحاسوب وتشتغل بدون إنترنت |
| **🌙 ثيم داكن/فاتح** | تبديل بين الوضع الليلي والنهاري |
| **📜 سجل العمليات** | حفظ آخر 100 عملية ونسخ النتيجة بنقرة |
| **⌨️ اختصارات لوحة المفاتيح** | اكتب الأرقام والعمليات من الكيبورد |
| **🔄 تحديث تلقائي** | يكتشف الإصدارات الجديدة ويحدث تلقائياً |
| **📱 متجاوب** | تصميم مناسب لجميع الشاشات (480px كحد أقصى) |
| **🌍 متعدد اللغات** | واجهة عربية + تحويل الأرقام لـ 3 لغات |
| **🖱️ Touch Optimized** | محسّن للمس مع تأثيرات الحركة |

---

## 🎯 الوضعيات

### 🔢 أساسي (Basic)
العمليات الحسابية الأساسية — الجمع، الطرح، الضرب، القسمة، النسبة المئوية، التبديل بين الإشارات.

### 🔬 علمي (Scientific)
دوال علمية متقدمة:

| الدالة | الوصف |
|--------|-------|
| `sin` / `cos` / `tan` | الدوال المثلثية (بالدرجات) |
| `log` / `ln` | اللوغاريتم العشري والطبيعي |
| `√` | الجذر التربيعي |
| `x²` / `x³` | التربيع والتكعيب |
| `xʸ` | الرفع إلى قوة |
| `π` / `e` | الثوابت الرياضية |
| `!` | المضروب (Factorial) |
| `1/x` | المقلوب |
| `\|x\|` | القيمة المطلقة |

### ✍️ كتابة الأرقام (Number to Words)
تحويل الأرقام إلى كتابة نصية بثلاث لغات:

| اللغة | مثال |
|-------|------|
| **🇸🇦 العربية** | `1٬500` ← *ألف وخمسمائة* |
| **🇫🇷 Français** | `1 500` ← *mille cinq cents* |
| **🇬🇧 English** | `1,500` ← *one thousand five hundred* |

> تدعم الأرقام حتى **999 مليار** مع الكسور العشرية.

---

## 🛠️ التقنيات

<div align="center">

| | |
|---|---|
| **الواجهة** | HTML5 + CSS3 (Custom Properties, Flexbox, Grid) |
| **المنطق** | Vanilla JavaScript (ES6+, IIFE pattern) |
| **PWA** | Service Worker + Web App Manifest + SVG Icons |
| **التخزين** | localStorage للحفظ والنسخ الاحتياطي للبيانات |
| **التصميم** | Glassmorphism + التدرجات اللونية + الظل المضيء |
| **النشر** | GitHub Pages (جاهز مع `.nojekyll`) |
| **الإصدارات** | نظام تلقائي لاكتشاف التحديثات ومسح الكاش |

</div>

---

## 🌐 النشر (GitHub Pages)

تم تجهيز المشروع بالفعل للنشر على GitHub Pages.

### يدوياً
1. اذهب إلى **Settings** → **Pages**
2. تحت **Branch**، اختر `main` والمجلد `/ (root)`
3. احفظ

### عبر الرابط
بعد التفعيل، التطبيق يتوفر على:
```
https://Ayad-Mounir.github.io/calcmaster-pro/
```

> ملاحظة: مسارات Service Worker (`sw.js`) مبنية على `/calcmaster-pro/` — إذا غيرت اسم الريبو، حدث المسارات في `sw.js` و `manifest.json`.

---

## 🧪 التطوير

```bash
# كلون الريبو
git clone https://github.com/Ayad-Mounir/calcmaster-pro.git

# شغّل local server (ضروري لـ PWA)
python3 -m http.server 8000

# أو باستخدام Node.js
npx serve .

# افتح المتصفح على
open http://localhost:8000
```

> `⚠️` **هام**: PWA يحتاج **HTTP/HTTPS محلي** (`localhost` أو `127.0.0.1`) — `file://` ما كاتشغلش الـ Service Worker.

### هيكل المشروع

```
calcmaster-pro/
├── index.html          # الصفحة الرئيسية
├── style.css           # الأنماط (Dark/Light + متجاوب)
├── script.js           # المنطق الكامل
├── sw.js               # Service Worker
├── manifest.json       # Web App Manifest
├── icon-192.svg        # أيقونة 192×192
├── icon-512.svg        # أيقونة 512×512
├── version.json        # ملف الإصدار
├── .nojekyll           # تعطيل Jekyll لـ GitHub Pages
└── README.md           # هذا الملف
```

---

## 📋 خريطة الطريق (Roadmap)

- [ ] **ردود الفعل اللمسية (Haptic Feedback)** للأجهزة المحمولة
- [ ] **الوضع الأفقي** (Landscape mode)
- [ ] **حافظة (Memory)** لحفظ الأرقام
- [ ] **وضع المبرمج (Programmer Mode)** — Bin/Oct/Hex
- [ ] **مخططات بيانية** للدوال العلمية
- [ ] **تصدير السجل** (CSV / PDF)
- [ ] **تطبيق موبايل** عبر PWA + Trusted Web Activity

---

## 📄 الترخيص

<div align="center">
  <p>هذا المشروع مرخص تحت <strong>MIT License</strong></p>
  <p>© 2026 <a href="https://github.com/Ayad-Mounir">Mounir Ayad</a></p>
</div>

---

<div align="center">
  <br/>
  <p>
    <strong>CalcMaster Pro</strong> — لأن الحسابات الحقيقية تحتاج آلة حاسبة حقيقية.
    <br/>
    <sub>بـ ✨ من <a href="https://github.com/Ayad-Mounir">@Ayad-Mounir</a></sub>
  </p>
  <br/>
</div>
