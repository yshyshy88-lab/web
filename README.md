# Rivo Store — مركز الدعم الفني

موقع دعم فني كامل يعمل على **Vercel**: العميل يدخل ببريده، يصله كود تحقق،
يشوف طلباته الحقيقية من متجرك، يؤكد حساب روبلوكس بصورته الحقيقية،
ثم تُفتح تذكرة فيها محادثة مع فريق الدعم وإرسال الصور — وكل شيء محفوظ.

---

## الملف الذي تعدّله

كل الإعدادات في ملف واحد: **`config.js`**
اسم المتجر، خريطة حقول الويبهوك، مدة صلاحية الكود، حدود المعدّل، حجم الصور… كلها هناك.

الأسرار فقط (`DATABASE_URL`، `SESSION_SECRET`، `SMTP_PASS`، `STORE_WEBHOOK_SECRET`)
تُوضع في ملف `.env` محليًا، أو في Environment Variables على Vercel.
أي متغيّر بيئة يتقدّم على قيمة `config.js`.

---

## أولًا: التشغيل على جهازك (ويندوز)

```bat
npm install
npm run setup
```

`npm run setup` ينشئ `.env` ويولّد `SESSION_SECRET` تلقائيًا — ما تحتاج openssl.

بعدها افتح `.env` وضع:

1. **`DATABASE_URL`** — أنشئ قاعدة Postgres مجانية من [neon.tech](https://neon.tech)
   وانسخ رابط الاتصال. يبدأ بـ `postgresql://`
2. **بيانات SMTP** — حتى يصل كود الدخول بالبريد.
   إن تركتها فارغة سيُطبع الكود في نافذة الأوامر، وهذا مفيد أثناء التجربة.

ثم:

```bat
npm run staff:add -- rivo "كلمة-مرور-قوية-جدا" "فريق الدعم"
npm start
```

- موقع العملاء: `http://localhost:3000`
- لوحة الدعم: `http://localhost:3000/admin`

> الجداول تُنشأ تلقائيًا في قاعدة البيانات عند أول تشغيل.

---

## ثانيًا: الرفع على Vercel

### 1. ارفع المشروع على GitHub

```bat
git init
git add .
git commit -m "Rivo Store support"
git branch -M main
git remote add origin https://github.com/<حسابك>/rivo-support.git
git push -u origin main
```

> ملف `.env` مستثنى في `.gitignore` ولن يُرفع. هذا مقصود.

### 2. أنشئ المشروع في Vercel

[vercel.com/new](https://vercel.com/new) → اختر المستودع → **Deploy**.
لا تحتاج ضبط Build Command ولا Output Directory؛ ملف `vercel.json` يتكفّل بذلك.

### 3. أنشئ قاعدة البيانات

في Vercel: **Storage → Create Database → Postgres** واربطها بالمشروع.
سيُضاف `DATABASE_URL` تلقائيًا. أو استخدم Neon وضع الرابط يدويًا.

### 4. أضف متغيّرات البيئة

**Settings → Environment Variables**، واختر البيئات الثلاث (Production, Preview, Development):

| المتغيّر | القيمة |
|---|---|
| `SESSION_SECRET` | انسخه من ملف `.env` المحلي، أو ولّد ٦٤ حرفًا عشوائيًا |
| `DATABASE_URL` | يُضاف تلقائيًا مع Vercel Postgres |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | بيانات بريدك |
| `PUBLIC_URL` | `https://نطاقك.vercel.app` |
| `STORE_WEBHOOK_SECRET` أو `STORE_WEBHOOK_PATH_TOKEN` | حماية الويبهوك |

ثم **Redeploy**.

### 5. أنشئ حساب موظف على قاعدة الإنتاج

من جهازك، ضع `DATABASE_URL` الخاص بالإنتاج في `.env` مؤقتًا ثم:

```bat
npm run staff:add -- rivo "كلمة-مرور-قوية-جدا" "فريق الدعم"
```

---

## ثالثًا: ربط متجر رمز الرقمية

### الويبهوك (الطريقة الأساسية)

في لوحة متجرك، أضف ويبهوك على حدث **اكتمال الطلب / الدفع** إلى:

```
POST  https://نطاقك.vercel.app/webhook/store
```

واختر طريقة الحماية:

| إذا كان متجرك… | الإعداد |
|---|---|
| يوقّع الطلبات (HMAC-SHA256) | `STORE_WEBHOOK_SECRET` + في config.js: `signatureHeader: 'x-signature'` |
| لا يوقّع | اترك `signatureHeader` فارغًا، وضع `STORE_WEBHOOK_PATH_TOKEN` بقيمة عشوائية طويلة — فيصير الرابط `…/webhook/store/<القيمة>` |

### خريطة الحقول

نفّذ عملية شراء تجريبية وراقب سجل Vercel (**Deployments → Logs**).
إذا لم تُطابق الحقول سيردّ الخادم بـ `422` ويطبع لك أسماء الحقول التي وصلته.
انسخها إلى `config.js`:

```js
map: {
  id:    'data.order_id',
  email: 'data.customer.email',
  title: 'data.items.0.name',
  …
}
```

المسارات المتداخلة مدعومة بالنقطة، والأرقام تعني عناصر المصفوفة.

### تحويل العميل بعد الشراء

في صفحة "شكرًا لك" بمتجرك، ضع زرًا يوجّه إلى `https://نطاقك.vercel.app`.

### (اختياري) السحب عبر REST

إذا كان لمتجرك API لجلب الطلبات، املأ `STORE_API_BASE` و`STORE_API_KEY`
و`ordersPath` في `config.js`. سيُستخدم عند كل دخول بالإضافة إلى الويبهوك.

---

## ما الذي تغيّر ليعمل على Vercel

Vercel بلا قرص دائم وبلا اتصالات طويلة، فالمعمارية:

| بدلًا من | أصبح |
|---|---|
| SQLite على القرص | Postgres (`pg`) |
| رفع الصور لمجلد `uploads/` | تُخزَّن في قاعدة البيانات وتُقدَّم عبر `/api/images/<id>` |
| البث المباشر SSE | تحديث دوري كل ٣ ثوانٍ (يتوقف حين تكون النافذة مخفية) |
| حدود معدّل في الذاكرة | حدود في قاعدة البيانات، تعمل عبر كل النسخ |

> **حد Vercel للطلب 4.5 ميجابايت**، فلا ترفع `maxMB` فوق 4 في `config.js`.

---

## الحماية المطبّقة

- كود تحقق لمرة واحدة، مخزَّن مجزّأً بـ HMAC، صالح ١٠ دقائق، ٥ محاولات
- لا يُرسل كود إلا لبريد له طلب فعلي، والرد واحد في الحالتين حتى لا يُكشف أي بريد مسجَّل
- حدود معدّل على: طلب الكود (بالـ IP وبالبريد)، التحقق، الرسائل، فتح التذاكر، البحث في روبلوكس، دخول الموظفين
- جلسات بكوكيز `httpOnly` + `SameSite=Strict` + `Secure`، موقّعة بـ HMAC-SHA256
- كلمات مرور الموظفين بـ scrypt
- الويبهوك يُتحقق منه على البايتات الخام بمقارنة ثابتة الزمن
- `helmet` مع CSP صارمة، ومنع تضمين الموقع في إطار
- الصور: نوع مسموح فقط، معرّف عشوائي ١٢٨ بت غير قابل للتخمين، حد حجم
- كل استعلامات قاعدة البيانات مُعاملات مُجهّزة (لا حقن SQL)
- كل النصوص تُدرج بـ `textContent` (لا XSS)
- العميل لا يصل إلا لتذاكره هو — تُفحص الملكية في كل مسار

---

## قائمة ما قبل الإطلاق

- [ ] `SESSION_SECRET` عشوائي ٦٤ حرفًا على Vercel
- [ ] `DATABASE_URL` مربوط
- [ ] SPF و DKIM لنطاق البريد حتى لا تذهب الأكواد للمهملات
- [ ] حماية الويبهوك مضبوطة (توقيع أو pathToken)
- [ ] عملية شراء تجريبية للتأكد من خريطة الحقول
- [ ] حساب موظف واحد على الأقل

---

## بنية المشروع

```
config.js            ← كل الإعدادات هنا
api/index.js         ← نقطة دخول Vercel
vercel.json          ← توجيه الطلبات
src/
  app.js             بناء تطبيق Express والحماية
  server.js          التشغيل المحلي
  db.js              Postgres، الجداول، حدود المعدّل
  auth.js            الجلسات، كلمات المرور، أكواد التحقق
  mail.js            رسالة كود الدخول
  roblox.js          جلب حساب روبلوكس وصورته
  store.js           خريطة حقول المتجر والسحب عبر REST
  images.js          رفع الصور وتقديمها
  routes/
    customer.js      واجهة العميل
    admin.js         واجهة فريق الدعم
    webhook.js       استقبال الطلبات من المتجر
  scripts/
    setup.js         إعداد أولي وتوليد المفتاح
    add-staff.js     إنشاء حسابات الدعم
public/
  index.html app.js  موقع العملاء
  admin.html admin.js لوحة الدعم
  app.css            التصميم
```
