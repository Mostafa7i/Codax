const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const publicVersionPath = path.resolve(__dirname, "../public/version.json");
let currentVersion = `2.0.${Date.now()}`;

if (fs.existsSync(publicVersionPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(publicVersionPath, "utf8"));
    if (data.version) currentVersion = data.version;
  } catch (e) {}
}

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.log(`ℹ️ [Update Version] الإصدار الحالي المنشور: ${currentVersion}`);
  console.log("⚠️ لم يتم العثور على serviceAccountKey.json، يعتمد التحديث على version.json التلقائي المنشور مع Firebase Hosting بنجاح.");
  process.exit(0);
}

try {
  const serviceAccount = require(serviceAccountPath);

  // تهيئة Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();

  // تحديث القيمة في Firestore لجميع العملاء المتصلين في الوقت الفعلي
  db.collection("configV")
    .doc("siteVersion")
    .set({
      version: currentVersion,
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
    })
    .then(() => {
      console.log(`✅ [Firestore] تم بث تحديث الإصدار الجديد في الوقت الفعلي إلى: ${currentVersion}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ خطأ أثناء تحديث Firestore:", err.message);
      process.exit(0);
    });
} catch (error) {
  console.warn("⚠️ حدث خطأ أثناء الاتصال بـ Firebase Admin:", error.message);
  process.exit(0);
}
