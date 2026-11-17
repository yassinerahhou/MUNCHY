# Hostinger Deployment & Admin Security Guide (دليل النشر على هوستينجر والدخول للوحة التحكم)

---

## 1. كيفاش تدخل لـ Admin وماتبانش للناس (How to Access the Hidden Admin Panel)

> **Important**: The `/admin` link has been **completely removed** from all public visitor menus and footers. Regular customers browsing the website will never see or know about this link. In addition, `robots.txt` has been configured to disallow search engine crawlers from indexing `/admin`.

### أ) كيفاش كيدخل المدير / الشاف ديال الكوزينة (How the Owner Logs In):
1. **كتب الرابط مباشرة فالمتصفح (Direct URL in Browser)**:
   ```
   https://your-domain.com/admin
   ```
   (أو محلياً: `http://localhost:3000/admin`)

2. **كلمة السر (Password)**:
   - **محلياً (Development)**: كلمة السر الافتراضية هي:
     ```
     munchy-demo-2026
     ```
   - **على هوستينجر (Production on Hostinger)**:
     كتحدد كلمة سر قوية وسرية فملف `.env` ديالك:
     ```env
     ADMIN_PASSWORD=MunchyCasa2026SecretK1tch3n!
     ADMIN_SESSION_SECRET=a8f9c2d1e4b7890123456789abcdef0123456789abcdef0123456789abcdef01
     ```

3. **الخصائص الجديدة لي زدنا فـ Kitchen Desk**:
   - 🔔 **تنبيه صوتي (Sound Chime)**: فاش كيوصل شي طلب جديد، كيتسمع صوت جرس (Chime) نقي ومسموع باش الشاف يسمعو فالكوزينة بلا ما يبقى حاضي الشاشة.
   - 📡 **تحديث تلقائي (Live Auto-refresh 20s)**: الصفحة كتحدث راسها كل 20 ثانية بلا ما تحتاج تكليكي على Refresh.
   - 🖨️ **طبع البون (Thermal KOT Ticket Printing)**: كليك على زر **Print** فكل كوموند، كيطبع وصل مخصص ومضبوط للطابعات الحرارية (58mm / 80mm ESC/POS).
   - 💬 **مراسلة الزبون فالواتساب بكليك واحد (WhatsApp Customer)**: زر كيديك نيشان للواتساب مع الزبون باش تسولو على العنوان أو تأكد معاه.
   - 📥 **تحميل تقرير المبيعات (Export CSV)**: كليك على **Export CSV** باش تنزل ملف Excel/CSV فيه كاع الطلبات والمداخيل اليومية.

---

## 2. خطوات النشر على هوستينجر (Deployment Steps on Hostinger)

سواء عندك **Hostinger VPS** أو **Hostinger Cloud / Node.js Application**، هاهي الخطوات بالتفصيل:

### الخطوة 1: إعداد قاعدة البيانات MySQL في Hostinger hPanel
1. دخل لـ **Hostinger hPanel** > **Databases** > **MySQL Databases**.
2. أنشئ قاعدة بيانات جديدة:
   - **Database Name**: e.g., `u123456789_munchy`
   - **Username**: e.g., `u123456789_admin`
   - **Password**: اختار كلمة سر قوية وسجلها عندك.
3. دخل لـ **phpMyAdmin**، واختار قاعدة البيانات ديالك، وكليكي على **Import**.
4. استورد ملف `db/schema.sql` الموجود فالمشروع ديالك. هاد الملف كينشئ الجداول:
   - `munchy_orders` (طلبات الزبائن)
   - `munchy_catering_leads` (طلبات التريتور والمناسبات)
   *(جداول المحتوى `munchy_content` والصور `munchy_media` كيتنشؤو تلقائياً)*.

---

### الخطوة 2: رفع المشروع وإعداد ملف `.env`
1. ارفع ملفات المشروع إلى السيرفر (عبر Git أو File Manager أو SSH).
2. فالمجلد الرئيسي ديال المشروع، أنشئ ملف بسمية `.env` (أو عدل إعدادات البيئة في hPanel Node.js):
   ```env
   NODE_ENV=production
   PORT=3000

   # Database settings from Hostinger hPanel
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=u123456789_munchy
   DB_USER=u123456789_admin
   DB_PASSWORD=YourStrongDatabasePasswordHere

   # Secret admin credentials (لا تشاركها مع أي شخص)
   ADMIN_PASSWORD=YourCustomSecretAdminPassword2026!
   ADMIN_SESSION_SECRET=c5f7e912a8435d023b18972f04acb679148d25167e9f3b821465a0b73c2e1f48

   # WhatsApp Business number (المغرب: 212 متبوعة برقمك بلا + ولا صفر)
   MUNCHY_WHATSAPP_NUMBER=212600000000
   ```

---

### الخطوة 3: تثبيت الحزم وبناء المشروع (Build)
عبر الـ Terminal / SSH في مجلد المشروع:
```bash
# 1. تثبيت الحزم
npm install --omit=dev

# 2. بناء تطبيق Next.js
npm run build
```

---

### الخطوة 4: تشغيل التطبيق بـ PM2
المشروع مزود بملف جاهز `ecosystem.config.cjs`:
```bash
# تشغيل التطبيق في الخلفية
pm2 start ecosystem.config.cjs

# جعله يشتغل تلقائياً عند إعادة تشغيل السيرفر
pm2 save
pm2 startup
```

---

### الخطوة 5: ربط الدومين وتفعيل شهادة SSL
1. فـ Hostinger hPanel، تأكد أن الدومين ديالك (مثلاً `munchy.ma`) موجه للسيرفر.
2. فعل شهادة الأمان المجانية **Let's Encrypt SSL** من تبويب **Security** فـ hPanel.
3. دابا الموقع ديالك خدام رسمي ومحمي بـ HTTPS!

---

## 3. ملخص التحسينات المنفذة (What was Implemented)

1. **Kitchen Desk**: Auto-refresh كل 20 ثانية، تنبيه صوتي عند وصول طلب جديد، طبع البون الحراري KOT، زر مراسلة الزبون عبر واتساب، وتصدير الطلبات CSV.
2. **Multi-Language Switcher**: دعم كامل لـ **الدارجة المغربية / العربية (AR)** و **الفرنسية (FR)** و **الإنجليزية (EN)** مع دعم اتجاه الكتابة من اليمين لليسار (RTL) وحفظ اللغة تلقائياً.
3. **Checkout Conveniences**: حفظ تلقائي لمعلومات الزبون (الاسم، الهاتف، العنوان) فـ `localStorage` لتعبئتها بضغطة زر فكل طلب لاحق + إمكانية استبدال 100 نقطة بخصم 10 دراهم + مؤشر ساعات العمل الحية لكازابلانكا.
4. **PWA & Local SEO**: ملف `manifest.json`، أيقونة التطبيق `icon.svg`، وإعدادات Schema.org JSON-LD الخاصة بمطاعم الوجبات السريعة فالمعاريف كازابلانكا لظهور الموقع في بحث Google المحلي.
5. **إخفاء صفحة الإدارة**: إزالة أي رابط لـ `/admin` من واجهة الزبائن وحظر الأرشفة في `robots.txt`.
6. **تنظيم المشروع**: تنظيف المجلد الرئيسي ونقل كافة السكربتات المؤقتة إلى `scripts/` وتهيئة Git.
