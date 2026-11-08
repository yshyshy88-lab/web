/**
 * ══════════════════════════════════════════════════════════════
 *  Rivo Store — ملف الإعدادات الوحيد
 * ══════════════════════════════════════════════════════════════
 *  عدّل القيم هنا. أي قيمة تضعها في متغيرات البيئة (Environment
 *  Variables) في Vercel تتقدّم على ما هو مكتوب هنا، فتقدر تترك
 *  هذا الملف للقيم العامة وتضع الأسرار في Vercel فقط.
 *
 *  الأسرار التي يجب وضعها في Vercel ولا تُكتب هنا أبدًا:
 *    DATABASE_URL · SESSION_SECRET · SMTP_PASS · STORE_WEBHOOK_SECRET
 * ══════════════════════════════════════════════════════════════
 */

const env = (key, fallback) => {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
};
const bool = (key, fallback) => {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v === 'true' || v === '1';
};
const num = (key, fallback) => {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && process.env[key] !== undefined && process.env[key] !== '' ? v : fallback;
};

export const config = {

  /* ─── هوية المتجر ─────────────────────────────────────── */
  store: {
    name:      env('STORE_NAME', 'Rivo Store'),
    tagline:   env('STORE_TAGLINE', 'مركز الدعم الفني'),
    // رابط الموقع بعد النشر، بدون / في النهاية
    publicUrl: env('PUBLIC_URL', 'http://localhost:3000'),
    // يظهر في تذييل الصفحة
    replyWithin: env('REPLY_WITHIN', 'الرد خلال 24 ساعة'),
    // رابط متجرك الأساسي (زر "رجوع للمتجر")
    shopUrl:   env('SHOP_URL', ''),
  },

  /* ─── قاعدة البيانات (Postgres) ────────────────────────
     في Vercel: Storage → Create → Postgres، والرابط يُضاف تلقائيًا.
     أو Neon.tech مجانًا: انسخ connection string إلى DATABASE_URL.     */
  databaseUrl: env('DATABASE_URL', env('POSTGRES_URL', '')),

  /* ─── أمان الجلسات ─────────────────────────────────────
     ولّده بـ: npm run setup   (أو  openssl rand -hex 32)            */
  sessionSecret: env('SESSION_SECRET', ''),
  session: {
    customerDays: num('CUSTOMER_SESSION_DAYS', 7),
    staffHours:   num('STAFF_SESSION_HOURS', 12),
  },

  /* ─── البريد (إرسال كود الدخول) ────────────────────────
     أي مزوّد SMTP: Zoho، Brevo، Mailgun، Resend، Gmail (كلمة مرور تطبيق). */
  smtp: {
    host:   env('SMTP_HOST', ''),
    port:   num('SMTP_PORT', 465),
    secure: bool('SMTP_SECURE', true),
    user:   env('SMTP_USER', ''),
    pass:   env('SMTP_PASS', ''),
    from:   env('MAIL_FROM', ''),
  },

  /* ─── كود التحقق ───────────────────────────────────────── */
  otp: {
    ttlMinutes:  num('OTP_TTL_MINUTES', 10),
    maxAttempts: num('OTP_MAX_ATTEMPTS', 5),
    resendAfterSeconds: num('OTP_RESEND_SECONDS', 60),
  },

  /* ─── ربط متجر رمز الرقمية ─────────────────────────────── */
  storeApi: {
    // 1) الويبهوك — ضع هذا في لوحة متجرك عند حدث "اكتمال الطلب":
    //    POST  {publicUrl}/webhook/store
    webhookSecret: env('STORE_WEBHOOK_SECRET', ''),
    // اسم ترويسة التوقيع التي يرسلها متجرك. اتركه فارغًا إذا لم يكن
    // متجرك يوقّع الطلبات، واستخدم pathToken بدلًا منه.
    signatureHeader: env('STORE_WEBHOOK_SIGNATURE_HEADER', ''),
    // بديل التوقيع: قيمة عشوائية طويلة، فيصير الرابط /webhook/store/<القيمة>
    pathToken: env('STORE_WEBHOOK_PATH_TOKEN', ''),

    // 2) خريطة الحقول — اسم الحقل في جسم الويبهوك الذي يرسله متجرك.
    //    المسارات المتداخلة بالنقطة: data.order.id  أو  items.0.name
    //    إذا لم تُطابق، سيردّ الخادم بـ 422 ويطبع لك أسماء الحقول الواصلة.
    map: {
      id:       env('MAP_ORDER_ID', 'id'),
      email:    env('MAP_ORDER_EMAIL', 'customer.email'),
      title:    env('MAP_ORDER_TITLE', 'product.name'),
      price:    env('MAP_ORDER_PRICE', 'total'),
      currency: env('MAP_ORDER_CURRENCY', 'currency'),
      status:   env('MAP_ORDER_STATUS', 'status'),
    },

    // 3) (اختياري) سحب الطلبات عبر REST بدل/مع الويبهوك
    base:        env('STORE_API_BASE', ''),
    key:         env('STORE_API_KEY', ''),
    ordersPath:  env('STORE_API_ORDERS_PATH', '/api/orders?email={email}'),
  },

  /* ─── رفع الصور ────────────────────────────────────────
     تُخزَّن في قاعدة البيانات. حد Vercel للطلب 4.5MB، فلا ترفع الحد
     فوق 4 إذا كنت على Vercel.                                        */
  uploads: {
    maxMB: num('MAX_UPLOAD_MB', 4),
    allowed: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },

  /* ─── تحديث المحادثة ───────────────────────────────────
     Vercel لا يدعم الاتصالات الطويلة، فالمحادثة تُحدَّث دوريًا.        */
  pollMs: num('POLL_MS', 3000),

  /* ─── حدود المعدّل (لكل عنوان IP أو بريد) ───────────────── */
  limits: {
    requestCode: { max: num('LIMIT_CODE', 5),  windowMinutes: 10 },
    verifyCode:  { max: num('LIMIT_VERIFY', 10), windowMinutes: 10 },
    staffLogin:  { max: num('LIMIT_LOGIN', 10), windowMinutes: 15 },
    sendMessage: { max: num('LIMIT_MSG', 30), windowMinutes: 1 },
    newTicket:   { max: num('LIMIT_TICKET', 10), windowMinutes: 60 },
    robloxLookup:{ max: num('LIMIT_ROBLOX', 20), windowMinutes: 1 },
  },
};

/** يتحقق من الإعدادات الأساسية ويعيد قائمة بالمشاكل. */
export function validateConfig() {
  const problems = [];
  if (!config.sessionSecret || config.sessionSecret.length < 32) {
    problems.push('SESSION_SECRET مفقود أو أقصر من 32 حرفًا. شغّل: npm run setup');
  }
  if (!config.databaseUrl) {
    problems.push('DATABASE_URL مفقود. أنشئ قاعدة Postgres من Vercel → Storage، أو من neon.tech');
  }
  if (!config.smtp.host) {
    problems.push('SMTP غير مهيأ — سيُطبع كود التحقق في سجل الخادم بدل إرساله بالبريد.');
  }
  if (!config.storeApi.signatureHeader && !config.storeApi.pathToken) {
    problems.push('الويبهوك غير محمي — اضبط signatureHeader أو pathToken في config.js');
  }
  return problems;
}

export default config;
