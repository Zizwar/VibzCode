# 🚀 دليل النشر - Deployment Guide

## خيارات النشر المتاحة

### 1. Vercel (موصى به - مجاني)

#### الطريقة السريعة:
```bash
# ثبت Vercel CLI
npm i -g vercel

# سجل دخول
vercel login

# نشر المشروع
vercel
```

#### عبر الواجهة:
1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اختر "Import Project"
4. اختر مستودع `zip2prompt`
5. اختر البرانش: `claude/review-claude-md-011CUja6tTUDR3Xtt8CHScPF`
6. أضف متغيرات البيئة (اختياري):
   - `OPENROUTER_API_KEY`
   - `MONGODB_URI`
7. اضغط Deploy!

### 2. Railway (مجاني)

```bash
# ثبت Railway CLI
npm i -g @railway/cli

# سجل دخول
railway login

# أنشئ مشروع جديد
railway init

# نشر
railway up
```

### 3. Render (مجاني)

1. اذهب إلى [render.com](https://render.com)
2. "New +" → "Web Service"
3. اربط حساب GitHub
4. اختر المستودع
5. اضبط:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. أضف Environment Variables
7. Deploy!

### 4. Heroku

```bash
# ثبت Heroku CLI
npm install -g heroku

# سجل دخول
heroku login

# أنشئ تطبيق
heroku create zip2prompt-app

# أضف متغيرات البيئة
heroku config:set STORAGE_MODE=local

# نشر
git push heroku claude/review-claude-md-011CUja6tTUDR3Xtt8CHScPF:main
```

### 5. DigitalOcean App Platform

1. سجل دخول إلى [DigitalOcean](https://digitalocean.com)
2. اذهب إلى App Platform
3. "Create App"
4. اربط GitHub
5. اختر المستودع والبرانش
6. سيتم رصد `package.json` تلقائياً
7. Deploy!

## متغيرات البيئة الضرورية

```env
# أساسية
PORT=8080
NODE_ENV=production
STORAGE_MODE=local

# للـ AI (اختياري)
OPENROUTER_API_KEY=your_key_here

# للـ MongoDB (اختياري)
MONGODB_URI=your_mongodb_connection_string
```

## ملاحظات مهمة

### Vercel
- ✅ نشر تلقائي مع كل push
- ✅ SSL مجاني
- ✅ CDN عالمي
- ⚠️ Serverless - قد تحتاج تعديل بسيط

### Railway
- ✅ دعم MongoDB مدمج
- ✅ لوحة تحكم ممتازة
- ✅ Domain مجاني

### Render
- ✅ مجاني تماماً
- ✅ سهل جداً
- ⚠️ قد يكون بطيء عند البدء (Cold Start)

## التحقق من النشر

بعد النشر، تحقق من:
1. ✅ الصفحة الرئيسية تفتح
2. ✅ رفع ملف ZIP يعمل
3. ✅ شجرة الملفات تظهر
4. ✅ استخراج الملفات يعمل
5. ✅ (اختياري) AI Chat يعمل إذا أضفت API Key

## الحصول على HTTPS مجاني

جميع المنصات المذكورة توفر HTTPS مجاناً تلقائياً! 🎉

## Domain مخصص (اختياري)

معظم المنصات تسمح لك بربط domain مخصص مجاناً:
```
zip2prompt.yourdomain.com
```

## مثال: النشر على Vercel خطوة بخطوة

```bash
# 1. استنسخ المشروع
git clone https://github.com/Zizwar/zip2prompt.git
cd zip2prompt

# 2. انتقل للبرانش الصحيح
git checkout claude/review-claude-md-011CUja6tTUDR3Xtt8CHScPF

# 3. نشر
npx vercel

# 4. اتبع التعليمات:
# - Link to existing project? No
# - Project name? zip2prompt
# - Directory? ./
# - Auto-detected settings? Yes
# - Deploy? Yes

# 5. احصل على الرابط!
# https://zip2prompt-xxx.vercel.app
```

## الدعم

إذا واجهت أي مشكلة:
1. تحقق من logs المنصة
2. تأكد من متغيرات البيئة
3. تأكد من `package.json` صحيح
4. راجع [README.md](./README.md)

---

🎉 **مبروك! مشروعك الآن منشور ومتاح للعالم!**
