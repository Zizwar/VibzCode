# VibZcode Landing Page

صفحة تعريفية لمشروع VibZcode - منصة تحليل واستكشاف الكود بالذكاء الاصطناعي.

## 🚀 Deploy على Deno Deploy

### الطريقة الأولى: من خلال Dashboard (الأسهل)

1. اذهب إلى [dash.deno.com](https://dash.deno.com/)
2. سجّل الدخول بحساب GitHub
3. اضغط **New Project**
4. اختر repository: `Zizwar/VibzCode`
5. في الإعدادات:
   - **Entrypoint**: `docs/main.ts`
   - **Root directory**: `docs`
6. اضغط **Link**

### الطريقة الثانية: باستخدام deployctl

```bash
# من داخل مجلد docs
cd docs

# تثبيت deployctl
deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts

# Deploy
deployctl deploy --project=vibzcode-landing main.ts
```

### الطريقة الثالثة: GitHub Actions (تلقائي)

الـ workflow موجود في `.github/workflows/deno-deploy.yml` - سيعمل تلقائياً عند push إلى main.

فقط تحتاج:
1. إنشاء project في Deno Deploy اسمه `vibzcode-landing`
2. ربطه بـ GitHub repository
3. كل push سيتم deploy تلقائياً

## 🧪 تجربة محلياً

```bash
cd docs
deno task start
```

أو:

```bash
deno run --allow-net --allow-read main.ts
```

ثم افتح: http://localhost:8000

## 📁 الملفات

- `main.ts` - Hono server لتقديم الملفات الثابتة
- `deno.json` - إعدادات Deno
- `index.html` - الصفحة الرئيسية
- `pages/images/` - الصور والأصول

## 🔗 الروابط

- **التطبيق**: https://app.vibzcode.com
- **GitHub**: https://github.com/Zizwar/VibzCode
- **المطور**: https://brah.im
